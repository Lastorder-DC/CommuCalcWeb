require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,

  /** 서버 버전 */
  serverVersion: '0.6.0',

  /** 지원하는 최소 클라이언트 버전 */
  minClientVersion: '0.6.0',

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

  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173'],
};
