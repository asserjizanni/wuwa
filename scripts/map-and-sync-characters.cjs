const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  const env = fs.readFileSync(envFile, 'utf8');
  env.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value.trim();
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const RICH_DATA_FILE = path.join(__dirname, '..', 'storage', 'data', 'characters_rich_data.json');
const richData = JSON.parse(fs.readFileSync(RICH_DATA_FILE, 'utf8'));

// Slug aliases: dbSlug -> arabwuwaSlug
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

async function sync() {
  const dbChars = await prisma.character.findMany();
  console.log(`Found ${dbChars.length} DB characters.`);

  let matched = 0;
  for (const c of dbChars) {
    const arabSlug = ALIASES[c.slug] || c.slug;
    const rich = richData[arabSlug];

    if (rich) {
      matched++;
      // Update DB record
      const updateData = {
        nameAr: rich.nameAr || c.nameAr,
        role: rich.role || c.role,
        descriptionAr: rich.summary || rich.lede || c.descriptionAr,
        stats: rich.stats || undefined,
        skills: rich.talents && rich.talents.length > 0 ? rich.talents : undefined,
        buildTips: rich.summary || undefined
      };

      await prisma.character.update({
        where: { id: c.id },
        data: updateData
      });

      console.log(`Updated [${c.slug}] -> arabwuwa [${arabSlug}] (${rich.nameAr})`);
    } else {
      console.warn(`No arabwuwa data for [${c.slug}] (tried ${arabSlug})`);
    }
  }

  console.log(`Successfully synced ${matched}/${dbChars.length} characters in database!`);
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
