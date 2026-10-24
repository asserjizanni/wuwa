const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const hsin = await prisma.character.findUnique({ where: { slug: 'hsin' } });
  if (hsin && hsin.backgroundPath && hsin.backgroundPath.startsWith('data:')) {
    const b64 = hsin.backgroundPath.split(',')[1];
    fs.writeFileSync('public/images/characters/hsin.webp', Buffer.from(b64, 'base64'));
    console.log('Saved hsin backgroundPath base64 as public/images/characters/hsin.webp, size:', fs.statSync('public/images/characters/hsin.webp').size);
  } else {
    console.log('hsin backgroundPath is not base64:', hsin?.backgroundPath);
  }
  
  const mornye = await prisma.character.findUnique({ where: { slug: 'mornye' } });
  if (mornye && mornye.backgroundPath && mornye.backgroundPath.startsWith('data:')) {
    const b64 = mornye.backgroundPath.split(',')[1];
    fs.writeFileSync('public/images/characters/mornye.webp', Buffer.from(b64, 'base64'));
    console.log('Saved mornye backgroundPath base64 as public/images/characters/mornye.webp, size:', fs.statSync('public/images/characters/mornye.webp').size);
  } else {
    console.log('mornye backgroundPath is not base64:', mornye?.backgroundPath);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
