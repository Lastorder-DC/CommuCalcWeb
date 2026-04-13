const { Router } = require('express');
const fs = require('fs');
const path = require('path');

const router = Router();

const LEGAL_DIR = path.join(__dirname, '..', '..', 'legal');

/** 법적 문서 캐시 */
const documentCache = {};

/**
 * 법적 문서를 파일에서 불러옵니다.
 * 1. 먼저 사용자 정의 파일 (terms.md / privacy.md)을 찾습니다.
 * 2. 없으면 예제 파일 (terms.example.md / privacy.example.md)을 불러옵니다.
 * 결과는 메모리에 캐시됩니다.
 */
function loadLegalDocument(name) {
  if (documentCache[name]) {
    return documentCache[name];
  }

  const customPath = path.join(LEGAL_DIR, `${name}.md`);
  const examplePath = path.join(LEGAL_DIR, `${name}.example.md`);

  let content = null;
  if (fs.existsSync(customPath)) {
    content = fs.readFileSync(customPath, 'utf-8');
  } else if (fs.existsSync(examplePath)) {
    content = fs.readFileSync(examplePath, 'utf-8');
  }

  if (content) {
    documentCache[name] = content;
  }
  return content;
}

/** GET /legal/terms – 이용약관 */
router.get('/terms', (_req, res) => {
  const content = loadLegalDocument('terms');
  if (!content) {
    return res.status(404).json({ message: '이용약관 파일을 찾을 수 없습니다.' });
  }
  res.type('text/plain').send(content);
});

/** GET /legal/privacy – 개인정보처리방침 */
router.get('/privacy', (_req, res) => {
  const content = loadLegalDocument('privacy');
  if (!content) {
    return res.status(404).json({ message: '개인정보처리방침 파일을 찾을 수 없습니다.' });
  }
  res.type('text/plain').send(content);
});

module.exports = router;
