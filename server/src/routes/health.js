const { Router } = require('express');
const config = require('../config');

const router = Router();

/** GET /health – 서버 상태 확인 */
router.get('/', (_req, res) => {
  const response = {
    status: 'ok',
    serverVersion: config.serverVersion,
    minClientVersion: config.minClientVersion,
    xLoginEnabled: config.xLoginEnabled,
    mastodonLoginEnabled: config.mastodonLoginEnabled,
    turnstileEnabled: config.turnstileEnabled,
  };

  if (config.turnstileEnabled) {
    response.turnstileSiteKey = config.turnstile.siteKey;
  }

  if (config.mastodonLoginEnabled) {
    response.mastodonServers = config.mastodonServers.map((s, index) => ({
      index,
      serverName: s.serverName || undefined,
      iconUrl: s.iconUrl || undefined,
    }));
    // 하위 호환: 첫 번째 서버 이름
    response.mastodonServerName = config.mastodon.serverName || undefined;
  }

  res.json(response);
});

module.exports = router;
