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

    const user = { id: String(result.insertId), email, username };
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
      'SELECT id, email, password, username FROM users WHERE email = ?',
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

    const user = { id: String(userRow.id), email: userRow.email, username: userRow.username };
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

/** GET /auth/me – 현재 사용자 정보 */
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
