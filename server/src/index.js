const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const dataRouter = require('./routes/data');
const legalRouter = require('./routes/legal');

function createApp() {
  const app = express();

  // 프록시 뒤에서 실행될 때 X-Forwarded-For 헤더를 신뢰
  app.set('trust proxy', 1);

  // 보안 헤더
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
  }));

  // 요청 속도 제한
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  });
  app.use(limiter);

  // JSON 파싱 (최대 1MB)
  app.use(express.json({ limit: '1mb' }));

  // 라우트
  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/data', dataRouter);
  app.use('/legal', legalRouter);

  // 404 처리
  app.use((_req, res) => {
    res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다.' });
  });

  // 전역 에러 핸들러
  app.use((err, _req, res, _next) => {
    console.error('처리되지 않은 오류:', err);
    res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
  });

  return app;
}

// 직접 실행 시 서버 시작
if (require.main === module) {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`서버가 포트 ${config.port}에서 실행 중입니다.`);
  });
}

module.exports = { createApp };
