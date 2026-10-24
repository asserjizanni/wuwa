import { PrismaClient, Element, WeaponType, Rarity, AdminRole, GuideStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper to map string elements to Enum
function mapElement(elem: string): Element {
  if (!elem) return Element.SPECTRO;
  const upper = elem.toUpperCase();
  if (upper.includes('AERO')) return Element.AERO;
  if (upper.includes('SPECTRO')) return Element.SPECTRO;
  if (upper.includes('FUSION')) return Element.FUSION;
  if (upper.includes('ELECTRO')) return Element.ELECTRO;
  if (upper.includes('GLACIO')) return Element.GLACIO;
  if (upper.includes('HAVOC')) return Element.HAVOC;
  return Element.SPECTRO;
}

// Helper to map string weaponType to Enum
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

// Helper to map rarity
function mapRarity(r: any): Rarity {
  if (r === 5 || r === '5' || r === 'FIVE_STAR') return Rarity.FIVE_STAR;
  if (r === 4 || r === '4' || r === 'FOUR_STAR') return Rarity.FOUR_STAR;
  if (r === 3 || r === '3' || r === 'THREE_STAR') return Rarity.THREE_STAR;
  if (r === 2 || r === '2' || r === 'TWO_STAR') return Rarity.TWO_STAR;
  if (r === 1 || r === '1' || r === 'ONE_STAR') return Rarity.ONE_STAR;
  return Rarity.FOUR_STAR;
}

async function migrate() {
  console.log('=== STARTING WUTHERING WAVES COMPLETE DATA MIGRATION ===\n');
  const report: Record<string, { total: number; imported: number; failed: number }> = {};

  // ─────────────────────────────────────────────────────────────
  // 1. ADMIN USERS
  // ─────────────────────────────────────────────────────────────
  console.log('1. Migrating Admin Users...');
  report.adminUsers = { total: 0, imported: 0, failed: 0 };
  const backupPath = path.join(process.cwd(), 'backups', 'database_full_backup_latest.json');
  let backupData: any = null;
  if (fs.existsSync(backupPath)) {
    backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  }

  if (backupData?.tables?.adminUsers?.length) {
    for (const admin of backupData.tables.adminUsers) {
      report.adminUsers.total++;
      try {
        await prisma.adminUser.upsert({
          where: { email: admin.email },
          update: {
            passwordHash: admin.passwordHash,
            name: admin.name,
            role: admin.role as AdminRole,
            isActive: admin.isActive ?? true,
          },
          create: {
            id: admin.id,
            email: admin.email,
            passwordHash: admin.passwordHash,
            name: admin.name,
            role: admin.role as AdminRole,
            isActive: admin.isActive ?? true,
          },
        });
        report.adminUsers.imported++;
      } catch (err: any) {
        console.error(`Failed admin ${admin.email}:`, err.message);
        report.adminUsers.failed++;
      }
    }
  }
  console.log(`✓ Admin Users imported: ${report.adminUsers.imported}/${report.adminUsers.total}`);

  // ─────────────────────────────────────────────────────────────
  // 2. CHARACTERS
  // ─────────────────────────────────────────────────────────────
  console.log('\n2. Migrating Characters (Existing + Arabic Metadata)...');
  report.characters = { total: 0, imported: 0, failed: 0 };

  // Load Arab Wuwa character metadata
  const awCharFile = path.join(process.cwd(), 'data_source', 'characters.json');
  let awCharacters: any[] = [];
  if (fs.existsSync(awCharFile)) {
    awCharacters = JSON.parse(fs.readFileSync(awCharFile, 'utf8'));
  }
  const awCharMap = new Map<string, any>();
  for (const c of awCharacters) {
    if (c.slug) awCharMap.set(c.slug.toLowerCase(), c);
    if (c.name) awCharMap.set(c.name.toLowerCase(), c);
  }

  // Load storage/data/characters.json (48 characters)
  const localCharFile = path.join(process.cwd(), 'storage', 'data', 'characters.json');
  let localCharacters: any[] = [];
  if (fs.existsSync(localCharFile)) {
    localCharacters = JSON.parse(fs.readFileSync(localCharFile, 'utf8'));
  }

  // Merge with backup characters
  const allCharacters = [...localCharacters];
  if (backupData?.tables?.characters) {
    for (const bc of backupData.tables.characters) {
      if (!allCharacters.some(c => c.slug === bc.slug || c.id === bc.id)) {
        allCharacters.push(bc);
      }
    }
  }

  for (const char of allCharacters) {
    report.characters.total++;
    try {
      const awMeta = awCharMap.get(char.slug.toLowerCase()) || awCharMap.get(char.name.toLowerCase());
      const arabicName = char.nameAr || awMeta?.arabicName || (char.name.match(/[\u0600-\u06FF]/) ? char.name : null);
      const englishName = char.name.match(/[\u0600-\u06FF]/) ? (awMeta?.name || char.slug.replace(/-/g, ' ')) : char.name;

      await prisma.character.upsert({
        where: { slug: char.slug },
        update: {
          name: englishName,
          nameAr: arabicName,
          element: mapElement(char.element || awMeta?.element),
          weaponType: mapWeaponType(char.weaponType || awMeta?.weapon),
          rarity: mapRarity(char.rarity || awMeta?.stars),
          portraitPath: char.portraitPath || awMeta?.image,
          backgroundPath: char.backgroundPath,
          description: char.description || awMeta?.quote,
          descriptionAr: awMeta?.arabicQuote || char.descriptionAr,
          role: char.role || awMeta?.role || 'DPS',
          tags: char.tags || [],
          isPublished: char.isPublished ?? true,
          isFeatured: char.isFeatured ?? false,
          sortOrder: char.sortOrder ?? 0,
        },
        create: {
          id: char.id,
          name: englishName,
          nameAr: arabicName,
          slug: char.slug,
          element: mapElement(char.element || awMeta?.element),
          weaponType: mapWeaponType(char.weaponType || awMeta?.weapon),
          rarity: mapRarity(char.rarity || awMeta?.stars),
          portraitPath: char.portraitPath || awMeta?.image,
          backgroundPath: char.backgroundPath,
          description: char.description || awMeta?.quote,
          descriptionAr: awMeta?.arabicQuote || char.descriptionAr,
          role: char.role || awMeta?.role || 'DPS',
          tags: char.tags || [],
          isPublished: char.isPublished ?? true,
          isFeatured: char.isFeatured ?? false,
          sortOrder: char.sortOrder ?? 0,
        },
      });
      report.characters.imported++;
    } catch (err: any) {
      console.error(`Failed character ${char.slug}:`, err.message);
      report.characters.failed++;
    }
  }
  console.log(`✓ Characters imported: ${report.characters.imported}/${report.characters.total}`);

  // ─────────────────────────────────────────────────────────────
  // 3. BUILD GUIDES & GUIDE PAGES (Preserving Existing System)
  // ─────────────────────────────────────────────────────────────
  console.log('\n3. Migrating Build Guides and Pages...');
  report.buildGuides = { total: 0, imported: 0, failed: 0 };
  report.guidePages = { total: 0, imported: 0, failed: 0 };

  if (backupData?.tables?.buildGuides?.length) {
    for (const guide of backupData.tables.buildGuides) {
      report.buildGuides.total++;
      try {
        await prisma.buildGuide.upsert({
          where: { id: guide.id },
          update: {
            title: guide.title,
            version: guide.version,
            pageCount: guide.pageCount,
            status: guide.status as GuideStatus,
            isActive: guide.isActive,
            notes: guide.notes,
            publishedAt: guide.publishedAt ? new Date(guide.publishedAt) : null,
          },
          create: {
            id: guide.id,
            characterId: guide.characterId,
            title: guide.title,
            version: guide.version,
            pageCount: guide.pageCount,
            status: guide.status as GuideStatus,
            isActive: guide.isActive,
            notes: guide.notes,
            publishedAt: guide.publishedAt ? new Date(guide.publishedAt) : null,
          },
        });
        report.buildGuides.imported++;
      } catch (err: any) {
        console.error(`Failed guide ${guide.id}:`, err.message);
        report.buildGuides.failed++;
      }
    }
  }
  console.log(`✓ Build Guides imported: ${report.buildGuides.imported}/${report.buildGuides.total}`);

  if (backupData?.tables?.guidePages?.length) {
    for (const page of backupData.tables.guidePages) {
      report.guidePages.total++;
      try {
        await prisma.guidePage.upsert({
          where: {
            guideId_pageNumber: {
              guideId: page.guideId,
              pageNumber: page.pageNumber,
            },
          },
          update: {
            imagePath: page.imagePath,
            thumbnailPath: page.thumbnailPath,
            width: page.width,
            height: page.height,
            fileSize: page.fileSize,
          },
          create: {
            id: page.id,
            guideId: page.guideId,
            pageNumber: page.pageNumber,
            imagePath: page.imagePath,
            thumbnailPath: page.thumbnailPath,
            width: page.width,
            height: page.height,
            fileSize: page.fileSize,
          },
        });
        report.guidePages.imported++;
      } catch (err: any) {
        report.guidePages.failed++;
      }
    }
  }
  console.log(`✓ Guide Pages imported: ${report.guidePages.imported}/${report.guidePages.total}`);

  // ─────────────────────────────────────────────────────────────
  // 4. WEAPONS
  // ─────────────────────────────────────────────────────────────
  console.log('\n4. Migrating Weapons...');
  report.weapons = { total: 0, imported: 0, failed: 0 };
  const weaponsFile = path.join(process.cwd(), 'data_source', 'weapons.json');
  if (fs.existsSync(weaponsFile)) {
    const rawWeapons = JSON.parse(fs.readFileSync(weaponsFile, 'utf8'));
    const weaponsList = Array.isArray(rawWeapons) ? rawWeapons : Object.values(rawWeapons);

    for (const w of weaponsList as any[]) {
      report.weapons.total++;
      try {
        const slug = String(w.id || w.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        await prisma.weapon.upsert({
          where: { slug },
          update: {
            name: w.name,
            nameAr: w.nameAr || null,
            weaponType: mapWeaponType(w.type),
            rarity: mapRarity(w.rarity || w.stars),
            stars: Number(w.rarity || w.stars) || 4,
            iconUrl: w.image,
            imageBig: w.imagebig,
            desc: w.desc,
            descAr: w.descAr || null,
            buffs: w.buffs || null,
            passiveBuffs: w.passiveBuffs || null,
            stats: w.stats || null,
            signatureCharacter: w.signatureCharacter || null,
            signatureCharacterId: w.signatureCharacterId ? String(w.signatureCharacterId) : null,
            compatibleCharacters: w.characters ? (Array.isArray(w.characters) ? w.characters.map(String) : []) : [],
            isPublished: true,
          },
          create: {
            slug,
            name: w.name,
            nameAr: w.nameAr || null,
            weaponType: mapWeaponType(w.type),
            rarity: mapRarity(w.rarity || w.stars),
            stars: Number(w.rarity || w.stars) || 4,
            iconUrl: w.image,
            imageBig: w.imagebig,
            desc: w.desc,
            descAr: w.descAr || null,
            buffs: w.buffs || null,
            passiveBuffs: w.passiveBuffs || null,
            stats: w.stats || null,
            signatureCharacter: w.signatureCharacter || null,
            signatureCharacterId: w.signatureCharacterId ? String(w.signatureCharacterId) : null,
            compatibleCharacters: w.characters ? (Array.isArray(w.characters) ? w.characters.map(String) : []) : [],
            isPublished: true,
          },
        });
        report.weapons.imported++;
      } catch (err: any) {
        console.error(`Failed weapon ${w.name}:`, err.message);
        report.weapons.failed++;
      }
    }
  }
  console.log(`✓ Weapons imported: ${report.weapons.imported}/${report.weapons.total}`);

  // ─────────────────────────────────────────────────────────────
  // 5. SONATA SETS
  // ─────────────────────────────────────────────────────────────
  console.log('\n5. Migrating Sonata Sets...');
  report.sonataSets = { total: 0, imported: 0, failed: 0 };
  const setsFile = path.join(process.cwd(), 'data_source', 'sonata-sets.json');
  const setsArFile = path.join(process.cwd(), 'data_source', 'sonata-sets-ar.json');
  let setsArData: any = {};
  if (fs.existsSync(setsArFile)) {
    setsArData = JSON.parse(fs.readFileSync(setsArFile, 'utf8'));
  }

  if (fs.existsSync(setsFile)) {
    const rawSets = JSON.parse(fs.readFileSync(setsFile, 'utf8'));
    const setsList = rawSets.sets || [];

    for (const s of setsList) {
      report.sonataSets.total++;
      try {
        const slug = String(s.id);
        const twoPc = s.effects?.find((e: any) => e.label?.includes('2'))?.text || '';
        const fivePc = s.effects?.find((e: any) => e.label?.includes('5'))?.text || '';
        const arEffect = setsArData?.setEffects?.[slug];
        const twoPcAr = arEffect?.['2pc'] || '';
        const fivePcAr = arEffect?.['5pc'] || '';
        const nameAr = arEffect?.name || null;

        await prisma.sonataSet.upsert({
          where: { slug },
          update: {
            name: s.name,
            nameAr,
            iconUrl: s.image,
            twoPieceEffect: twoPc,
            twoPieceEffectAr: twoPcAr,
            fivePieceEffect: fivePc,
            fivePieceEffectAr: fivePcAr,
            buffs: s.buffs || null,
            calculatorBuffs: s.calculatorBuffs || null,
          },
          create: {
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
          },
        });
        report.sonataSets.imported++;
      } catch (err: any) {
        console.error(`Failed sonata set ${s.id}:`, err.message);
        report.sonataSets.failed++;
      }
    }
  }
  console.log(`✓ Sonata Sets imported: ${report.sonataSets.imported}/${report.sonataSets.total}`);

  // ─────────────────────────────────────────────────────────────
  // 6. ECHOES
  // ─────────────────────────────────────────────────────────────
  console.log('\n6. Migrating Echoes...');
  report.echoes = { total: 0, imported: 0, failed: 0 };
  if (fs.existsSync(setsFile)) {
    const rawSets = JSON.parse(fs.readFileSync(setsFile, 'utf8'));
    const echoesList = rawSets.echoes || [];

    for (const ec of echoesList) {
      report.echoes.total++;
      try {
        const slug = String(ec.id);
        const arDesc = setsArData?.echoDescriptions?.[slug] || null;

        await prisma.echo.upsert({
          where: { slug },
          update: {
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
          },
          create: {
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
          },
        });
        report.echoes.imported++;
      } catch (err: any) {
        console.error(`Failed echo ${ec.name}:`, err.message);
        report.echoes.failed++;
      }
    }
  }
  console.log(`✓ Echoes imported: ${report.echoes.imported}/${report.echoes.total}`);

  // ─────────────────────────────────────────────────────────────
  // 7. ENEMIES & BOSSES
  // ─────────────────────────────────────────────────────────────
  console.log('\n7. Migrating Enemies & Bosses...');
  report.enemies = { total: 0, imported: 0, failed: 0 };
  const enemiesFile = path.join(process.cwd(), 'data_source', 'enemies.json');
  if (fs.existsSync(enemiesFile)) {
    const enemiesList = JSON.parse(fs.readFileSync(enemiesFile, 'utf8'));

    for (const en of enemiesList) {
      report.enemies.total++;
      try {
        const slug = String(en.slug || en.id);
        await prisma.enemy.upsert({
          where: { slug },
          update: {
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
          },
          create: {
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
          },
        });
        report.enemies.imported++;
      } catch (err: any) {
        console.error(`Failed enemy ${en.name}:`, err.message);
        report.enemies.failed++;
      }
    }
  }
  console.log(`✓ Enemies imported: ${report.enemies.imported}/${report.enemies.total}`);

  // ─────────────────────────────────────────────────────────────
  // 8. TIER LIST INITIAL SEED
  // ─────────────────────────────────────────────────────────────
  console.log('\n8. Seeding Initial Tier List & Team Comps...');
  await prisma.tierList.upsert({
    where: { slug: 'v1-4-overall' },
    update: {},
    create: {
      slug: 'v1-4-overall',
      title: 'Version 1.4 Character Tier List',
      titleAr: 'قائمة أفضل الشخصيات للإصدار 1.4',
      gameVersion: '1.4',
      category: 'overall',
      description: 'تصنيف عام للشخصيات بناءً على الأداء في برج الخطر وتحديات اللعبة المختلفة.',
      tiers: [
        {
          tier: 'T0',
          titleAr: 'القمة المطلقة',
          characters: ['jinhsi', 'changli', 'the-shorekeeper', 'verina'],
          description: 'الشخصيات الأقوى في اللعبة بلا منازع مع أداء استثنائي في كل المواقف.'
        },
        {
          tier: 'T0.5',
          titleAr: 'أداء ممتاز جداً',
          characters: ['jiyan', 'yinlin', 'xiangli-yao', 'camellya'],
          description: 'شخصيات أساسية تقدم ضرراً هائلاً وتنسيقاً رائعاً مع الفرق.'
        },
        {
          tier: 'T1',
          titleAr: 'قوي وموثوق',
          characters: ['rover-havoc', 'sanhua', 'mortefi', 'calcharo'],
          description: 'شخصيات قوية جداً وتعتبر أعمدة رئيسية في تكوين الفرق.'
        },
        {
          tier: 'T2',
          titleAr: 'جيد مع بناء مناسب',
          characters: ['danjin', 'chixia', 'yangyang', 'baizhi', 'jianxin'],
          description: 'شخصيات جيدة جداً عند الاستثمار الصحيح وتوفر تنوعاً تكتيكياً.'
        }
      ],
      isPublished: true,
    }
  });

  // Seed initial popular team comps
  await prisma.teamComp.upsert({
    where: { slug: 'jinhsi-burst-team' },
    update: {},
    create: {
      slug: 'jinhsi-burst-team',
      title: 'Jinhsi Supreme Dragon Burst',
      titleAr: 'فريق تنين جينهسي المتفجر',
      description: 'فريق فائق الفعالية يعتمد على شحن مهارة التنين لجينهسي وإطلاق أقصى ضرر سبيكسترو.',
      descriptionAr: 'فريق فائق الفعالية يعتمد على شحن مهارة التنين لجينهسي وإطلاق أقصى ضرر سبيكسترو.',
      members: [
        { characterSlug: 'jinhsi', role: 'Main DPS', weapon: 'Ages of Harvest', echoSet: 'Celestial Light' },
        { characterSlug: 'yinlin', role: 'Sub DPS / Buffer', weapon: 'Stringmaster', echoSet: 'Moonlit Clouds' },
        { characterSlug: 'verina', role: 'Healer / Buffer', weapon: 'Variation', echoSet: 'Rejuvenating Glow' }
      ],
      rotationGuideAr: 'ابدأ بفيرينا لتطبيق باف الشفاء، ثم انتقل إلى ينلين لشحن المهارة وإطلاق التحرير، ثم ادخل بجينهسي لتنفيذ الكومبو الأسطوري.',
      isFeatured: true,
      isPublished: true,
    }
  });

  // Save migration report
  const reportPath = path.join(process.cwd(), 'backups', 'migration_summary_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');
  console.log('Report saved to:', reportPath);
  console.table(report);
}

migrate()
  .catch(e => {
    console.error('Fatal migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
