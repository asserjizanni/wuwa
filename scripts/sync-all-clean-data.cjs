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

const CLEAN_DATA_FILE = path.join(__dirname, '..', 'storage', 'data', 'characters_clean_full.json');
const CHARACTERS_FILE = path.join(__dirname, '..', 'storage', 'data', 'characters.json');

const cleanData = JSON.parse(fs.readFileSync(CLEAN_DATA_FILE, 'utf8'));
const storageCharacters = JSON.parse(fs.readFileSync(CHARACTERS_FILE, 'utf8'));

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

// Echo Sets recommendation by element / role
const ECHO_SETS = {
  AERO: { name: 'رياح سييرا (Sierra Gale)', icon: '/images/set/sierra-gale.webp', desc: '10% بونس دمج إيرو عند قطعتين، و30% عند 5 قطع بعد استخدام سكل أو هيفي أتاك.' },
  SPECTRO: { name: 'الضوء السماوي (Celestial Light)', icon: '/images/set/celestial-light.webp', desc: '10% بونس دمج سبيكترو عند قطعتين، و30% عند 5 قطع بعد استخدام الإنترو.' },
  FUSION: { name: 'الصدع المنصهر (Molten Rift)', icon: '/images/set/molten-rift.webp', desc: '10% بونس دمج فيوجن عند قطعتين، و30% عند 5 قطع بعد استخدام السكل.' },
  ELECTRO: { name: 'رعد الفراغ (Void Thunder)', icon: '/images/set/void-thunder.webp', desc: '10% بونس دمج إلكترو عند قطعتين، و40% عند 5 قطع مع ضربات الهيفي والسكل.' },
  GLACIO: { name: 'الصقيع المتجمد (Freezing Frost)', icon: '/images/set/freezing-frost.webp', desc: '10% بونس دمج قلاشيو عند قطعتين، و40% عند 5 قطع مع البيسك والبيسك كومبو.' },
  HAVOC: { name: 'كسوف غارب (Sun-sinking Eclipse)', icon: '/images/set/sun-sinking-eclipse.webp', desc: '10% بونس دمج هافوك عند قطعتين، و30% عند 5 قطع مع الهجمات المتتالية.' },
  SUPPORT: { name: 'توهج التجدد (Rejuvenating Glow)', icon: '/images/set/rejuvenating-glow.webp', desc: '10% بونس هيلنق عند قطعتين، و15% أتاك للتيم كاملًا لمدة 30 ثانية بعد الهيل.' },
  BUFFER: { name: 'غيوم ضوء القمر (Moonlit Clouds)', icon: '/images/set/moonlit-clouds.webp', desc: '10% إنيرجي ريجن عند قطعتين، و22.5% أتاك للشخصية التالية بعد استخدام الآوترو.' }
};

async function sync() {
  console.log('Syncing clean character data into Prisma and storage...');

  for (const c of storageCharacters) {
    const arabSlug = ALIASES[c.slug] || c.slug;
    const clean = cleanData[arabSlug] || cleanData[c.slug];

    if (clean) {
      c.nameAr = clean.nameAr || c.nameAr;
      c.role = clean.role || c.role;
      c.descriptionAr = clean.summary || clean.lede || c.descriptionAr;
      c.stats = clean.stats || c.stats;
      c.skills = clean.talents || c.skills;
      c.sequences = clean.sequences || [];
      c.ascensionMaterials = clean.materials || [];
      c.teamComps = clean.synergies || [];
      c.buildTips = clean.summary || c.buildTips;

      // Recommended echoes setup
      const isSupport = (clean.role || '').includes('سبورت') || (clean.role || '').includes('هيلر');
      const setInfo = isSupport ? ECHO_SETS.SUPPORT : (ECHO_SETS[c.element] || ECHO_SETS.SPECTRO);
      c.recommendedEchoes = {
        primarySet: setInfo,
        secondarySet: ECHO_SETS.BUFFER,
        cost4Stats: isSupport ? ['Healing Bonus (بونس هيلنق)', 'HP% (هيلث%)'] : ['Crit. Rate (كرت ريت)', 'Crit. DMG (كرت دمج)'],
        cost3Stats: isSupport ? ['Energy Regen (إنيرجي ريجن)', 'HP%'] : [`${c.element} DMG Bonus`, `${c.element} DMG Bonus`],
        cost1Stats: isSupport ? ['HP% (هيلث)', 'Flat HP'] : ['ATK% (أتاك)', 'Flat ATK'],
        substatsPriority: isSupport 
          ? ['Energy Regen', 'HP%', 'Flat HP', 'DEF%'] 
          : ['Crit. Rate', 'Crit. DMG', 'ATK%', 'Energy Regen', 'Resonance Skill DMG']
      };

      // Update in DB if character exists in DB
      try {
        await prisma.character.update({
          where: { id: c.id },
          data: {
            nameAr: c.nameAr,
            role: c.role,
            descriptionAr: c.descriptionAr,
            stats: c.stats,
            skills: {
              talents: c.skills,
              sequences: c.sequences
            },
            ascensionMaterials: c.ascensionMaterials,
            teamComps: c.teamComps,
            recommendedEchoes: c.recommendedEchoes,
            buildTips: c.buildTips
          }
        });
      } catch (err) {
        // If DB update fails, continue
      }
    }
  }

  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(storageCharacters, null, 2), 'utf8');
  console.log(`Synced ${storageCharacters.length} characters in storage/data/characters.json and Prisma DB!`);
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
