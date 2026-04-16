/**
 * Cloudflare Turnstile 검증 헬퍼.
 */
const config = require('./config');

/**
 * Turnstile 토큰을 검증합니다.
 * Turnstile이 비활성화된 경우 항상 true를 반환합니다.
 * @param {string} token - 클라이언트에서 받은 Turnstile 토큰
 * @param {string} [remoteIp] - 사용자 IP
 * @returns {Promise<boolean>}
 */
async function verifyTurnstile(token, remoteIp) {
  if (!config.turnstileEnabled) {
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const body = {
      secret: config.turnstile.secretKey,
      response: token,
    };

    if (remoteIp) {
      body.remoteip = remoteIp;
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Turnstile 검증 API 호출 실패:', response.status);
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (err) {
    console.error('Turnstile 검증 오류:', err.message);
    return false;
  }
}

module.exports = { verifyTurnstile };
