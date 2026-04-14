const { Router } = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');

const router = Router();

/**
 * PKCE code_verifier / code_challenge 생성 헬퍼.
 * 임시로 메모리에 state → verifier 매핑을 저장합니다.
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

/**
 * X 사용자 정보 조회 헬퍼.
 * confirmed_email 포함 요청이 실패하면 기본 필드만으로 재시도합니다.
 * @param {string} accessToken - X OAuth2 access token
 * @returns {Promise<{data: object}>} 사용자 정보
 * @throws {Error} statusCode 및 xApiError 속성이 포함된 에러.
 *   403: 앱이 프로젝트에 연결되지 않은 경우, 기타: API 호출 실패.
 */
async function fetchXUserInfo(accessToken) {
  const CLIENT_FORBIDDEN_TYPE =
    'https://api.twitter.com/2/problems/client-forbidden';

  // 1차 시도: confirmed_email 포함
  const primaryResponse = await fetch(
    'https://api.x.com/2/users/me?user.fields=confirmed_email',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (primaryResponse.ok) {
    return primaryResponse.json();
  }

  // 에러 본문을 한 번만 읽고 재사용
  const errorBody = await primaryResponse.text();
  let parsedError;
  try {
    parsedError = JSON.parse(errorBody);
  } catch {
    parsedError = null;
  }

  const reason = parsedError?.reason || '';
  const errorType = parsedError?.type || '';

  // client-not-enrolled: 앱이 프로젝트에 연결되지 않았거나 접근 수준이 부족한 경우
  if (
    primaryResponse.status === 403 &&
    (reason === 'client-not-enrolled' ||
      errorType === CLIENT_FORBIDDEN_TYPE)
  ) {
    console.warn(
      'X API client-forbidden 오류 발생. confirmed_email 없이 재시도합니다:',
      errorBody,
    );

    // 2차 시도: 기본 필드만 (confirmed_email 제외)
    const fallbackResponse = await fetch(
      'https://api.x.com/2/users/me',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (fallbackResponse.ok) {
      return fallbackResponse.json();
    }

    // 2차도 실패 — 앱이 프로젝트에 연결되지 않은 경우
    const fallbackError = await fallbackResponse.text();
    console.error('X 사용자 정보 조회 재시도 실패:', fallbackError);

    const err = new Error(
      'X Developer App이 프로젝트에 연결되어 있지 않습니다. ' +
        'X Developer Console(https://developer.x.com)에서 프로젝트를 생성하고 앱을 연결해주세요.',
    );
    err.statusCode = 403;
    err.xApiError = parsedError;
    throw err;
  }

  // 기타 에러
  console.error('X 사용자 정보 조회 실패:', errorBody);
  const err = new Error('X 사용자 정보를 가져올 수 없습니다.');
  err.statusCode = primaryResponse.status;
  err.xApiError = parsedError;
  throw err;
}

/**
 * GET /auth/x/login – X OAuth 2.0 인증 URL 생성.
 * 클라이언트는 이 URL로 리다이렉트해서 X 로그인 진행.
 */
router.get('/login', (_req, res) => {
  if (!config.xLoginEnabled) {
    return res.status(404).json({ message: 'X 로그인이 비활성화되어 있습니다.' });
  }

  cleanupStates();

  // PKCE code_verifier & code_challenge (S256)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const state = crypto.randomBytes(16).toString('hex');

  pendingStates.set(state, { codeVerifier, createdAt: Date.now() });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.x.clientId,
    redirect_uri: config.x.callbackUrl,
    scope: 'users.read users.email tweet.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authorizeUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;

  res.json({ authorizeUrl, state });
});

/**
 * POST /auth/x/callback – X OAuth 2.0 콜백 처리.
 * authorization code를 access token으로 교환 → X 사용자 정보 조회 → 로그인/회원가입 처리.
 */
router.post('/callback', async (req, res) => {
  if (!config.xLoginEnabled) {
    return res.status(404).json({ message: 'X 로그인이 비활성화되어 있습니다.' });
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

  try {
    // Step 1: authorization code → access token 교환
    const basicAuth = Buffer.from(
      `${config.x.clientId}:${config.x.clientSecret}`,
    ).toString('base64');

    const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.x.callbackUrl,
        code_verifier: pending.codeVerifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('X 토큰 교환 실패:', err);
      return res.status(401).json({ message: 'X 인증에 실패했습니다.' });
    }

    const tokenData = await tokenResponse.json();
    const xAccessToken = tokenData.access_token;

    // Step 2: X 사용자 정보 조회 (confirmed_email 포함 시도 → 실패 시 기본 필드로 재시도)
    let userData;
    try {
      userData = await fetchXUserInfo(xAccessToken);
    } catch (fetchErr) {
      const status = fetchErr.statusCode || 401;
      return res.status(status).json({ message: fetchErr.message });
    }

    const xId = userData.data.id;
    const xUsername = userData.data.username;
    const xEmail = userData.data.confirmed_email || `${xId}@x.user`;

    // Step 3: DB에서 X 계정으로 연결된 사용자 검색 또는 생성
    const [existingRows] = await pool.execute(
      'SELECT id, email, username FROM users WHERE x_id = ?',
      [xId],
    );

    let user;

    if (existingRows.length > 0) {
      // 기존 사용자 로그인 – X에서 가져온 이메일이 있으면 업데이트
      const row = existingRows[0];
      const effectiveEmail = userData.data.confirmed_email || row.email;
      if (userData.data.confirmed_email && row.email !== userData.data.confirmed_email) {
        await pool.execute('UPDATE users SET email = ? WHERE id = ?', [userData.data.confirmed_email, row.id]);
      }
      user = { id: String(row.id), email: effectiveEmail, username: row.username };
    } else {
      // 새 사용자 생성 (X 계정 연동)
      // X API에서 가져온 이메일을 사용하고, 가져올 수 없는 경우 플레이스홀더를 사용합니다.
      // 이 이메일로 일반 로그인은 불가능합니다 (비밀번호가 빈 문자열).
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, username, x_id) VALUES (?, ?, ?, ?)',
        [xEmail, '', xUsername, xId],
      );
      user = { id: String(result.insertId), email: xEmail, username: xUsername };
    }

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('X 로그인 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * POST /auth/x/link – 기존 이메일 계정에 X 계정 연동.
 * 로그인된 사용자가 X 인증을 거쳐 계정을 연결합니다.
 */
router.post('/link', async (req, res) => {
  if (!config.xLoginEnabled) {
    return res.status(404).json({ message: 'X 로그인이 비활성화되어 있습니다.' });
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

  try {
    // Step 1: authorization code → access token 교환
    const basicAuth = Buffer.from(
      `${config.x.clientId}:${config.x.clientSecret}`,
    ).toString('base64');

    const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.x.callbackUrl,
        code_verifier: pending.codeVerifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('X 토큰 교환 실패:', err);
      return res.status(401).json({ message: 'X 인증에 실패했습니다.' });
    }

    const tokenData = await tokenResponse.json();
    const xAccessToken = tokenData.access_token;

    // Step 2: X 사용자 정보 조회 (confirmed_email 포함 시도 → 실패 시 기본 필드로 재시도)
    let userData;
    try {
      userData = await fetchXUserInfo(xAccessToken);
    } catch (fetchErr) {
      const status = fetchErr.statusCode || 401;
      return res.status(status).json({ message: fetchErr.message });
    }

    const xId = userData.data.id;

    // Step 3: 이미 다른 계정에 연동된 X 계정인지 확인
    const [existingRows] = await pool.execute(
      'SELECT id FROM users WHERE x_id = ? AND id != ?',
      [xId, currentUser.id],
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ message: '이 X 계정은 이미 다른 계정에 연동되어 있습니다.' });
    }

    // Step 4: 현재 사용자에 X 계정 연동
    await pool.execute(
      'UPDATE users SET x_id = ? WHERE id = ?',
      [xId, currentUser.id],
    );

    res.json({ message: 'X 계정이 연동되었습니다.' });
  } catch (err) {
    console.error('X 연동 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * DELETE /auth/x/unlink – X 계정 연동 해제.
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
      'SELECT password FROM users WHERE id = ?',
      [currentUser.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    if (!rows[0].password) {
      return res.status(400).json({ message: '비밀번호를 먼저 설정해주세요. X 연동만으로는 로그인할 수 없게 됩니다.' });
    }

    await pool.execute(
      'UPDATE users SET x_id = NULL WHERE id = ?',
      [currentUser.id],
    );

    res.json({ message: 'X 계정 연동이 해제되었습니다.' });
  } catch (err) {
    console.error('X 연동 해제 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
