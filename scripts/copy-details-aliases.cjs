const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'data', 'character-details');
const ALIASES = {
  'the-shorekeeper': 'shorekeeper',
  'camellia': 'camellya',
  'jinshi': 'jinhsi',
  'zhezi': 'zhezhi',
  'yangyang-xuanling': 'xuanling',
  'luuk': 'luukherssen',
  'luce': 'lucy',
  'aemeth': 'aemeath',
  'boccia': 'roccia',
  'rover': 'rover-electro'
};

for (const [alias, canonical] of Object.entries(ALIASES)) {
  const src = path.join(DIR, `${canonical}.json`);
  const dst = path.join(DIR, `${alias}.json`);
  if (fs.existsSync(src) && !fs.existsSync(dst)) {
    fs.copyFileSync(src, dst);
    console.log(`Copied ${canonical}.json -> ${alias}.json`);
  }
}
console.log('Aliases handled!');
