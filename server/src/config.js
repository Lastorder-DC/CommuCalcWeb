require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,

  /** 서버 버전 */
  serverVersion: '0.8.3',

  /** 지원하는 최소 클라이언트 버전 */
  minClientVersion: '0.8.3',

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

  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173'],
};
