const fs = require('fs');
const path = require('path');

const sampleFiles = ['qingxiao.html', 'shorekeeper.html', 'camellya.html', 'jinhsi.html', 'changli.html'];
for (const f of sampleFiles) {
  const filePath = path.join('data_source', 'character_pages', f);
  if (!fs.existsSync(filePath)) continue;
  const html = fs.readFileSync(filePath, 'utf8');

  console.log('=== Character:', f, '===');
  
  // Damage chart
  const dmgMatch = html.match(/class="character-page-damage-breakdown-chart"([^>]+)>/);
  if (dmgMatch) {
    console.log('Damage chart attrs:', dmgMatch[1]);
  }

  // Weapon cards
  const weaponRegex = /<article class="[^"]*weapon[^"]*"[\s\S]*?<\/article>/gi;
  const wMatches = html.match(weaponRegex);
  console.log('Weapon articles:', wMatches ? wMatches.length : 0);
  if (wMatches && wMatches.length > 0) {
    console.log('Sample weapon card:', wMatches[0].substring(0, 300));
  }

  // Team sections
  const teamMatches = html.match(/class="[^"]*team[^"]*"[\s\S]*?<\/section>/gi);
  console.log('Team sections count:', teamMatches ? teamMatches.length : 0);

  // Materials groups
  const matGroups = html.match(/<section class="[^"]*material[^"]*"[\s\S]*?<\/section>/gi);
  console.log('Material sections count:', matGroups ? matGroups.length : 0);
}
