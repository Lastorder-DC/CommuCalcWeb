/**
 * CHANGELOG.md를 클라이언트용 JSON(public/changelog.json)으로 변환합니다.
 *
 * 지원 포맷:
 *   ## [1.2.3] - 2026-04-17     → { version: '1.2.3', date: '2026-04-17', sections: {...} }
 *   ## 2022-03-08                → { version: null, date: '2022-03-08', sections: {...} }
 *   ### Added | Changed | Fixed | ...
 *   - 항목 (여러 줄 가능)
 *
 * 사용: `npm run changelog`
 */

const fs = require('node:fs');
const path = require('node:path');

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

function main() {
  const inputPath = path.resolve(__dirname, '..', 'CHANGELOG.md');
  const outputPath = path.resolve(__dirname, '..', 'public', 'changelog.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`CHANGELOG.md를 찾을 수 없습니다: ${inputPath}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(inputPath, 'utf-8');
  const parsed = parseChangelog(markdown);
  const data = toClientFormat(parsed);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  console.log(`changelog.json 생성 완료: ${outputPath}`);
  console.log(`  버전/날짜 엔트리 ${data.entries.length}개`);
}

module.exports = { parseChangelog, toClientFormat };

if (require.main === module) {
  main();
}
