require('dotenv').config();

/**
 * 환경변수에서 Mastodon 서버 설정을 읽어옵니다.
 * 첫 번째 서버는 접미사 없음, 이후 서버는 _2, _3, _4, _5 접미사를 사용합니다.
 */
function loadMastodonServers() {
  const suffixes = ['', '_2', '_3', '_4', '_5'];
  const servers = [];

  for (const suffix of suffixes) {
    const domain = process.env[`MASTODON_DOMAIN${suffix}`] || '';
    const serverName = process.env[`MASTODON_SERVER_NAME${suffix}`] || '';
    const clientId = process.env[`MASTODON_CLIENT_ID${suffix}`] || '';
    const clientSecret = process.env[`MASTODON_CLIENT_SECRET${suffix}`] || '';
    const redirectUri = process.env[`MASTODON_REDIRECT_URI${suffix}`] || '';
    const iconUrl = process.env[`MASTODON_ICON_URL${suffix}`] || '';

    if (domain && clientId && clientSecret && redirectUri) {
      servers.push({ domain, serverName, clientId, clientSecret, redirectUri, iconUrl });
    }
  }

  return servers;
}

/**
 * 필수 SMTP 환경변수가 모두 설정되어 있는지 검증합니다.
 * 누락된 변수가 있으면 서버 구동을 중단합니다.
 */
function validateSmtpConfig() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[FATAL] 이메일 발송에 필요한 환경변수가 설정되지 않았습니다: ${missing.join(', ')}`);
    console.error('EMAIL_SETUP.md 문서를 참고하여 .env 파일에 SMTP 설정을 추가해주세요.');
    process.exit(1);
  }
}

// 서버 직접 실행 시에만 SMTP 검증 (테스트 환경에서는 실제 SMTP 서버가 없으므로 건너뜀)
if (process.env.NODE_ENV !== 'test') {
  validateSmtpConfig();
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,

  /** 서버 버전 */
  serverVersion: '1.1.0',

  /** 지원하는 최소 클라이언트 버전 */
  minClientVersion: '1.1.0',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'commucalc',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'commucalc',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  /** SMTP 이메일 설정 */
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
  },

  /** 프론트엔드 URL (이메일 내 링크 생성용) */
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  /** X (Twitter) OAuth 2.0 설정 */
  x: {
    clientId: process.env.X_CLIENT_ID || '',
    clientSecret: process.env.X_CLIENT_SECRET || '',
    callbackUrl: process.env.X_CALLBACK_URL || '',
  },

  /** X 로그인 활성화 여부 */
  get xLoginEnabled() {
    return !!(this.x.clientId && this.x.clientSecret && this.x.callbackUrl);
  },

  /** Mastodon 서버 목록 (최대 5개) */
  mastodonServers: loadMastodonServers(),

  /** 하위 호환용: 첫 번째 Mastodon 서버 설정 */
  get mastodon() {
    return this.mastodonServers[0] || { domain: '', serverName: '', clientId: '', clientSecret: '', redirectUri: '', iconUrl: '' };
  },

  /** Mastodon 로그인 활성화 여부 (하나 이상의 서버가 구성된 경우) */
  get mastodonLoginEnabled() {
    return this.mastodonServers.length > 0;
  },

  /** Cloudflare Turnstile 설정 */
  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY || '',
    secretKey: process.env.TURNSTILE_SECRET_KEY || '',
  },

  /** Turnstile 활성화 여부 */
  get turnstileEnabled() {
    return !!(this.turnstile.siteKey && this.turnstile.secretKey);
  },

  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173'],
};
