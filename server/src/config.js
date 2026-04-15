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

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,

  /** 서버 버전 */
  serverVersion: '0.9.1',

  /** 지원하는 최소 클라이언트 버전 */
  minClientVersion: '0.9.1',

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

  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173'],
};
