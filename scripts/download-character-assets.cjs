const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'data_source', 'character_pages');
const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));

const allImageUrls = new Set();
const regex = /\/images\/[a-zA-Z0-9_\-\.\/]+(?:\?[a-zA-Z0-9_\-\.=&]*)?/g;

for (const file of files) {
  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
  const matches = content.match(regex) || [];
  for (const m of matches) {
    const clean = m.split('?')[0];
    allImageUrls.add(clean);
  }
}

const list = Array.from(allImageUrls);
console.log(`Found ${list.length} unique images across all character pages.`);

async function downloadFile(urlPath) {
  const targetFile = path.join(__dirname, '..', 'public', urlPath.replace(/^\//, ''));
  if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 0) {
    return; // Already downloaded
  }
  const dir = path.dirname(targetFile);
  fs.mkdirSync(dir, { recursive: true });

  const url = `https://arabwuwa.com${urlPath}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) {
      // console.warn(`Skip ${urlPath}: ${res.status}`);
      return;
    }
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(targetFile, Buffer.from(arrayBuffer));
  } catch (err) {
    // console.warn(`Error ${urlPath}: ${err.message}`);
  }
}

async function main() {
  console.log(`Checking & downloading assets...`);
  let downloadedCount = 0;
  // Process in chunks of 15
  for (let i = 0; i < list.length; i += 15) {
    const chunk = list.slice(i, i + 15);
    await Promise.all(chunk.map(downloadFile));
    downloadedCount += chunk.length;
    if (downloadedCount % 150 === 0 || downloadedCount === list.length) {
      console.log(`Progress: ${downloadedCount}/${list.length}`);
    }
  }
  console.log('Finished downloading all character assets!');
}

main().catch(console.error);
