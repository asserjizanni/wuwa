const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const chars = await prisma.character.findMany({
    where: { slug: { in: ['hsin', 'mornye'] } }
  });
  console.log(JSON.stringify(chars, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
