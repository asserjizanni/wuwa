const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const c = await prisma.character.findFirst({
    where: { slug: { contains: 'shorekeeper' } },
    select: { 
      id: true, 
      name: true, 
      nameAr: true, 
      slug: true, 
      stats: true, 
      skills: true, 
      recommendedWeapons: true, 
      recommendedEchoes: true, 
      ascensionMaterials: true, 
      skillMaterials: true,
      teamComps: true,
      buildTips: true
    }
  });
  console.log('ID:', c?.id, 'Name:', c?.name, 'NameAr:', c?.nameAr, 'Slug:', c?.slug);
  console.log('Stats:', typeof c?.stats, c?.stats ? Object.keys(c.stats) : null);
  console.log('Skills:', typeof c?.skills, c?.skills ? (Array.isArray(c.skills) ? c.skills.length : Object.keys(c.skills)) : null);
  console.log('Weapons:', c?.recommendedWeapons);
  console.log('Echoes:', c?.recommendedEchoes);
  console.log('ascensionMaterials:', c?.ascensionMaterials);
  console.log('teamComps:', c?.teamComps);
  console.log('Full skills sample:', JSON.stringify(c?.skills, null, 2)?.slice(0, 500));
  await prisma.$disconnect();
}
test().catch(console.error);
