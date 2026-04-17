/**
 * CHANGELOG.md 파서. 클라이언트 스크립트(`scripts/generate-changelog.cjs`)와
 * 동일한 파싱 규칙을 사용합니다. 서버에서 `server/CHANGELOG.md`를 JSON으로 변환해
 * API로 제공하기 위해 재사용합니다.
 */

/**
 * CHANGELOG 마크다운을 파싱해 엔트리 배열을 반환합니다.
 * @param {string} markdown
 */
function parseChangelog(markdown) {
  const lines = markdown.split(/\r?\n/);
  let title = null;
  const introLines = [];
  const entries = [];
  let current = null;
  let currentSection = null;
  let bulletBuffer = null;

  const finalizeBullet = () => {
    if (bulletBuffer !== null && currentSection && current) {
      current.sections[currentSection].push(bulletBuffer.trim());
      bulletBuffer = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (title === null && /^#\s+/.test(line)) {
      title = line.replace(/^#\s+/, '').trim();
      continue;
    }

    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      finalizeBullet();
      const heading = h2[1].trim();
      const versioned = heading.match(/^\[([^\]]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})\s*$/);
      const versionOnly = heading.match(/^\[([^\]]+)\]\s*$/);
      const dateOnly = heading.match(/^(\d{4}-\d{2}-\d{2})\s*$/);

      let version = null;
      let date = null;
      if (versioned) {
        version = versioned[1];
        date = versioned[2];
      } else if (versionOnly) {
        version = versionOnly[1];
      } else if (dateOnly) {
        date = dateOnly[1];
      } else {
        current = null;
        currentSection = null;
        continue;
      }

      current = { version, date, sections: {} };
      entries.push(current);
      currentSection = null;
      continue;
    }

    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3 && current) {
      finalizeBullet();
      currentSection = h3[1].trim();
      if (!current.sections[currentSection]) {
        current.sections[currentSection] = [];
      }
      continue;
    }

    if (!current) {
      if (title !== null) introLines.push(line);
      continue;
    }

    if (!currentSection) continue;

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      finalizeBullet();
      bulletBuffer = bullet[1];
      continue;
    }

    if (bulletBuffer !== null && /^\s+\S/.test(line)) {
      bulletBuffer += ' ' + line.trim();
      continue;
    }

    if (/^\s*$/.test(line)) {
      finalizeBullet();
    }
  }

  finalizeBullet();

  return {
    title,
    intro: introLines.join('\n').trim(),
    entries,
  };
}

/**
 * 파싱 결과를 직렬화 가능한 객체로 변환합니다.
 */
function toClientFormat(parsed) {
  return {
    title: parsed.title,
    intro: parsed.intro,
    generatedAt: new Date().toISOString(),
    entries: parsed.entries.map(e => ({
      version: e.version,
      date: e.date,
      sections: e.sections,
    })),
  };
}

module.exports = { parseChangelog, toClientFormat };
