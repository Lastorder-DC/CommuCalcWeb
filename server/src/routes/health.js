const { Router } = require('express');

const router = Router();

/** GET /health – 서버 상태 확인 */
router.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
