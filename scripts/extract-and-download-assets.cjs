const fs = require('fs');
const path = require('path');

async function downloadFile(urlPath) {
  const cleanPath = urlPath.split('?')[0];
  const targetFile = path.join(__dirname, '..', 'public', cleanPath.replace(/^\//, ''));
  if (fs.existsSync(targetFile)) {
    return; // Already downloaded
  }
  const dir = path.dirname(targetFile);
  fs.mkdirSync(dir, { recursive: true });

  const url = `https://arabwuwa.com${cleanPath}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`Skip ${cleanPath}: ${res.status}`);
      return;
    }
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(targetFile, Buffer.from(arrayBuffer));
    console.log(`Downloaded: ${cleanPath}`);
  } catch (err) {
    console.warn(`Skip ${cleanPath}: ${err.message}`);
  }
}

async function main() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'data_source', 'arabwuwa_home.html'), 'utf8');
  const cssShell = fs.readFileSync(path.join(__dirname, '..', 'data_source', 'aw-shell.css'), 'utf8');
  const cssHome = fs.readFileSync(path.join(__dirname, '..', 'data_source', 'aw-home-v2.css'), 'utf8');

  const combined = html + '\n' + cssShell + '\n' + cssHome;
  const regex = /\/images\/[a-zA-Z0-9_\-\.\/]+(?:\?[a-zA-Z0-9_\-\.=&]*)?/g;
  const matches = [...combined.matchAll(regex)].map(m => m[0]);
  const uniqueUrls = [...new Set(matches.map(u => u.split('?')[0]))];

  console.log(`Checking ${uniqueUrls.length} assets...`);
  // Process in chunks of 10
  for (let i = 0; i < uniqueUrls.length; i += 10) {
    const chunk = uniqueUrls.slice(i, i + 10);
    await Promise.all(chunk.map(downloadFile));
  }
  console.log('All downloads completed!');
}

main().catch(console.error);
