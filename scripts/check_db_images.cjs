const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const chars = await prisma.character.findMany({
    where: {
      OR: [
        { portraitPath: { contains: '179278' } },
        { backgroundPath: { contains: '179278' } },
        { iconUrl: { contains: '179278' } }
      ]
    },
    select: { slug: true, name: true, portraitPath: true, backgroundPath: true, iconUrl: true }
  });
  console.log('Found in DB:', JSON.stringify(chars, null, 2));

  // Also check exact portraitPath of hsin and mornye
  const hsin = await prisma.character.findUnique({
    where: { slug: 'hsin' },
    select: { slug: true, name: true, nameAr: true, portraitPath: true, backgroundPath: true, iconUrl: true }
  });
  const mornye = await prisma.character.findUnique({
    where: { slug: 'mornye' },
    select: { slug: true, name: true, nameAr: true, portraitPath: true, backgroundPath: true, iconUrl: true }
  });
  console.log('hsin in DB:', hsin);
  console.log('mornye in DB:', mornye);
}

main().catch(console.error).finally(() => prisma.$disconnect());
