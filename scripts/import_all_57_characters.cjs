const fs = require('fs');
const path = require('path');
const { PrismaClient, Element, WeaponType, Rarity } = require('@prisma/client');

const prisma = new PrismaClient();

function mapElement(el) {
  if (!el) return Element.SPECTRO;
  const s = String(el).toUpperCase();
  if (s.includes('AERO')) return Element.AERO;
  if (s.includes('ELECTRO')) return Element.ELECTRO;
  if (s.includes('FUSION')) return Element.FUSION;
  if (s.includes('GLACIO')) return Element.GLACIO;
  if (s.includes('HAVOC')) return Element.HAVOC;
  if (s.includes('SPECTRO')) return Element.SPECTRO;
  return Element.SPECTRO;
}

function mapWeaponType(wt) {
  if (!wt) return WeaponType.SWORD;
  const s = String(wt).toUpperCase();
  if (s.includes('BROADBLADE')) return WeaponType.BROADBLADE;
  if (s.includes('SWORD')) return WeaponType.SWORD;
  if (s.includes('PISTOL')) return WeaponType.PISTOLS;
  if (s.includes('GAUNTLET')) return WeaponType.GAUNTLETS;
  if (s.includes('RECTIFIER')) return WeaponType.RECTIFIER;
  return WeaponType.SWORD;
}

function mapRarity(r) {
  if (r === 4 || r === '4' || r === 'FOUR_STAR') return Rarity.FOUR_STAR;
  if (r === 5 || r === '5' || r === 'FIVE_STAR') return Rarity.FIVE_STAR;
  return Rarity.FIVE_STAR;
}

async function main() {
  console.log('=== IMPORTING ALL 57 CHARACTERS INTO DATABASE ===\n');

  const cleanFull = JSON.parse(fs.readFileSync('storage/data/characters_clean_full.json', 'utf8'));
  const rawAw = JSON.parse(fs.readFileSync('data_source/characters.json', 'utf8'));
  const awList = Array.isArray(rawAw) ? rawAw : Object.values(rawAw);

  const awMetaMap = new Map();
  for (const item of awList) {
    if (item && item.id) {
      awMetaMap.set(String(item.id).toLowerCase(), item);
    }
  }

  let imported = 0;

  for (const [slug, data] of Object.entries(cleanFull)) {
    const awMeta = awMetaMap.get(slug.toLowerCase()) || {};

    const name = data.name || awMeta.name || slug;
    const nameAr = data.nameAr || awMeta.arabicName || name;
    const element = mapElement(data.element || awMeta.element);
    const weaponType = mapWeaponType(data.weaponType || awMeta.weapon);
    const rarity = mapRarity(awMeta.stars || (['mortefi', 'sanhua', 'chixia', 'danjin', 'baizhi', 'yuanwu', 'taoqi', 'yangyang', 'aalto', 'youhu', 'lumi'].includes(slug) ? 4 : 5));

    let portraitPath = `/images/characters/${slug}.webp`;
    if (!fs.existsSync(path.join('public', portraitPath))) {
      // Check without the-
      const alt = `/images/characters/${slug.replace(/^the-/, '')}.webp`;
      if (fs.existsSync(path.join('public', alt))) {
        portraitPath = alt;
      }
    }

    const record = {
      name,
      nameAr,
      element,
      weaponType,
      rarity,
      portraitPath,
      role: data.role || awMeta.role || 'DPS',
      description: data.summary || data.lede || null,
      descriptionAr: data.summary || data.lede || null,
      stats: data.stats || null,
      skills: data.talents || null,
      ascensionMaterials: data.ascensionMaterials || null,
      skillMaterials: data.skillMaterials || null,
      recommendedEchoes: data.recommendedEchoes || null,
      recommendedWeapons: data.weaponsDPS || null,
      teamComps: data.synergies || data.teams || null,
      buildTips: data.summary || data.lede || null,
      isPublished: true,
    };

    await prisma.character.upsert({
      where: { slug },
      update: record,
      create: {
        slug,
        ...record,
      },
    });

    imported++;
  }

  // Also ensure alias slugs exist so both versions work seamlessly:
  const aliases = [
    { from: 'the-shorekeeper', to: 'shorekeeper' },
    { from: 'shorekeeper', to: 'the-shorekeeper' },
    { from: 'jinshi', to: 'jinhsi' },
    { from: 'jinhsi', to: 'jinshi' },
    { from: 'camellia', to: 'camellya' },
    { from: 'camellya', to: 'camellia' },
    { from: 'zhezi', to: 'zhezhi' },
    { from: 'zhezhi', to: 'zhezi' },
    { from: 'rover', to: 'rover-spectro' },
    { from: 'yangyang-xuanling', to: 'xuanling' },
  ];

  for (const { from, to } of aliases) {
    const target = await prisma.character.findUnique({ where: { slug: to } });
    if (target) {
      await prisma.character.upsert({
        where: { slug: from },
        update: {
          portraitPath: target.portraitPath,
          nameAr: target.nameAr,
          element: target.element,
          weaponType: target.weaponType,
        },
        create: {
          slug: from,
          name: target.name,
          nameAr: target.nameAr,
          element: target.element,
          weaponType: target.weaponType,
          rarity: target.rarity,
          portraitPath: target.portraitPath,
          role: target.role,
          description: target.description,
          descriptionAr: target.descriptionAr,
          stats: target.stats,
          skills: target.skills,
          ascensionMaterials: target.ascensionMaterials,
          skillMaterials: target.skillMaterials,
          recommendedEchoes: target.recommendedEchoes,
          recommendedWeapons: target.recommendedWeapons,
          teamComps: target.teamComps,
          buildTips: target.buildTips,
          isPublished: true,
        },
      });
    }
  }

  const totalInDb = await prisma.character.count();
  console.log(`✓ Upserted ${imported} characters. Total in DB now: ${totalInDb}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
