const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CHARACTERS_FILE = path.join(__dirname, '..', 'storage', 'data', 'characters.json');
const CLEAN_FULL_FILE = path.join(__dirname, '..', 'storage', 'data', 'characters_clean_full.json');

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

async function main() {
  const characters = JSON.parse(fs.readFileSync(CHARACTERS_FILE, 'utf8'));
  const cleanFull = JSON.parse(fs.readFileSync(CLEAN_FULL_FILE, 'utf8'));

  let updatedJson = 0;
  let updatedDb = 0;

  for (const c of characters) {
    const arabSlug = ALIASES[c.slug] || c.slug;
    const clean = cleanFull[arabSlug] || cleanFull[c.slug];

    if (clean) {
      updatedJson++;
      c.nameAr = clean.nameAr || c.nameAr;
      c.role = clean.role || c.role;
      c.descriptionAr = clean.summary || clean.lede || c.descriptionAr;
      c.stats = clean.stats || c.stats;
      c.skills = clean.talents || c.skills;
      c.sequences = clean.sequences || c.sequences;
      c.weaponsDPS = clean.weaponsDPS || c.weaponsDPS;
      c.damageDistribution = clean.damageDistribution || c.damageDistribution;
      c.ascensionMaterials = clean.ascensionMaterials || c.ascensionMaterials;
      c.skillMaterials = clean.skillMaterials || c.skillMaterials;
      c.allMaterials = clean.allMaterials || c.allMaterials;
      c.recommendedEchoes = clean.recommendedEchoes || c.recommendedEchoes;
      c.teams = clean.teams || c.teams;
      c.teamComps = clean.synergies || c.teamComps;
      c.buildTips = clean.summary || c.buildTips;

      // Update in DB if character exists
      try {
        const dbChar = await prisma.character.findFirst({
          where: {
            OR: [
              { id: c.id },
              { slug: c.slug },
              { slug: arabSlug }
            ]
          }
        });

        if (dbChar) {
          await prisma.character.update({
            where: { id: dbChar.id },
            data: {
              nameAr: c.nameAr,
              role: c.role,
              descriptionAr: c.descriptionAr,
              stats: c.stats,
              skills: c.skills,
              ascensionMaterials: c.ascensionMaterials,
              skillMaterials: c.skillMaterials,
              recommendedWeapons: c.weaponsDPS,
              recommendedEchoes: c.recommendedEchoes,
              teamComps: c.teams
            }
          });
          updatedDb++;
        }
      } catch (err) {
        // DB update error or skipped
      }
    }
  }

  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2), 'utf8');
  console.log(`Updated storage/data/characters.json: ${updatedJson}/${characters.length} characters enhanced!`);
  console.log(`Updated database: ${updatedDb} characters synchronized!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
