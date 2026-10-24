const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const [admin, char, guide, page, weapon, set, echo, enemy, tier, team] = await Promise.all([
    p.adminUser.count(),
    p.character.count(),
    p.buildGuide.count(),
    p.guidePage.count(),
    p.weapon.count(),
    p.sonataSet.count(),
    p.echo.count(),
    p.enemy.count(),
    p.tierList.count(),
    p.teamComp.count(),
  ]);

  console.log('LIVE DATABASE RECORD COUNTS:');
  console.log({
    adminUsers: admin,
    characters: char,
    buildGuides: guide,
    guidePages: page,
    weapons: weapon,
    sonataSets: set,
    echoes: echo,
    enemies: enemy,
    tierLists: tier,
    teamComps: team,
  });
}

check()
  .catch(console.error)
  .finally(() => p.$disconnect());
