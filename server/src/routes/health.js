const { Router } = require('express');
const config = require('../config');

const router = Router();

/** GET /health – 서버 상태 확인 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    serverVersion: config.serverVersion,
    minClientVersion: config.minClientVersion,
  });
});

module.exports = router;
