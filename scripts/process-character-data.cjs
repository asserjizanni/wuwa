const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'data_source', 'character_pages');
const OUT_MAINS_DIR = path.join(__dirname, '..', 'storage', 'data', 'character_mains');
fs.mkdirSync(OUT_MAINS_DIR, { recursive: true });

function extractBetween(html, startStr, endStr) {
  const start = html.indexOf(startStr);
  if (start === -1) return null;
  const end = html.indexOf(endStr, start + startStr.length);
  if (end === -1) return null;
  return html.slice(start + startStr.length, end).trim();
}

function stripTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function processCharacterHtml(slug, html) {
  // Extract <main class="awcd-main" id="aw-main"> ... </main>
  const mainMatch = html.match(/<main class="awcd-main"[^>]*>([\s\S]*?)<\/main>/);
  const mainHtml = mainMatch ? mainMatch[0] : null;

  if (mainHtml) {
    fs.writeFileSync(path.join(OUT_MAINS_DIR, `${slug}.html`), mainHtml, 'utf8');
  }

  // Extract showcase config
  // <div class="character-page-showcase-config" data-name="شوركيبر" data-file-name="shorekeeper" data-element="spectro" data-element-label="سبيكترو" data-weapon="Rectifier" data-weapon-label="ريكتيفاير" data-version="1.3" data-role="سبورت سبيكترو بالريكتيفاير"
  const configMatch = html.match(/<div class="character-page-showcase-config"([^>]+)>/);
  const configAttrs = {};
  if (configMatch) {
    const attrRegex = /data-([a-zA-Z0-9_\-]+)="([^"]*)"/g;
    let m;
    while ((m = attrRegex.exec(configMatch[1])) !== null) {
      configAttrs[m[1]] = m[2];
    }
  }

  const name = extractBetween(html, '<p class="awcd-alt-name"', '</p>')?.replace(/^[^>]*>/, '').trim() || configAttrs['file-name'] || slug;
  const nameAr = configAttrs['name'] || extractBetween(html, '<h1 id="awcd-title">', '</h1>');
  const role = configAttrs['role'] || extractBetween(html, '<p class="awcd-eyebrow">', '</p>');
  const summary = extractBetween(html, '<p class="awcd-hero-summary">', '</p>');
  const lede = extractBetween(html, '<p class="awcd-hero-lede">', '</p>');

  // Extract Talents
  // <article class="awcd-talent-card" data-talent="basicAttack"> ...
  const talents = [];
  const talentMatches = html.match(/<article class="awcd-talent-card"[^>]*>([\s\S]*?)<\/article>/g) || [];
  for (const tHtml of talentMatches) {
    const talentKey = tHtml.match(/data-talent="([^"]+)"/)?.[1];
    const category = extractBetween(tHtml, '<p>', '</p>');
    const tName = extractBetween(tHtml, '<h3>', '</h3>');
    const descBlock = extractBetween(tHtml, '<div class="awcd-talent-description"', '</article>') || '';
    const descText = stripTags(descBlock);
    talents.push({
      key: talentKey,
      category,
      name: tName,
      description: descText
    });
  }

  // Extract Sequences
  // <article class="character-page-sequence-card ... data-sequence-node="1">
  const sequences = [];
  const seqMatches = html.match(/<article class="[^"]*awcd-sequence-card[^"]*"[^>]*data-sequence-node="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g) || [];
  for (const sHtml of seqMatches) {
    const node = sHtml.match(/data-sequence-node="([^"]+)"/)?.[1];
    const sName = extractBetween(sHtml, '<h3 class="character-page-sequence-name">', '</h3>');
    const sDesc = stripTags(extractBetween(sHtml, '<div class="awcd-sequence-description">', '</div>') || '');
    const starsMatch = sHtml.match(/data-priority="([^"]+)"/);
    sequences.push({
      node: Number(node),
      name: sName,
      description: sDesc,
      priorityStars: starsMatch ? Number(starsMatch[1]) : 5
    });
  }

  // Check details json
  let details = null;
  const jsonPath = path.join(__dirname, '..', 'public', 'data', 'character-details', `${slug}.json`);
  if (fs.existsSync(jsonPath)) {
    try {
      details = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch {}
  }

  return {
    slug,
    name,
    nameAr,
    role,
    summary,
    lede,
    config: configAttrs,
    talents,
    sequences,
    hasMain: !!mainHtml,
    stats: details?.stats || null,
    multipliers: details?.multipliers || null
  };
}

async function main() {
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
  console.log(`Processing ${files.length} character pages...`);

  const results = {};
  for (const f of files) {
    const slug = f.replace('.html', '');
    const html = fs.readFileSync(path.join(PAGES_DIR, f), 'utf8');
    const data = processCharacterHtml(slug, html);
    results[slug] = data;
  }

  const outData = path.join(__dirname, '..', 'storage', 'data', 'characters_rich_data.json');
  fs.writeFileSync(outData, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved rich data to ${outData}`);
  console.log('Sample shorekeeper:', results['shorekeeper'] ? {
    name: results['shorekeeper'].name,
    nameAr: results['shorekeeper'].nameAr,
    talentsCount: results['shorekeeper'].talents.length,
    sequencesCount: results['shorekeeper'].sequences.length,
    hasStats: !!results['shorekeeper'].stats
  } : 'none');
}

main().catch(console.error);
