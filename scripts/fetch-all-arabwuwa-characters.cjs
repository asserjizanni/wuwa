const fs = require('fs');
const path = require('path');

const CHARACTERS_JSON = path.join(__dirname, '..', 'data_source', 'characters.json');
const OUT_DIR = path.join(__dirname, '..', 'data_source', 'character_pages');
const DETAILS_DIR = path.join(__dirname, '..', 'public', 'data', 'character-details');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(DETAILS_DIR, { recursive: true });

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function downloadCharacter(slug) {
  const htmlFile = path.join(OUT_DIR, `${slug}.html`);
  const jsonFile = path.join(DETAILS_DIR, `${slug}.json`);

  // 1. Fetch HTML
  let html = null;
  if (fs.existsSync(htmlFile) && fs.statSync(htmlFile).size > 1000) {
    html = fs.readFileSync(htmlFile, 'utf8');
  } else {
    try {
      const url = `https://arabwuwa.com/ar/characters/${slug}/`;
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        html = await res.text();
        fs.writeFileSync(htmlFile, html, 'utf8');
        console.log(`[OK HTML] ${slug} (${(html.length / 1024).toFixed(1)} KB)`);
      } else {
        console.warn(`[FAIL HTML] ${slug}: ${res.status}`);
      }
    } catch (e) {
      console.warn(`[ERROR HTML] ${slug}: ${e.message}`);
    }
  }

  // 2. Fetch JSON details
  if (!fs.existsSync(jsonFile) || fs.statSync(jsonFile).size < 100) {
    try {
      const jsonUrl = `https://arabwuwa.com/data/character-details/${slug}.json`;
      const res = await fetchWithTimeout(jsonUrl);
      if (res.ok) {
        const text = await res.text();
        fs.writeFileSync(jsonFile, text, 'utf8');
        console.log(`[OK JSON] ${slug}`);
      }
    } catch (e) {
      // not all characters might have json, ignore
    }
  }

  return html;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(CHARACTERS_JSON, 'utf8')).filter(c => !c.__meta);
  const slugs = data.map(c => c.id);
  console.log(`Starting download for ${slugs.length} characters...`);

  // Run in chunks of 5
  for (let i = 0; i < slugs.length; i += 5) {
    const chunk = slugs.slice(i, i + 5);
    await Promise.all(chunk.map(downloadCharacter));
  }

  console.log('All character pages downloaded!');
}

main().catch(console.error);
