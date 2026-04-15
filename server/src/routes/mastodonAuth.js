const { Router } = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');

const router = Router();

/**
 * 임시로 메모리에 state를 저장합니다.
 * 프로덕션에서는 Redis 등 외부 저장소를 사용하는 것이 좋습니다.
 */
const pendingStates = new Map();

/** 만료된 state 정리 (10분) */
const STATE_TTL = 10 * 60 * 1000;

function cleanupStates() {
  const now = Date.now();
  for (const [key, val] of pendingStates) {
    if (now - val.createdAt > STATE_TTL) {
      pendingStates.delete(key);
    }
  }
}

/** JWT 토큰 생성 헬퍼 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

/** 서버 인덱스로 Mastodon 서버 설정을 가져오는 헬퍼 */
function getMastodonServer(serverIndex) {
  const idx = parseInt(serverIndex, 10);
  if (isNaN(idx) || idx < 0 || idx >= config.mastodonServers.length) {
    return null;
  }
  return config.mastodonServers[idx];
}

/**
 * GET /auth/mastodon/login – Mastodon OAuth 인증 URL 생성.
 * 클라이언트는 이 URL로 리다이렉트해서 Mastodon 로그인 진행.
 * query param: serverIndex (기본값 0)
 */
router.get('/login', (req, res) => {
  if (!config.mastodonLoginEnabled) {
    return res.status(404).json({ message: 'Mastodon 로그인이 비활성화되어 있습니다.' });
  }

  const serverIndex = parseInt(req.query.serverIndex, 10) || 0;
  const server = getMastodonServer(serverIndex);
  if (!server) {
    return res.status(400).json({ message: '유효하지 않은 Mastodon 서버 인덱스입니다.' });
  }

  cleanupStates();

  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, { createdAt: Date.now(), serverIndex });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: server.clientId,
    redirect_uri: server.redirectUri,
    scope: 'read:accounts',
    state,
  });

  const authorizeUrl = `https://${server.domain}/oauth/authorize?${params.toString()}`;

  res.json({ authorizeUrl, state });
});

/**
 * POST /auth/mastodon/callback – Mastodon OAuth 콜백 처리.
 * authorization code를 access token으로 교환 → Mastodon 사용자 정보 조회 → 로그인/회원가입 처리.
 */
