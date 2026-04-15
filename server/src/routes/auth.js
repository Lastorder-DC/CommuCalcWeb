const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');
const authMiddleware = require('../authMiddleware');

const router = Router();
const SALT_ROUNDS = 12;

/** 토큰 생성 헬퍼 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

/** POST /auth/register – 회원가입 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

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
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, hashedPassword, username],
    );

    const user = { id: String(result.insertId), email, username, hasPassword: true, xLinked: false, mastodonLinked: false };
    const token = generateToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('회원가입 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** POST /auth/login – 로그인 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, email, password, username, x_id, mastodon_id FROM users WHERE email = ?',
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

    const user = {
      id: String(userRow.id),
      email: userRow.email,
      username: userRow.username,
      hasPassword: !!userRow.password,
      xLinked: !!userRow.x_id,
      mastodonLinked: !!userRow.mastodon_id,
    };
    const token = generateToken(user);

    res.json({ token, user });
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

/** PUT /auth/password – 비밀번호 변경 */
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: '새 비밀번호는 8자 이상이어야 합니다.' });
    }

    const [rows] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
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

    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    console.error('비밀번호 변경 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** PUT /auth/email – 이메일 변경 */
router.put('/email', authMiddleware, async (req, res) => {
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

    await pool.execute(
      'UPDATE users SET email = ? WHERE id = ?',
      [email, req.user.id],
    );

    const user = { id: req.user.id, email, username: req.user.username };
    const token = generateToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error('이메일 변경 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * POST /auth/complete-signup – OAuth 로그인 후 이메일 입력으로 가입 완료.
 * X 또는 Mastodon OAuth 콜백에서 needsEmail 응답을 받은 후 호출.
 * provider, providerId, username, email을 받아 사용자를 생성합니다.
 */
router.post('/complete-signup', async (req, res) => {
  try {
    const { provider, providerId, username, email } = req.body;

    if (!provider || !providerId || !username || !email) {
      return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
    }

    if (!['x', 'mastodon'].includes(provider)) {
      return res.status(400).json({ message: '지원하지 않는 인증 제공자입니다.' });
    }

    // 이메일 중복 확인
    const [existingEmail] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email],
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: '이미 등록된 이메일입니다.' });
    }

    // 해당 OAuth 계정이 이미 연동된 사용자가 있는지 확인
    const idColumn = provider === 'x' ? 'x_id' : 'mastodon_id';
    const [existingOAuth] = await pool.execute(
      `SELECT id FROM users WHERE ${idColumn} = ?`,
      [providerId],
    );
    if (existingOAuth.length > 0) {
      return res.status(409).json({ message: '이미 연동된 계정이 있습니다.' });
    }

    // 사용자 생성
    const insertColumn = provider === 'x' ? 'x_id' : 'mastodon_id';
    const [result] = await pool.execute(
      `INSERT INTO users (email, password, username, ${insertColumn}) VALUES (?, ?, ?, ?)`,
      [email, '', username, providerId],
    );

    const user = {
      id: String(result.insertId),
      email,
      username,
      hasPassword: false,
      xLinked: provider === 'x',
      mastodonLinked: provider === 'mastodon',
    };
    const token = generateToken(user);

    res.status(201).json({ token, user });
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
