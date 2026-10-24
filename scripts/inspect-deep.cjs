const fs = require('fs');
const html = fs.readFileSync('data_source/character_pages/qingxiao.html', 'utf8');

const weaponCardMatch = html.match(/<article class="[^"]*weapon[^"]*"[\s\S]*?<\/article>/i);
if (weaponCardMatch) {
  console.log('--- WEAPON CARD ---');
  console.log(weaponCardMatch[0]);
}

const matSections = html.match(/<section class="[^"]*material[^"]*"[\s\S]*?<\/section>/gi);
if (matSections) {
  console.log('--- MATERIAL SECTIONS COUNT ---', matSections.length);
  matSections.forEach((s, idx) => {
    console.log(`Mat section ${idx}:`, s.substring(0, 300));
  });
}

// Let's search for team articles or team structures
const teamArticles = html.match(/<article class="[^"]*team[^"]*"[\s\S]*?<\/article>/gi) || html.match(/<div class="[^"]*team[^"]*"[\s\S]*?<\/div>/gi);
console.log('--- TEAMS ---');
console.log('Team root match:', html.match(/<section[^>]+id="teams"[^>]*>([\s\S]*?)<\/section>/i)?.[0]?.substring(0, 800));
