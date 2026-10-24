const fs = require('fs');
const path = require('path');

const CHARACTERS_FILE = path.join(__dirname, '..', 'storage', 'data', 'characters.json');
const RICH_DATA_FILE = path.join(__dirname, '..', 'storage', 'data', 'characters_rich_data.json');

const characters = JSON.parse(fs.readFileSync(CHARACTERS_FILE, 'utf8'));
const richData = JSON.parse(fs.readFileSync(RICH_DATA_FILE, 'utf8'));

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
  'qiuyuan': 'qiuyuan',
  'buling': 'buling',
  'rover': 'rover-electro'
};

let updated = 0;
for (const c of characters) {
  const arabSlug = ALIASES[c.slug] || c.slug;
  const rich = richData[arabSlug];

  if (rich) {
    updated++;
    c.nameAr = rich.nameAr || c.nameAr;
    c.role = rich.role || c.role;
    c.descriptionAr = rich.summary || rich.lede || c.descriptionAr;
    c.stats = rich.stats || c.stats;
    c.skills = rich.talents || c.skills;
    c.buildTips = rich.summary || c.buildTips;
    c.arabwuwaSlug = arabSlug;
  }
}

fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2), 'utf8');
console.log(`Updated storage/data/characters.json: ${updated}/${characters.length} characters enhanced with rich data!`);
