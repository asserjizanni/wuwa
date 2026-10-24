const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== SYNCING COMING SOON STATUS AND VERSIONS ===\n');

  const rawAw = JSON.parse(fs.readFileSync('data_source/characters.json', 'utf8'));
  const awList = Array.isArray(rawAw) ? rawAw : Object.values(rawAw);

  const upcomingMap = new Map();
  for (const c of awList) {
    if (c && c.id && c.version && parseFloat(c.version) >= 3.0) {
      upcomingMap.set(String(c.id).toLowerCase(), String(c.version));
    }
  }

  console.log('Found', upcomingMap.size, 'upcoming characters in reference data:');
  for (const [id, ver] of upcomingMap.entries()) {
    console.log(` - ${id} (Version ${ver})`);
  }

  // Update DB characters
  const allChars = await prisma.character.findMany({ select: { id: true, slug: true, name: true } });
  let markedSoon = 0;
  let markedAvailable = 0;

  for (const char of allChars) {
    const s = char.slug.toLowerCase();
    const ver = upcomingMap.get(s) || upcomingMap.get(s.replace(/^the-/, ''));

    if (ver) {
      await prisma.character.update({
        where: { id: char.id },
        data: {
          isComingSoon: true,
          releaseVersion: ver,
          isPublished: false, // Locked until published from admin
        },
      });
      markedSoon++;
    } else {
      await prisma.character.update({
        where: { id: char.id },
        data: {
          isComingSoon: false,
          isPublished: true, // Available
        },
      });
      markedAvailable++;
    }
  }

  console.log(`\n✓ Marked ${markedSoon} characters as Coming Soon (قريباً - مقفل).`);
  console.log(`✓ Marked ${markedAvailable} characters as Available (متاح).`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