router.post('/callback', async (req, res) => {
  if (!config.mastodonLoginEnabled) {
    return res.status(404).json({ message: 'Mastodon 로그인이 비활성화되어 있습니다.' });
  }

  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({ message: 'code와 state가 필요합니다.' });
  }

  const pending = pendingStates.get(state);
  if (!pending) {
    return res.status(400).json({ message: '유효하지 않거나 만료된 state입니다.' });
  }
  pendingStates.delete(state);

  const server = getMastodonServer(pending.serverIndex);
  if (!server) {
    return res.status(400).json({ message: '유효하지 않은 Mastodon 서버 설정입니다.' });
  }

  try {
    // Step 1: authorization code → access token 교환
    const tokenResponse = await fetch(`https://${server.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: server.clientId,
        client_secret: server.clientSecret,
        redirect_uri: server.redirectUri,
        scope: 'read:accounts',
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Mastodon 토큰 교환 실패:', err);
      return res.status(401).json({ message: 'Mastodon 인증에 실패했습니다.' });
    }

    const tokenData = await tokenResponse.json();
    const mastodonAccessToken = tokenData.access_token;

    // Step 2: Mastodon 사용자 정보 조회 (verify_credentials)
    const userResponse = await fetch(`https://${server.domain}/api/v1/accounts/verify_credentials`, {
      headers: { Authorization: `Bearer ${mastodonAccessToken}` },
    });

    if (!userResponse.ok) {
      const err = await userResponse.text();
      console.error('Mastodon 사용자 정보 조회 실패:', err);
      return res.status(401).json({ message: 'Mastodon 사용자 정보를 가져올 수 없습니다.' });
    }

    const mastodonUser = await userResponse.json();
    // Mastodon 고유 ID: acct@domain 형식으로 저장 (서버 간 고유성 보장)
    const mastodonId = `${mastodonUser.id}@${server.domain}`;
    const mastodonUsername = mastodonUser.display_name || mastodonUser.username;

    // Step 3: DB에서 Mastodon 계정으로 연결된 사용자 검색 또는 생성
    const [existingRows] = await pool.execute(
      'SELECT id, email, username, password, x_id, mastodon_id FROM users WHERE mastodon_id = ?',
      [mastodonId],
    );

    let user;

    if (existingRows.length > 0) {
      // 기존 사용자 로그인
      const row = existingRows[0];
      user = {
        id: String(row.id),
        email: row.email,
        username: row.username,
        hasPassword: !!row.password,
        xLinked: !!row.x_id,
        mastodonLinked: true,
      };
    } else {
      // 새 사용자 — 이메일 입력이 필요함
      return res.json({
        needsEmail: true,
        provider: 'mastodon',
        providerId: mastodonId,
        username: mastodonUsername,
      });
    }

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('Mastodon 로그인 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * POST /auth/mastodon/link – 기존 계정에 Mastodon 계정 연동.
 * 로그인된 사용자가 Mastodon 인증을 거쳐 계정을 연결합니다.
 */
router.post('/link', async (req, res) => {
  if (!config.mastodonLoginEnabled) {
    return res.status(404).json({ message: 'Mastodon 로그인이 비활성화되어 있습니다.' });
  }

  // 인증 확인
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  let currentUser;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    currentUser = { id: decoded.id, email: decoded.email, username: decoded.username };
  } catch {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }

  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({ message: 'code와 state가 필요합니다.' });
  }

  const pending = pendingStates.get(state);
  if (!pending) {
    return res.status(400).json({ message: '유효하지 않거나 만료된 state입니다.' });
  }
  pendingStates.delete(state);

  const server = getMastodonServer(pending.serverIndex);
  if (!server) {
    return res.status(400).json({ message: '유효하지 않은 Mastodon 서버 설정입니다.' });
  }

  try {
    // Step 1: authorization code → access token 교환
    const tokenResponse = await fetch(`https://${server.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: server.clientId,
        client_secret: server.clientSecret,
        redirect_uri: server.redirectUri,
        scope: 'read:accounts',
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Mastodon 토큰 교환 실패:', err);
      return res.status(401).json({ message: 'Mastodon 인증에 실패했습니다.' });
    }

    const tokenData = await tokenResponse.json();
    const mastodonAccessToken = tokenData.access_token;

    // Step 2: Mastodon 사용자 정보 조회
    const userResponse = await fetch(`https://${server.domain}/api/v1/accounts/verify_credentials`, {
      headers: { Authorization: `Bearer ${mastodonAccessToken}` },
    });

    if (!userResponse.ok) {
      const err = await userResponse.text();
      console.error('Mastodon 사용자 정보 조회 실패:', err);
      return res.status(401).json({ message: 'Mastodon 사용자 정보를 가져올 수 없습니다.' });
    }

    const mastodonUser = await userResponse.json();
    const mastodonId = `${mastodonUser.id}@${server.domain}`;

    // Step 3: 이미 다른 계정에 연동된 Mastodon 계정인지 확인
    const [existingRows] = await pool.execute(
      'SELECT id FROM users WHERE mastodon_id = ? AND id != ?',
      [mastodonId, currentUser.id],
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ message: '이 Mastodon 계정은 이미 다른 계정에 연동되어 있습니다.' });
    }

    // Step 4: 현재 사용자에 Mastodon 계정 연동
    await pool.execute(
      'UPDATE users SET mastodon_id = ? WHERE id = ?',
      [mastodonId, currentUser.id],
    );

    res.json({ message: 'Mastodon 계정이 연동되었습니다.' });
  } catch (err) {
    console.error('Mastodon 연동 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * DELETE /auth/mastodon/unlink – Mastodon 계정 연동 해제.
 * 비밀번호가 설정된 사용자만 해제 가능.
 */
router.delete('/unlink', async (req, res) => {
  // 인증 확인
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  let currentUser;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    currentUser = { id: decoded.id };
  } catch {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }

  try {
    // 비밀번호가 설정된 사용자만 연동 해제 가능
    const [rows] = await pool.execute(
      'SELECT password, x_id FROM users WHERE id = ?',
      [currentUser.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호도 없고 X 연동도 없으면 해제 불가 (로그인 수단이 없어짐)
    if (!rows[0].password && !rows[0].x_id) {
      return res.status(400).json({ message: '비밀번호를 먼저 설정하거나 다른 로그인 수단을 연동해주세요. Mastodon 연동만으로는 로그인할 수 없게 됩니다.' });
    }

    await pool.execute(
      'UPDATE users SET mastodon_id = NULL WHERE id = ?',
      [currentUser.id],
    );

    res.json({ message: 'Mastodon 계정 연동이 해제되었습니다.' });
  } catch (err) {
    console.error('Mastodon 연동 해제 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
