const fs = require('fs');
const path = require('path');

async function main() {
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'fonts', 'arab-wuwa', 'fonts.css'), 'utf8');
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/['"]/g, '').trim());
  console.log('Font files:', urls);

  for (const u of urls) {
    const clean = u.split('?')[0];
    const target = path.join(__dirname, '..', 'public', clean.startsWith('/') ? clean.slice(1) : clean);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (!fs.existsSync(target)) {
      const res = await fetch('https://arabwuwa.com' + clean);
      if (res.ok) {
        fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
        console.log('Downloaded font:', clean);
      } else {
        console.warn('Failed font:', clean, res.status);
      }
    } else {
      console.log('Font exists:', clean);
    }
  }
  console.log('All fonts done!');
}

main().catch(console.error);
