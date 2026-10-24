const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const chars = await prisma.character.findMany({
    select: { id: true, name: true, nameAr: true, slug: true }
  });
  console.log(`Total characters in db: ${chars.length}`);
  console.log(chars.map(c => `${c.slug} (${c.nameAr || c.name})`).join(', '));
  await prisma.$disconnect();
}
check().catch(console.error);
