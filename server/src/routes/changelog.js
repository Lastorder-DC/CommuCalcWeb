const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const { parseChangelog, toClientFormat } = require('../changelogParser');

const router = Router();

const CHANGELOG_PATH = path.join(__dirname, '..', '..', 'CHANGELOG.md');

/** 파싱 결과 캐시 (프로세스 수명 동안 유지) */
let cached = null;

/**
 * CHANGELOG.md를 파싱해 JSON 형태로 반환합니다.
 * 파일이 없으면 null을 반환합니다.
 */
function loadChangelog() {
  if (cached) return cached;

  if (!fs.existsSync(CHANGELOG_PATH)) {
    return null;
  }

  const content = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
  const parsed = parseChangelog(content);
  cached = toClientFormat(parsed);
  return cached;
}

/** GET /changelog – 서버 변경 이력 JSON */
router.get('/', (_req, res) => {
  const data = loadChangelog();
  if (!data) {
    return res.status(404).json({ message: 'CHANGELOG.md 파일을 찾을 수 없습니다.' });
  }
  res.json(data);
});

module.exports = router;
