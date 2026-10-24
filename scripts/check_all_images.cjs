const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const chars = await prisma.character.findMany({
    select: {
      slug: true,
      name: true,
      nameAr: true,
      portraitPath: true,
      backgroundPath: true,
      iconUrl: true
    }
  });

  console.log('--- Characters with non-standard paths or base64 ---');
  for (const c of chars) {
    const isP64 = c.portraitPath && c.portraitPath.startsWith('data:');
    const isB64 = c.backgroundPath && c.backgroundPath.startsWith('data:');
    const isPStorage = c.portraitPath && c.portraitPath.includes('storage');
    const isBStorage = c.backgroundPath && c.backgroundPath.includes('storage');

    if (isP64 || isB64 || isPStorage || isBStorage) {
      console.log(`[${c.slug}]`);
      if (isP64) console.log(`  portraitPath: Base64 (${c.portraitPath.length} chars)`);
      else if (isPStorage) console.log(`  portraitPath: ${c.portraitPath}`);
      if (isB64) console.log(`  backgroundPath: Base64 (${c.backgroundPath.length} chars)`);
      else if (isBStorage) console.log(`  backgroundPath: ${c.backgroundPath}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
