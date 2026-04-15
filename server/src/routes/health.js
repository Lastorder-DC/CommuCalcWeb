const { Router } = require('express');
const config = require('../config');

const router = Router();

/** GET /health – 서버 상태 확인 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    serverVersion: config.serverVersion,
    minClientVersion: config.minClientVersion,
    xLoginEnabled: config.xLoginEnabled,
    mastodonLoginEnabled: config.mastodonLoginEnabled,
    mastodonServerName: config.mastodonLoginEnabled ? config.mastodon.serverName : undefined,
  });
});

module.exports = router;
