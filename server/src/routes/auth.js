const { Router } = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');
const authMiddleware = require('../authMiddleware');
const emailService = require('../emailService');
const { verifyTurnstile } = require('../turnstile');

const router = Router();
const SALT_ROUNDS = 12;

/** 6자리 숫자 인증 코드 생성 */
function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** URL-safe 랜덤 토큰 생성 (32바이트 → 64자 hex 문자열) */
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 임시 비밀번호 생성 (12자, 영문+숫자+특수문자).
 * 혼동하기 쉬운 문자(l, I, 1, O, 0)를 제외합니다.
 * rejection sampling으로 모듈러 바이어스를 방지합니다.
 */
function generateTempPassword() {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  const charsLen = chars.length;
  let result = '';
  while (result.length < 12) {
    const byte = crypto.randomBytes(1)[0];
    // rejection sampling: 256을 charsLen으로 나눈 나머지 바이어스를 제거
    if (byte < Math.floor(256 / charsLen) * charsLen) {
      result += chars[byte % charsLen];
    }
  }
  return result;
}

/** JWT 토큰 생성 헬퍼 */
function generateJwtToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

/** POST /auth/register – 회원가입 (이메일 인증 필요, Turnstile 검증 포함) */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, turnstileToken } = req.body;

    // Turnstile 검증
    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid) {
      return res.status(403).json({ message: '보안 인증에 실패했습니다. 다시 시도해주세요.' });
    }

    if (!email || !password || !username) {
      return res.status(400).json({ message: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.' });
    }

    if (!/^[가-힣a-zA-Z0-9 ]{2,20}$/.test(username) || username !== username.trim()) {
      return res.status(400).json({ message: '닉네임은 2~20자의 한글·영문·숫자·띄어쓰기만 사용 가능합니다. (앞뒤 공백 불가)' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: '비밀번호는 8자 이상이어야 합니다.' });
    }

    // 이메일 중복 확인
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email],
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: '이미 등록된 이메일입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, username, email_verified) VALUES (?, ?, ?, 0)',
      [email, hashedPassword, username],
    );

    const userId = result.insertId;

    // 인증 토큰/코드 생성 및 저장
    const code = generateVerificationCode();
    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

    await pool.execute(
      'INSERT INTO email_verification_tokens (user_id, token, code, expires_at) VALUES (?, ?, ?, ?)',
      [userId, token, code, expiresAt],
    );

    // 인증 메일 발송
    const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
    await emailService.sendVerificationEmail(email, code, verifyUrl);

    res.status(201).json({ message: '인증 메일이 발송되었습니다. 이메일을 확인해주세요.', needsVerification: true });
  } catch (err) {
    console.error('회원가입 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** POST /auth/verify-email – 이메일 인증 (토큰 또는 코드) */
router.post('/verify-email', async (req, res) => {
  try {
    const { token, code, email } = req.body;

    if (!token && (!code || !email)) {
      return res.status(400).json({ message: '인증 토큰 또는 인증 코드와 이메일을 입력해주세요.' });
    }

    let rows;
    if (token) {
      [rows] = await pool.execute(
        'SELECT evt.*, u.email, u.username FROM email_verification_tokens evt JOIN users u ON u.id = evt.user_id WHERE evt.token = ? AND evt.expires_at > NOW()',
        [token],
      );
    } else {
      [rows] = await pool.execute(
        'SELECT evt.*, u.email, u.username FROM email_verification_tokens evt JOIN users u ON u.id = evt.user_id WHERE u.email = ? AND evt.code = ? AND evt.expires_at > NOW()',
        [email, code],
      );
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: '유효하지 않거나 만료된 인증 정보입니다.' });
    }

    const record = rows[0];

    // 이메일 인증 완료 처리
    await pool.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [record.user_id]);
    // 사용한 토큰 삭제
    await pool.execute('DELETE FROM email_verification_tokens WHERE user_id = ?', [record.user_id]);

    // 인증 완료 후 자동 로그인
    const user = { id: String(record.user_id), email: record.email, username: record.username };
    const jwtToken = generateJwtToken(user);

    const [userRows] = await pool.execute(
      'SELECT password, x_id, mastodon_id FROM users WHERE id = ?',
      [record.user_id],
    );

    res.json({
      token: jwtToken,
      user: {
        ...user,
        hasPassword: !!userRows[0]?.password,
        xLinked: !!userRows[0]?.x_id,
        mastodonLinked: !!userRows[0]?.mastodon_id,
      },
    });
  } catch (err) {
    console.error('이메일 인증 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** POST /auth/resend-verification – 인증 메일 재발송 (Turnstile 검증 포함) */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email, turnstileToken } = req.body;
    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    // Turnstile 검증
    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid) {
      return res.status(403).json({ message: '보안 인증에 실패했습니다. 다시 시도해주세요.' });
    }

    const [users] = await pool.execute(
      'SELECT id, email_verified FROM users WHERE email = ?',
      [email],
    );

    if (users.length === 0) {
      // 보안상 이메일 존재 여부를 노출하지 않음
      return res.json({ message: '등록된 이메일이라면 인증 메일이 발송됩니다.' });
    }

    if (users[0].email_verified) {
      return res.json({ message: '이미 인증이 완료된 이메일입니다.' });
    }

    // 기존 토큰 삭제 후 새로 생성
    await pool.execute('DELETE FROM email_verification_tokens WHERE user_id = ?', [users[0].id]);

    const code = generateVerificationCode();
    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.execute(
      'INSERT INTO email_verification_tokens (user_id, token, code, expires_at) VALUES (?, ?, ?, ?)',
      [users[0].id, token, code, expiresAt],
    );

    const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
    await emailService.sendVerificationEmail(email, code, verifyUrl);

    res.json({ message: '인증 메일이 발송되었습니다.' });
  } catch (err) {
    console.error('인증 메일 재발송 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** POST /auth/login – 로그인 (Turnstile 검증 포함) */
router.post('/login', async (req, res) => {
  try {
    const { email, password, turnstileToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    // Turnstile 검증
    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid) {
      return res.status(403).json({ message: '보안 인증에 실패했습니다. 다시 시도해주세요.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, email, password, username, x_id, mastodon_id, email_verified FROM users WHERE email = ?',
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const userRow = rows[0];
    const passwordMatch = await bcrypt.compare(password, userRow.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 이메일 인증 확인
    if (!userRow.email_verified) {
      return res.status(403).json({ message: '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.', needsVerification: true, email: userRow.email });
    }

    const user = {
      id: String(userRow.id),
      email: userRow.email,
      username: userRow.username,
      hasPassword: !!userRow.password,
      xLinked: !!userRow.x_id,
      mastodonLinked: !!userRow.mastodon_id,
    };
    const jwtToken = generateJwtToken(user);

    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error('로그인 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** POST /auth/logout – 로그아웃 (클라이언트 토큰 무효화는 클라이언트에서 처리) */
router.post('/logout', (_req, res) => {
  res.status(204).end();
});

/** GET /auth/me – 현재 사용자 정보 (비밀번호 보유 여부, X 연동 여부, 마스토돈 연동 여부 포함) */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, username, password, x_id, mastodon_id FROM users WHERE id = ?',
      [req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const row = rows[0];
    res.json({
      id: String(row.id),
      email: row.email,
      username: row.username,
      hasPassword: !!row.password,
      xLinked: !!row.x_id,
      mastodonLinked: !!row.mastodon_id,
    });
  } catch (err) {
    console.error('사용자 정보 조회 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** PUT /auth/username – 닉네임 변경 (중복 허용) */
router.put('/username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: '닉네임을 입력해주세요.' });
    }

    if (!/^[가-힣a-zA-Z0-9 ]{2,20}$/.test(username) || username !== username.trim()) {
      return res.status(400).json({ message: '닉네임은 2~20자의 한글·영문·숫자·띄어쓰기만 사용 가능합니다. (앞뒤 공백 불가)' });
    }

    await pool.execute(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, req.user.id],
    );

    const user = { id: req.user.id, email: req.user.email, username };
    const token = generateJwtToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error('닉네임 변경 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** PUT /auth/password – 비밀번호 변경 */
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: '새 비밀번호는 8자 이상이어야 합니다.' });
    }

    const [rows] = await pool.execute(
      'SELECT password, email FROM users WHERE id = ?',
      [req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const userRow = rows[0];

    // 비밀번호가 있는 사용자는 현재 비밀번호 확인 필요
    if (userRow.password) {
      if (!currentPassword) {
        return res.status(400).json({ message: '현재 비밀번호를 입력해주세요.' });
      }
      const match = await bcrypt.compare(currentPassword, userRow.password);
      if (!match) {
        return res.status(401).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
      }
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashed, req.user.id],
    );

    // 비밀번호 변경 알림 메일 발송
    try {
      await emailService.sendPasswordChangeNotification(userRow.email);
    } catch (emailErr) {
      console.error('비밀번호 변경 알림 메일 발송 실패:', emailErr.message);
    }

    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    console.error('비밀번호 변경 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** POST /auth/request-email-change – 이메일 변경 요청 (인증 메일 발송) */
router.post('/request-email-change', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    // 이메일 중복 확인
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, req.user.id],
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: '이미 등록된 이메일입니다.' });
    }

    // 기존 토큰 삭제
    await pool.execute('DELETE FROM email_change_tokens WHERE user_id = ?', [req.user.id]);

    const code = generateVerificationCode();
    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.execute(
      'INSERT INTO email_change_tokens (user_id, new_email, token, code, expires_at) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, email, token, code, expiresAt],
    );

    const verifyUrl = `${config.frontendUrl}/verify-email-change?token=${token}`;
    await emailService.sendEmailChangeVerification(email, code, verifyUrl);

    res.json({ message: '변경할 이메일로 인증 메일이 발송되었습니다.' });
  } catch (err) {
    console.error('이메일 변경 요청 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** POST /auth/verify-email-change – 이메일 변경 인증 완료 */
router.post('/verify-email-change', async (req, res) => {
  try {
    const { token, code, email: reqEmail } = req.body;

    if (!token && (!code || !reqEmail)) {
      return res.status(400).json({ message: '인증 토큰 또는 인증 코드와 이메일을 입력해주세요.' });
    }

    let rows;
    if (token) {
      [rows] = await pool.execute(
        'SELECT ect.*, u.email as old_email, u.username FROM email_change_tokens ect JOIN users u ON u.id = ect.user_id WHERE ect.token = ? AND ect.expires_at > NOW()',
        [token],
      );
    } else {
      [rows] = await pool.execute(
        'SELECT ect.*, u.email as old_email, u.username FROM email_change_tokens ect JOIN users u ON u.id = ect.user_id WHERE ect.new_email = ? AND ect.code = ? AND ect.expires_at > NOW()',
        [reqEmail, code],
      );
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: '유효하지 않거나 만료된 인증 정보입니다.' });
    }

    const record = rows[0];

    // 이메일 중복 재확인
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [record.new_email, record.user_id],
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: '이미 등록된 이메일입니다.' });
    }

    // 이메일 변경
    await pool.execute('UPDATE users SET email = ? WHERE id = ?', [record.new_email, record.user_id]);
    await pool.execute('DELETE FROM email_change_tokens WHERE user_id = ?', [record.user_id]);

    // 이전 이메일로 알림 발송
    try {
      await emailService.sendEmailChangeNotifyOld(record.old_email, record.new_email);
    } catch (emailErr) {
      console.error('이메일 변경 알림(이전 메일) 발송 실패:', emailErr.message);
    }

    // 새 이메일로 인증 완료 알림 발송
    try {
      await emailService.sendEmailChangeComplete(record.new_email);
    } catch (emailErr) {
      console.error('이메일 변경 완료 알림(새 메일) 발송 실패:', emailErr.message);
    }

    // JWT 재발급
    const user = { id: String(record.user_id), email: record.new_email, username: record.username };
    const jwtToken = generateJwtToken(user);

    res.json({ token: jwtToken, user, message: '이메일이 변경되었습니다.' });
  } catch (err) {
    console.error('이메일 변경 인증 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** POST /auth/forgot-password – 비밀번호 찾기 (Turnstile 검증 포함) */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, turnstileToken } = req.body;

    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    // Turnstile 검증
    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid) {
      return res.status(403).json({ message: '보안 인증에 실패했습니다. 다시 시도해주세요.' });
    }

    const [users] = await pool.execute(
      'SELECT id, email_verified FROM users WHERE email = ?',
      [email],
    );

    // 보안상 이메일 존재 여부를 노출하지 않음
    if (users.length === 0 || !users[0].email_verified) {
      return res.json({ message: '등록된 이메일이라면 임시 비밀번호가 발송됩니다.' });
    }

    const userId = users[0].id;

    // 기존 토큰 삭제
    await pool.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);

    const tempPassword = generateTempPassword();
    const hashedTemp = await bcrypt.hash(tempPassword, SALT_ROUNDS);
    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간

    await pool.execute(
      'INSERT INTO password_reset_tokens (user_id, token, temp_password, expires_at) VALUES (?, ?, ?, ?)',
      [userId, token, hashedTemp, expiresAt],
    );

    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
    await emailService.sendPasswordResetEmail(email, tempPassword, resetUrl);

    res.json({ message: '등록된 이메일이라면 임시 비밀번호가 발송됩니다.' });
  } catch (err) {
    console.error('비밀번호 찾기 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** POST /auth/reset-password – 임시 비밀번호로 비밀번호 재설정 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: '재설정 토큰이 필요합니다.' });
    }

    const [rows] = await pool.execute(
      'SELECT prt.*, u.email, u.username FROM password_reset_tokens prt JOIN users u ON u.id = prt.user_id WHERE prt.token = ? AND prt.expires_at > NOW()',
      [token],
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: '유효하지 않거나 만료된 재설정 링크입니다.' });
    }

    const record = rows[0];

    // 임시 비밀번호를 실제 비밀번호로 설정
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [record.temp_password, record.user_id],
    );

    // 토큰 삭제
    await pool.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [record.user_id]);

    // 비밀번호 변경 알림
    try {
      await emailService.sendPasswordChangeNotification(record.email);
    } catch (emailErr) {
      console.error('비밀번호 재설정 알림 메일 발송 실패:', emailErr.message);
    }

    res.json({ message: '임시 비밀번호로 변경되었습니다. 이메일에서 확인한 임시 비밀번호로 로그인해주세요.' });
  } catch (err) {
    console.error('비밀번호 재설정 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * POST /auth/complete-signup – OAuth 로그인 후 이메일 입력으로 가입 완료.
 * X 또는 Mastodon OAuth 콜백에서 needsEmail 응답을 받은 후 호출.
 * provider, providerId, username, email을 받아 사용자를 생성합니다.
 * 이메일 인증이 필요합니다.
 */
router.post('/complete-signup', async (req, res) => {
  try {
    const { provider, providerId, username, email, turnstileToken } = req.body;

    // Turnstile 검증
    const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileValid) {
      return res.status(403).json({ message: '보안 인증에 실패했습니다. 다시 시도해주세요.' });
    }

    if (!provider || !providerId || !username || !email) {
      return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
    }

    if (!['x', 'mastodon'].includes(provider)) {
      return res.status(400).json({ message: '지원하지 않는 인증 제공자입니다.' });
    }

    // OAuth 제공자별 컬럼 이름 매핑 (화이트리스트)
    const PROVIDER_COLUMN = { x: 'x_id', mastodon: 'mastodon_id' };
    const idColumn = PROVIDER_COLUMN[provider];

    // 이메일 중복 확인
    const [existingEmail] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email],
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: '이미 등록된 이메일입니다.' });
    }

    // 해당 OAuth 계정이 이미 연동된 사용자가 있는지 확인
    const checkQuery = idColumn === 'x_id'
      ? 'SELECT id FROM users WHERE x_id = ?'
      : 'SELECT id FROM users WHERE mastodon_id = ?';
    const [existingOAuth] = await pool.execute(checkQuery, [providerId]);
    if (existingOAuth.length > 0) {
      return res.status(409).json({ message: '이미 연동된 계정이 있습니다.' });
    }

    // 사용자 생성 (이메일 미인증 상태)
    const insertQuery = idColumn === 'x_id'
      ? 'INSERT INTO users (email, password, username, x_id, email_verified) VALUES (?, ?, ?, ?, 0)'
      : 'INSERT INTO users (email, password, username, mastodon_id, email_verified) VALUES (?, ?, ?, ?, 0)';
    const [result] = await pool.execute(insertQuery, [email, '', username, providerId]);

    const userId = result.insertId;

    // 인증 토큰/코드 생성
    const code = generateVerificationCode();
    const verificationToken = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.execute(
      'INSERT INTO email_verification_tokens (user_id, token, code, expires_at) VALUES (?, ?, ?, ?)',
      [userId, verificationToken, code, expiresAt],
    );

    // 인증 메일 발송
    const verifyUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
    await emailService.sendVerificationEmail(email, code, verifyUrl);

    res.status(201).json({ message: '인증 메일이 발송되었습니다. 이메일을 확인해주세요.', needsVerification: true });
  } catch (err) {
    console.error('OAuth 가입 완료 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** DELETE /auth/account – 계정 삭제 */
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE') {
      return res.status(400).json({ message: '계정 삭제를 확인해주세요.' });
    }

    // user_data는 ON DELETE CASCADE로 자동 삭제됨
    await pool.execute('DELETE FROM users WHERE id = ?', [req.user.id]);

    res.status(204).end();
  } catch (err) {
    console.error('계정 삭제 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
