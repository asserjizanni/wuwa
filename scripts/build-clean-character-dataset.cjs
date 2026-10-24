const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'data_source', 'character_pages');
const DETAILS_DIR = path.join(__dirname, '..', 'public', 'data', 'character-details');
const OUT_FILE = path.join(__dirname, '..', 'storage', 'data', 'characters_clean_full.json');

function stripTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanSkillDesc(desc) {
  if (!desc) return '';
  let d = desc;
  // Remove id="awcd-def-talent-..." prefix if present
  d = d.replace(/^id="[^"]*">\s*/, '');
  // Remove "المضاعفات Lv. 10..." and anything after
  d = d.replace(/المضاعفات\s*Lv\.\s*\d+[\s\S]*$/i, '');
  d = d.replace(/المضاعفات[\s\S]*$/i, '');
  return d.trim();
}

function processCharacter(slug) {
  const htmlFile = path.join(PAGES_DIR, `${slug}.html`);
  if (!fs.existsSync(htmlFile)) return null;
  const html = fs.readFileSync(htmlFile, 'utf8');

  // Config attributes
  const configMatch = html.match(/<div class="character-page-showcase-config"([^>]+)>/);
  const configAttrs = {};
  if (configMatch) {
    const attrRegex = /data-([a-zA-Z0-9_\-]+)="([^"]*)"/g;
    let m;
    while ((m = attrRegex.exec(configMatch[1])) !== null) {
      configAttrs[m[1]] = m[2];
    }
  }

  const name = html.match(/<p class="awcd-alt-name"[^>]*>([^<]+)<\/p>/)?.[1]?.trim() || configAttrs['file-name'] || slug;
  const nameAr = configAttrs['name'] || html.match(/<h1 id="awcd-title"[^>]*>([^<]+)<\/h1>/)?.[1]?.trim();
  const role = configAttrs['role'] || html.match(/<p class="awcd-eyebrow"[^>]*>([^<]+)<\/p>/)?.[1]?.trim();
  const summary = html.match(/<p class="awcd-hero-summary"[^>]*>([^<]+)<\/p>/)?.[1]?.trim();
  const lede = html.match(/<p class="awcd-hero-lede"[^>]*>([^<]+)<\/p>/)?.[1]?.trim();

  // Element & Weapon
  let element = configAttrs['element'] || html.match(/data-awcd-element="([^"]+)"/)?.[1] || 'spectro';
  let weapon = configAttrs['weapon'] || html.match(/data-weapon="([^"]+)"/)?.[1] || 'Sword';
  let version = configAttrs['version'] || '1.0';

  // Stats from JSON details
  let stats = null;
  const jsonPath = path.join(DETAILS_DIR, `${slug}.json`);
  if (fs.existsSync(jsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (parsed.stats) stats = parsed.stats;
    } catch {}
  }

  // Talents
  const talents = [];
  const talentCards = html.match(/<article class="awcd-talent-card"[\s\S]*?<\/article>/g) || [];
  for (const tHtml of talentCards) {
    const key = tHtml.match(/data-talent="([^"]+)"/)?.[1] || '';
    const icon = tHtml.match(/<img[^>]+src="([^"]+)"/)?.[1] || '';
    const category = tHtml.match(/<header>[\s\S]*?<p>([^<]+)<\/p>/)?.[1]?.trim() || '';
    const tName = tHtml.match(/<h3>([^<]+)<\/h3>/)?.[1]?.trim() || '';
    
    // Extract description block
    const descMatch = tHtml.match(/<div class="awcd-talent-description"[^>]*>([\s\S]*?)<\/div>\s*<details/);
    let descHtml = descMatch ? descMatch[1] : '';
    if (!descHtml) {
      const fallbackMatch = tHtml.match(/<div class="awcd-talent-description"[^>]*>([\s\S]*?)<\/div>/);
      descHtml = fallbackMatch ? fallbackMatch[1] : '';
    }
    const cleanDesc = cleanSkillDesc(stripTags(descHtml));

    talents.push({
      key,
      category,
      name: tName,
      icon,
      description: cleanDesc
    });
  }

  // Sequences S1 - S6
  const sequences = [];
  const seqCards = html.match(/<article class="[^"]*awcd-sequence-card[^"]*"[\s\S]*?<\/article>/g) || [];
  for (const sHtml of seqCards) {
    const node = Number(sHtml.match(/data-sequence-node="([^"]+)"/)?.[1] || sequences.length + 1);
    const icon = sHtml.match(/<img[^>]+src="([^"]+)"/)?.[1] || '';
    const sName = sHtml.match(/<h3 class="character-page-sequence-name"[^>]*>([^<]+)<\/h3>/)?.[1]?.trim() || '';
    const descMatch = sHtml.match(/<div class="awcd-sequence-description"[^>]*>([\s\S]*?)<\/div>/);
    const desc = stripTags(descMatch ? descMatch[1] : '');
    const starsMatch = sHtml.match(/data-priority="([^"]+)"/);
    const stars = starsMatch ? Number(starsMatch[1]) : 5;

    sequences.push({
      node,
      name: sName,
      icon,
      description: desc,
      priorityStars: stars
    });
  }

  // Synergies (characters suitable with this character)
  const synergies = [];
  const synergyItems = html.match(/<a class="character-page-synergies-section-item"[\s\S]*?<\/a>/g) || [];
  for (const synHtml of synergyItems) {
    const synHref = synHtml.match(/href="([^"]+)"/)?.[1] || '';
    const synSlug = synHref.replace(/^\/(?:ar\/)?characters\//, '').replace(/\/$/, '');
    const synImg = synHtml.match(/src="([^"]+)"/)?.[1] || '';
    const synName = synHtml.match(/<span>([^<]+)<\/span>/)?.[1]?.trim() || synSlug;
    if (synSlug) {
      synergies.push({
        slug: synSlug,
        name: synName,
        icon: synImg
      });
    }
  }

  // Materials
  const materials = [];
  const matCards = html.match(/<article class="character-page-upgrading-materials-card"[\s\S]*?<\/article>/g) || [];
  for (const mHtml of matCards) {
    const img = mHtml.match(/src="([^"]+)"/)?.[1] || '';
    const amount = mHtml.match(/<strong class="cp-materials-count-amount"[^>]*>([\s\S]*?)<\/strong>/)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
    const mName = mHtml.match(/<span class="cp-materials-count-name"[^>]*>([^<]+)<\/span>/)?.[1]?.trim() || '';
    if (mName && !materials.some(m => m.name === mName)) {
      materials.push({
        name: mName,
        amount,
        icon: img
      });
    }
  }

  // Build recommendations (Weapons & Echoes extracted from characters.json if present)
  return {
    slug,
    name,
    nameAr,
    role,
    summary,
    lede,
    element: element.toUpperCase(),
    weaponType: weapon.toUpperCase(),
    version,
    stats,
    talents,
    sequences,
    synergies,
    materials
  };
}

async function main() {
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
  console.log(`Processing ${files.length} characters into clean JSON...`);

  const results = {};
  for (const f of files) {
    const slug = f.replace('.html', '');
    const char = processCharacter(slug);
    if (char) results[slug] = char;
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Successfully generated ${OUT_FILE}`);
  console.log('Sample qingxiao talents count:', results['qingxiao']?.talents.length, 'sequences:', results['qingxiao']?.sequences.length);
}

main().catch(console.error);
