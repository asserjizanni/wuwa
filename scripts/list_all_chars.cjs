const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const chars = await prisma.character.findMany({
    select: { slug: true, name: true, nameAr: true, element: true, weaponType: true, portraitPath: true },
    orderBy: { slug: 'asc' }
  });
  console.log(`Total characters in DB: ${chars.length}`);
  chars.forEach(c => {
    console.log(`${c.slug.padEnd(20)} | ${c.name.padEnd(20)} | ${(c.nameAr || '').padEnd(20)} | ${c.weaponType.padEnd(12)} | ${c.portraitPath}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
