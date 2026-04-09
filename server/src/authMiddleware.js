const jwt = require('jsonwebtoken');
const config = require('./config');

/**
 * JWT 토큰에서 사용자 정보를 추출하는 미들웨어.
 * Authorization 헤더가 없으면 401을 반환합니다.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.id, email: decoded.email, username: decoded.username };
    next();
  } catch {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}

module.exports = authMiddleware;
