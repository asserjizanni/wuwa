import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding Tier Lists and Team Compositions...');

  // 1. Overall Tier List
  await prisma.tierList.upsert({
    where: { slug: 'v1-4-overall' },
    update: {},
    create: {
      slug: 'v1-4-overall',
      title: 'Wuthering Waves 1.4 Character Tier List',
      titleAr: 'قائمة تصنيف شخصيات ووذيرينغ ويفز 1.4',
      gameVersion: '1.4',
      category: 'overall',
      description: 'تصنيف شامل لجميع الشخصيات بناءً على قوة المهارات، الضرر التراكمي، والأداء العام في مختلف فعاليات اللعبة.',
      tiers: [
        {
          tier: 'T0',
          titleAr: 'القمة المطلقة (S+ Tier)',
          characters: ['jinhsi', 'changli', 'the-shorekeeper', 'verina'],
          description: 'الشخصيات الأقوى في اللعبة مع أداء استثنائي وتأثير حاسم في المعارك.'
        },
        {
          tier: 'T0.5',
          titleAr: 'شبه مثالي (S Tier)',
          characters: ['jiyan', 'yinlin', 'xiangli-yao', 'camellya'],
          description: 'شخصيات محورية ذات ضرر هائل وتكامل رائع مع التشكيلات المختلفة.'
        },
        {
          tier: 'T1',
          titleAr: 'قوي وموثوق (A Tier)',
          characters: ['rover-havoc', 'sanhua', 'mortefi', 'calcharo', 'encore'],
          description: 'شخصيات ممتازة تشكل أساساً متيناً لأي فريق ومناسبة لأصعب التحديات.'
        },
        {
          tier: 'T2',
          titleAr: 'جيد مع استثمار مناسب (B Tier)',
          characters: ['danjin', 'chixia', 'yangyang', 'baizhi', 'jianxin', 'yuanwu', 'taoqi'],
          description: 'شخصيات توفر فائدة وتنوعاً تكتيكياً فعالاً عند بنائها بشكل صحيح.'
        }
      ],
      isPublished: true,
    }
  });

  // 2. Tower of Adversity Tier List
  await prisma.tierList.upsert({
    where: { slug: 'v1-4-tower-of-adversity' },
    update: {},
    create: {
      slug: 'v1-4-tower-of-adversity',
      title: 'Tower of Adversity Tier List',
      titleAr: 'تصنيف برج الشدائد (Tower of Adversity)',
      gameVersion: '1.4',
      category: 'tower',
      description: 'تصنيف متخصص لمواجهات برج الشدائد وأعلى طوابق التحدي التنافسي.',
      tiers: [
        {
          tier: 'T0',
          titleAr: 'الأسرع إنهاءً للطوابق',
          characters: ['jinhsi', 'the-shorekeeper', 'changli'],
          description: 'تنهي غرف الأعداء والزعماء في أسرع وقت زمني وبأعلى نقاط ممكنة.'
        },
        {
          tier: 'T0.5',
          titleAr: 'مستقرة وعالية الكفاءة',
          characters: ['jiyan', 'verina', 'yinlin', 'camellya'],
          description: 'كفاءة طاقة عالية وسرعة فائقة في مواجهة موجات الأعداء المتعددة.'
        },
        {
          tier: 'T1',
          titleAr: 'خيارات بديلة ممتازة',
          characters: ['xiangli-yao', 'rover-havoc', 'sanhua', 'encore'],
          description: 'تساعد في تغطية الطوابق الجانبية وتوزيع استهلاك الطاقة بذكاء.'
        }
      ],
      isPublished: true,
    }
  });

  // 3. Featured Team Compositions
  const teams = [
    {
      slug: 'jinhsi-dragon-burst',
      title: 'Jinhsi Supreme Burst',
      titleAr: 'فريق تنين جينهسي الخارق',
      description: 'فريق انفجار الضرر بالاعتماد على سبيكسترو وتوليد الشحنات السريع لجينهسي.',
      descriptionAr: 'فريق انفجار الضرر بالاعتماد على سبيكسترو وتوليد الشحنات السريع لجينهسي.',
      members: [
        { characterSlug: 'jinhsi', role: 'Main DPS', roleAr: 'مهاجم رئيسي', weapon: 'Ages of Harvest', echoSet: 'Celestial Light' },
        { characterSlug: 'yinlin', role: 'Sub DPS / Coordinated', roleAr: 'مهاجم داعم', weapon: 'Stringmaster', echoSet: 'Moonlit Clouds' },
        { characterSlug: 'verina', role: 'Buffer / Healer', roleAr: 'معالج وداعم', weapon: 'Variation', echoSet: 'Rejuvenating Glow' }
      ],
      rotationGuideAr: '1. ابدأ بفيرينا لتفعيل تأثير مجموعة الشفاء وتقديم الباف.\n2. تحوّل إلى ينلين لشحن المهارة وإطلاق التحرير وتفعيل باف الدخول.\n3. ادخل بجينهسي وفجّر مهارة التنين القصوى لإلحاق ضرر كاسح.',
      isFeatured: true,
      isPublished: true,
    },
    {
      slug: 'changli-fusion-quickswap',
      title: 'Changli Fusion Swift Strike',
      titleAr: 'فريق تشانغلي فيوجن فائق السرعة',
      description: 'فريق التبديل السريع القائم على ضرر الفيوجن المتتالي والكومبوهات السريعة.',
      descriptionAr: 'فريق التبديل السريع القائم على ضرر الفيوجن المتتالي والكومبوهات السريعة.',
      members: [
        { characterSlug: 'changli', role: 'Main DPS', roleAr: 'مهاجم رئيسي', weapon: 'Blazing Brilliance', echoSet: 'Molten Rift' },
        { characterSlug: 'encore', role: 'Sub DPS', roleAr: 'مهاجم داعم', weapon: 'Cosmic Ripples', echoSet: 'Molten Rift' },
        { characterSlug: 'the-shorekeeper', role: 'Support / Crit Buffer', roleAr: 'داعم كريت ومعالج', weapon: 'Stellar Symphony', echoSet: 'Rejuvenating Glow' }
      ],
      rotationGuideAr: 'تبادل الأدوار السريع بين تشانغلي وإنكور للاستفادة القصوى من بافات الفيوجن المشتركة مع دعم مستمر من الشوركيبر.',
      isFeatured: true,
      isPublished: true,
    },
    {
      slug: 'jiyan-aero-hypercarry',
      title: 'Jiyan Aero Hypercarry',
      titleAr: 'فريق جييان هايبركاري إيرو',
      description: 'فريق تدمير الحشود والزعماء بالاعتماد على تنين جييان الجارف.',
      descriptionAr: 'فريق تدمير الحشود والزعماء بالاعتماد على تنين جييان الجارف.',
      members: [
        { characterSlug: 'jiyan', role: 'Main DPS', roleAr: 'مهاجم رئيسي', weapon: 'Verdant Summit', echoSet: 'Sierra Gale' },
        { characterSlug: 'mortefi', role: 'Sub DPS / Heavy Buffer', roleAr: 'مهاجم داعم للضربات الثقيلة', weapon: 'Static Mist', echoSet: 'Moonlit Clouds' },
        { characterSlug: 'verina', role: 'Healer / Buffer', roleAr: 'معالج وداعم', weapon: 'Variation', echoSet: 'Rejuvenating Glow' }
      ],
      rotationGuideAr: 'مورتيفي يمنح باف هائل لهجمات جييان الثقيلة مع تجميع الأعداء وسحقهم خلال مدة تحرير التنين.',
      isFeatured: true,
      isPublished: true,
    }
  ];

  for (const t of teams) {
    await prisma.teamComp.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }

  // 4. Sample Announcement
  await prisma.announcement.upsert({
    where: { id: 'announcement-launch-1' },
    update: {},
    create: {
      id: 'announcement-launch-1',
      title: 'Welcome to WuWa Arab Platform!',
      titleAr: 'مرحباً بكم في منصة ووذا بيلدينغ العربية الشاملة!',
      content: 'We are thrilled to launch the comprehensive Arabic Wuthering Waves database, featuring full guides, character stats, weapons, echoes, enemies, and interactive tools.',
      contentAr: 'يسعدنا إطلاق المنصة العربية الشاملة للعبة Wuthering Waves، والتي تضم قاعدة بيانات تفاعلية كاملة للشخصيات، الأسلحة، الإيكو، الأعداء، أدوات بناء الفرق، ودلائل البناء المعتمدة.',
      category: 'announcement',
      isPinned: true,
      isPublished: true,
    }
  });

  console.log('✓ Tier Lists and Team Comps seeded successfully!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
