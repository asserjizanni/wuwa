import { PrismaClient, WeaponType, Rarity } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function mapWeaponType(wt: string): WeaponType {
  if (!wt) return WeaponType.SWORD;
  const upper = wt.toUpperCase();
  if (upper.includes('BROADBLADE')) return WeaponType.BROADBLADE;
  if (upper.includes('SWORD')) return WeaponType.SWORD;
  if (upper.includes('PISTOL')) return WeaponType.PISTOLS;
  if (upper.includes('GAUNTLET')) return WeaponType.GAUNTLETS;
  if (upper.includes('RECTIFIER')) return WeaponType.RECTIFIER;
  return WeaponType.SWORD;
}

function mapRarity(r: any): Rarity {
  if (r === 5 || r === '5' || r === 'FIVE_STAR') return Rarity.FIVE_STAR;
  if (r === 4 || r === '4' || r === 'FOUR_STAR') return Rarity.FOUR_STAR;
  if (r === 3 || r === '3' || r === 'THREE_STAR') return Rarity.THREE_STAR;
  if (r === 2 || r === '2' || r === 'TWO_STAR') return Rarity.TWO_STAR;
  if (r === 1 || r === '1' || r === 'ONE_STAR') return Rarity.ONE_STAR;
  return Rarity.FOUR_STAR;
}

async function run() {
  console.log('=== FAST IMPORT: WEAPONS, SETS, ECHOES, ENEMIES ===\n');

  // 1. WEAPONS
  const weaponsFile = path.join(process.cwd(), 'data_source', 'weapons.json');
  if (fs.existsSync(weaponsFile)) {
    const rawWeapons = JSON.parse(fs.readFileSync(weaponsFile, 'utf8'));
    const weaponsList = Array.isArray(rawWeapons) ? rawWeapons : Object.values(rawWeapons);
    console.log(`Processing ${weaponsList.length} weapons...`);

    const weaponRecords = (weaponsList as any[]).map(w => {
      const slug = String(w.id || w.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      
      let descEn = '';
      let descAr = '';
      if (typeof w.desc === 'string') {
        descEn = w.desc;
      } else if (w.desc && typeof w.desc === 'object') {
        descEn = w.desc.en ? (typeof w.desc.en === 'string' ? w.desc.en : w.desc.en['5'] || w.desc.en['1'] || JSON.stringify(w.desc.en)) : '';
        descAr = w.desc.ar ? (typeof w.desc.ar === 'string' ? w.desc.ar : w.desc.ar['5'] || w.desc.ar['1'] || JSON.stringify(w.desc.ar)) : '';
      }

      return {
        slug,
        name: w.name,
        nameAr: w.nameAr || null,
        weaponType: mapWeaponType(w.type),
        rarity: mapRarity(w.rarity || w.stars),
        stars: Number(w.rarity || w.stars) || 4,
        iconUrl: w.image,
        imageBig: w.imagebig,
        desc: descEn || null,
        descAr: descAr || null,
        buffs: w.buffs || null,
        passiveBuffs: w.passiveBuffs || null,
        stats: w.stats || null,
        signatureCharacter: w.signatureCharacter || null,
        signatureCharacterId: w.signatureCharacterId ? String(w.signatureCharacterId) : null,
        compatibleCharacters: w.characters ? (Array.isArray(w.characters) ? w.characters.map(String) : []) : [],
        isPublished: true,
      };
    });

    const wRes = await prisma.weapon.createMany({
      data: weaponRecords,
      skipDuplicates: true,
    });
    console.log(`✓ Weapons inserted: ${wRes.count}`);
  }

  // 2. SONATA SETS
  const setsFile = path.join(process.cwd(), 'data_source', 'sonata-sets.json');
  const setsArFile = path.join(process.cwd(), 'data_source', 'sonata-sets-ar.json');
  let setsArData: any = {};
  if (fs.existsSync(setsArFile)) {
    setsArData = JSON.parse(fs.readFileSync(setsArFile, 'utf8'));
  }

  if (fs.existsSync(setsFile)) {
    const rawSets = JSON.parse(fs.readFileSync(setsFile, 'utf8'));
    const setsList = rawSets.sets || [];
    console.log(`Processing ${setsList.length} sonata sets...`);

    const setRecords = setsList.map((s: any) => {
      const slug = String(s.id);
      const twoPc = s.effects?.find((e: any) => e.label?.includes('2'))?.text || '';
      const fivePc = s.effects?.find((e: any) => e.label?.includes('5'))?.text || '';
      const arEffect = setsArData?.setEffects?.[slug];
      const twoPcAr = arEffect?.['2pc'] || '';
      const fivePcAr = arEffect?.['5pc'] || '';
      const nameAr = arEffect?.name || null;

      return {
        slug,
        name: s.name,
        nameAr,
        iconUrl: s.image,
        twoPieceEffect: twoPc,
        twoPieceEffectAr: twoPcAr,
        fivePieceEffect: fivePc,
        fivePieceEffectAr: fivePcAr,
        buffs: s.buffs || null,
        calculatorBuffs: s.calculatorBuffs || null,
      };
    });

    const sRes = await prisma.sonataSet.createMany({
      data: setRecords,
      skipDuplicates: true,
    });
    console.log(`✓ Sonata Sets inserted: ${sRes.count}`);

    // 3. ECHOES
    const echoesList = rawSets.echoes || [];
    console.log(`Processing ${echoesList.length} echoes...`);

    const echoRecords = echoesList.map((ec: any) => {
      const slug = String(ec.id);
      const arDesc = setsArData?.echoDescriptions?.[slug] || null;

      return {
        slug,
        name: ec.name,
        nameAr: arDesc?.name || null,
        echoClass: ec.class || 'Common',
        cost: Number(ec.cost) || 1,
        iconUrl: ec.image,
        cooldown: ec.cooldown ? Number(ec.cooldown) : null,
        description: ec.description || null,
        descriptionAr: arDesc?.desc || null,
        sonataSets: ec.sets ? (Array.isArray(ec.sets) ? ec.sets : [ec.sets]) : [],
        buffs: ec.buffs || null,
        isPublished: true,
      };
    });

    const ecRes = await prisma.echo.createMany({
      data: echoRecords,
      skipDuplicates: true,
    });
    console.log(`✓ Echoes inserted: ${ecRes.count}`);
  }

  // 4. ENEMIES
  const enemiesFile = path.join(process.cwd(), 'data_source', 'enemies.json');
  if (fs.existsSync(enemiesFile)) {
    const enemiesList = JSON.parse(fs.readFileSync(enemiesFile, 'utf8'));
    console.log(`Processing ${enemiesList.length} enemies...`);

    const enemyRecords = enemiesList.map((en: any) => {
      const slug = String(en.slug || en.id);
      return {
        slug,
        name: en.name,
        nameAr: en.nameAr,
        enemyClass: en.enemyClass || 'Common',
        elements: en.elements || [],
        hp: en.hp,
        atk: en.atk,
        def: en.def,
        description: en.description,
        descriptionAr: en.description,
        iconUrl: en.image,
        detailUrl: en.detailUrl,
        isPublished: true,
      };
    });

    const enRes = await prisma.enemy.createMany({
      data: enemyRecords,
      skipDuplicates: true,
    });
    console.log(`✓ Enemies inserted: ${enRes.count}`);
  }

  console.log('\n=== FAST IMPORT FINISHED ===');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
