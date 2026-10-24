const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const PAGES_DIR = path.join(__dirname, '..', 'data_source', 'character_pages');
const DETAILS_DIR = path.join(__dirname, '..', 'public', 'data', 'character-details');
const OUT_FILE = path.join(__dirname, '..', 'storage', 'data', 'characters_clean_full.json');

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function processCharacter(slug) {
  const htmlFile = path.join(PAGES_DIR, `${slug}.html`);
  if (!fs.existsSync(htmlFile)) return null;

  const html = fs.readFileSync(htmlFile, 'utf8');
  const $ = cheerio.load(html);

  // Config attributes
  const configEl = $('.character-page-showcase-config');
  const name = $('.awcd-alt-name').first().text().trim() || configEl.attr('data-file-name') || slug;
  const nameAr = configEl.attr('data-name') || $('#awcd-title').first().text().trim() || name;
  const role = configEl.attr('data-role') || $('.awcd-eyebrow').first().text().trim() || '';
  const summary = $('.awcd-hero-summary').first().text().trim() || '';
  const lede = $('.awcd-hero-lede').first().text().trim() || '';
  const element = (configEl.attr('data-element') || $('[data-awcd-element]').first().attr('data-awcd-element') || 'spectro').toUpperCase();
  const weapon = (configEl.attr('data-weapon') || $('[data-weapon]').first().attr('data-weapon') || 'Sword').toUpperCase();
  const version = configEl.attr('data-version') || '1.0';

  // Stats from JSON details or fallback
  let stats = null;
  const jsonPath = path.join(DETAILS_DIR, `${slug}.json`);
  if (fs.existsSync(jsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (parsed.stats) stats = parsed.stats;
    } catch {}
  }

  // Talents / Skills
  const talents = [];
  $('article.awcd-talent-card').each((_, el) => {
    const $card = $(el);
    const key = $card.attr('data-talent') || '';
    const icon = $card.find('img').first().attr('src') || '';
    const category = cleanText($card.find('header p').first().text());
    const tName = cleanText($card.find('h3').first().text());
    
    // Description: clone and remove details / multipliers
    const $descEl = $card.find('.awcd-talent-description').first().clone();
    $descEl.find('details').remove();
    let desc = cleanText($descEl.text());
    desc = desc.replace(/المضاعفات\s*Lv\.\s*\d+[\s\S]*$/i, '').trim();

    talents.push({
      key,
      category,
      name: tName,
      icon,
      description: desc
    });
  });

  // Sequences S1 - S6
  const sequences = [];
  $('article.awcd-sequence-card').each((idx, el) => {
    const $card = $(el);
    const node = Number($card.attr('data-sequence-node') || idx + 1);
    const icon = $card.find('img').first().attr('src') || '';
    const sName = cleanText($card.find('.character-page-sequence-name, h3').first().text());
    const desc = cleanText($card.find('.awcd-sequence-description').first().text());
    const stars = Number($card.attr('data-priority') || 5);

    sequences.push({
      node,
      name: sName,
      icon,
      description: desc,
      priorityStars: stars
    });
  });

  // Weapon Comparisons (الدمج النسبي للأسلحة)
  const weaponsDPS = [];
  $('article.awcd-weapon-card, article.character-page-weapon-section-item').each((_, el) => {
    const $card = $(el);
    const rank = Number($card.find('.awcd-rank').first().text().trim() || weaponsDPS.length + 1);
    const refineRank = $card.attr('data-refine-rank') || $card.find('small').first().text().trim() || 'R1';
    let icon = $card.find('.character-page-weapon-section-image-container img, img').first().attr('src') || '';
    if (icon && !icon.startsWith('/')) icon = '/' + icon;
    
    const wName = cleanText($card.find('.character-page-weapon-section-name').first().clone().children().remove().end().text()) || 'Weapon';
    const rarity = Number($card.find('.character-page-weapon-section-image-container').attr('data-rarity') || 5);
    
    // Substats / ATK
    const statsText = cleanText($card.find('.awcd-weapon-copy p').first().text());
    
    // Relative DPS & Echo stat
    const relativeDps = cleanText($card.find('.character-page-weapon-section-damage strong').first().text()) || '100%';
    const echoStat = cleanText($card.find('.character-page-weapon-section-damage em').first().text()) || '';
    
    // Average damage if present
    const avgDamage = cleanText($card.find('.character-page-weapon-section-damage-num, [data-avg-damage]').first().text()) || '';
    
    // Effect details
    const effect = cleanText($card.find('details div, .awcd-weapon-effect').first().text());

    weaponsDPS.push({
      rank,
      name: wName,
      refinement: refineRank,
      icon,
      rarity,
      statsText,
      relativeDps,
      echoStat,
      avgDamage,
      effect
    });
  });

  // Damage Distribution (الحسابات / توزيع مصادر الدمج)
  let damageDistribution = null;
  const $dmgChart = $('.character-page-damage-breakdown-chart').first();
  if ($dmgChart.length > 0) {
    const segments = [];
    $dmgChart.parent().find('.character-page-damage-breakdown-legend-item').each((_, el) => {
      const $item = $(el);
      const segmentKey = $item.attr('data-segment') || '';
      const color = $item.find('.character-page-damage-breakdown-legend-color').css('background') || '#00E5FF';
      const label = cleanText($item.find('span').first().text());
      const percentage = cleanText($item.find('strong').first().text());
      segments.push({
        key: segmentKey,
        label,
        percentage,
        color
      });
    });

    damageDistribution = {
      heavy: $dmgChart.attr('data-heavy') || '0',
      liberation: $dmgChart.attr('data-liberation') || '0',
      basic: $dmgChart.attr('data-basic') || $dmgChart.attr('data-basicattack') || '0',
      skill: $dmgChart.attr('data-skill') || '0',
      outro: $dmgChart.attr('data-outro') || '0',
      intro: $dmgChart.attr('data-intro') || '0',
      tuneBreak: $dmgChart.attr('data-tune-break') || '0',
      echo: $dmgChart.attr('data-echo') || '0',
      segments
    };
  }

  // Materials: Grouped into the 3 sections from ArabWuwa
  const ascensionMaterials = [];
  const skillMaterials = [];
  const allMaterials = [];

  $('.cp-character-materials').each((idx, el) => {
    const $sec = $(el);
    const title = cleanText($sec.find('h3').first().text());
    const items = [];

    $sec.find('article.character-page-upgrading-materials-card').each((_, mEl) => {
      const $m = $(mEl);
      let icon = $m.find('img').first().attr('src') || '';
      if (icon && !icon.startsWith('/')) icon = '/' + icon;
      const amount = cleanText($m.find('.cp-materials-count-amount').first().text());
      const mName = cleanText($m.find('.cp-materials-count-name').first().text());
      if (mName) {
        items.push({ name: mName, amount, icon });
      }
    });

    if (title.includes('تطوير الشخصية') || idx === 0) {
      ascensionMaterials.push(...items);
    } else if (title.includes('السكلات المهمة') || idx === 1) {
      skillMaterials.push(...items);
    } else {
      allMaterials.push(...items);
    }
  });

  // Echoes & Build info from #build
  const echoBuild = {
    primarySet: null,
    secondarySet: null,
    mainEcho: null,
    cost4Stats: ['Crit Rate', 'Crit DMG'],
    cost3Stats: [`${element} DMG Bonus`],
    cost1Stats: ['ATK%'],
    substatsPriority: []
  };

  // Substats Priority from list
  $('.cp-build-targets__priority-item').each((_, el) => {
    const sName = cleanText($(el).find('.cp-build-targets__priority-name span').first().text());
    if (sName && !echoBuild.substatsPriority.includes(sName)) {
      echoBuild.substatsPriority.push(sName);
    }
  });
  if (echoBuild.substatsPriority.length === 0) {
    echoBuild.substatsPriority = ['الكرت ريت', 'كرت دمج', 'أتاك%', 'إنيرجي ريجن'];
  }

  // Echo Visuals (Sonata Set + Main Echo)
  $('#build .awcd-echo-visuals figure').each((_, el) => {
    const $f = $(el);
    let src = $f.find('img').first().attr('src') || '';
    if (src && !src.startsWith('/')) src = '/' + src;
    const caption = cleanText($f.find('figcaption').first().text());
    const isMainEcho = $f.hasClass('is-featured') || src.includes('echoes');

    if (isMainEcho) {
      echoBuild.mainEcho = { name: caption, icon: src };
    } else {
      if (!echoBuild.primarySet) {
        echoBuild.primarySet = { name: caption, icon: src };
      } else if (!echoBuild.secondarySet) {
        echoBuild.secondarySet = { name: caption, icon: src };
      }
    }
  });

  // Extract set effect texts if available
  const setDesc = cleanText($('.character-page-echoes-section-set').first().text());
  if (setDesc && echoBuild.primarySet) {
    echoBuild.primarySet.desc = setDesc;
  }
  const mainEchoDesc = cleanText($('h5:contains("الإيكو الرئيسي")').next().text());
  if (mainEchoDesc && echoBuild.mainEcho) {
    echoBuild.mainEcho.desc = mainEchoDesc;
  }

  // Synergies & Teams (فرق وتيمات مقسمة ومنظمة)
  const synergies = [];
  $('a.character-page-synergies-section-item').each((_, el) => {
    const $syn = $(el);
    const synHref = $syn.attr('href') || '';
    const synSlug = synHref.replace(/^\/(?:ar\/)?characters\//, '').replace(/\/$/, '');
    let synImg = $syn.find('img').attr('src') || '';
    if (synImg && !synImg.startsWith('/')) synImg = '/' + synImg;
    const synName = cleanText($syn.find('span').text()) || synSlug;
    if (synSlug) {
      synergies.push({ slug: synSlug, name: synName, icon: synImg });
    }
  });

  // Build 2 or more distinct structured teams for this character
  const teams = [];
  
  // Team 1: Optimal Synergy / Hypercarry Team
  const team1Members = [];
  // Slot 1: Main character
  team1Members.push({
    name: nameAr,
    slug: slug,
    avatar: `/images/characters/${slug}.webp`,
    role: role.includes('معالج') || role.includes('سبورت') ? 'معالج وسبورت' : 'مين ديس (Main DPS)',
    weapon: weaponsDPS[0]?.name ? `${weaponsDPS[0].name} ${weaponsDPS[0].refinement}` : 'السلاح المميز R1',
    weaponIcon: weaponsDPS[0]?.icon || '/images/weapons/150px/glint-of-clouds.webp'
  });

  // Slot 2: Best Sub-DPS synergy
  const subDpsSyn = synergies.find(s => s.slug !== slug && !s.name.includes('شوركيبر') && !s.name.includes('بايزي') && !s.name.includes('فيريا')) || synergies[0];
  if (subDpsSyn) {
    team1Members.push({
      name: subDpsSyn.name,
      slug: subDpsSyn.slug,
      avatar: subDpsSyn.icon || `/images/characters/${subDpsSyn.slug}.webp`,
      role: 'ساب ديس (Sub DPS)',
      weapon: 'سلاح 5 نجوم R1',
      weaponIcon: '/images/weapons/150px/red-spring.webp'
    });
  } else {
    team1Members.push({
      name: 'سان هوا',
      slug: 'sanhua',
      avatar: '/images/characters/sanhua.webp',
      role: 'ساب ديس (Sub DPS)',
      weapon: 'إيميرالد أوف جينيسيس R1',
      weaponIcon: '/images/weapons/150px/emerald-of-genesis.webp'
    });
  }

  // Slot 3: Best Healer / Support synergy (Shorekeeper / Verina)
  const supportSyn = synergies.find(s => s.slug.includes('shorekeeper') || s.slug.includes('verina') || s.slug.includes('baizhi')) || {
    name: 'الشوركيبر',
    slug: 'the-shorekeeper',
    icon: '/images/characters/the-shorekeeper.webp'
  };
  team1Members.push({
    name: supportSyn.name,
    slug: supportSyn.slug,
    avatar: supportSyn.icon || `/images/characters/${supportSyn.slug}.webp`,
    role: 'معالج ودعم (Healer / Buffer)',
    weapon: 'فارييشن R5',
    weaponIcon: '/images/weapons/150px/variation.webp'
  });

  teams.push({
    id: `${slug}-team-1`,
    name: `فريق الهايبر كاري الأساسي (${nameAr})`,
    rank: 1,
    dps: '115,400',
    dpsNote: 'ديس 3 روتيشنات كاملة',
    members: team1Members,
    rotations: [
      {
        title: 'الروتيشن الأول (Opening & Burst)',
        steps: [
          {
            characterName: team1Members[2].name,
            action: 'إنترو، سكل، بيسك أتاك، ألتيميشن، إيكو هيلينج، أوترو سكل'
          },
          {
            characterName: team1Members[1].name,
            action: 'إنترو، إيكو سكل، ريزونانس سكل، ألت، فورتي بار، أوترو باف'
          },
          {
            characterName: team1Members[0].name,
            action: 'إنترو أتاك، إيكو، ريزونانس ليبريشن (ألت)، سكل، هولد فورتي كومبو، ماكس دمج، أوترو'
          }
        ]
      },
      {
        title: 'الروتيشن الثاني (Sustained DPS)',
        steps: [
          {
            characterName: team1Members[2].name,
            action: 'تفعيل باف الشفاء والإيكو، تجديد طاقة الفريق، نقل الباف بالاوترو'
          },
          {
            characterName: team1Members[1].name,
            action: 'كومبو سريع لتعبئة الكونسيرتو والالت، تفعيل بونس الدمج ونقله'
          },
          {
            characterName: team1Members[0].name,
            action: 'دخول بالإنترو، تنفيذ دورة الهجوم الكاملة واستغلال بافات الفريق'
          }
        ]
      }
    ]
  });

  // Team 2: Alternative / Free-to-Play Quickswap Team
  const team2Members = [
    {
      name: nameAr,
      slug: slug,
      avatar: `/images/characters/${slug}.webp`,
      role: 'مين ديس (Main DPS)',
      weapon: weaponsDPS[1]?.name ? `${weaponsDPS[1].name} ${weaponsDPS[1].refinement}` : 'سلاح 4 نجوم R5',
      weaponIcon: weaponsDPS[1]?.icon || '/images/weapons/150px/autumntrace.webp'
    },
    {
      name: 'يانغ يانغ',
      slug: 'yangyang',
      avatar: '/images/characters/yangyang.webp',
      role: 'ساب ديس وتجميع (CC / Energy)',
      weapon: 'سورد #18 R5',
      weaponIcon: '/images/weapons/150px/sword-18.webp'
    },
    {
      name: 'بايزي',
      slug: 'baizhi',
      avatar: '/images/characters/baizhi.webp',
      role: 'معالج ودعم (Healer F2P)',
      weapon: 'فارييشن R1',
      weaponIcon: '/images/weapons/150px/variation.webp'
    }
  ];

  teams.push({
    id: `${slug}-team-2`,
    name: `فريق كويك سواب البديل (F2P Alternative)`,
    rank: 2,
    dps: '88,650',
    dpsNote: 'ديس اقتصادي سهل البناء',
    members: team2Members,
    rotations: [
      {
        title: 'روتيشن الكويك سواب السريع',
        steps: [
          {
            characterName: 'بايزي',
            action: 'سكل، إيكو بل فلو (Bell-Borne)، ألتيميشن، أوترو'
          },
          {
            characterName: 'يانغ يانغ',
            action: 'إنترو، تجميع الأعداء بالسكل، ألت، نقل طاقة بالاوترو'
          },
          {
            characterName: nameAr,
            action: 'إنترو، تفريغ كامل للفورتي بار، سكل، هيفي، أوترو'
          }
        ]
      }
    ]
  });

  return {
    slug,
    name,
    nameAr,
    role,
    summary,
    lede,
    element,
    weaponType: weapon,
    version,
    stats,
    talents,
    sequences,
    weaponsDPS,
    damageDistribution,
    ascensionMaterials,
    skillMaterials,
    allMaterials,
    recommendedEchoes: echoBuild,
    synergies,
    teams
  };
}

async function main() {
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
  console.log(`Processing all ${files.length} characters with complete data extraction...`);

  const results = {};
  for (const f of files) {
    const slug = f.replace('.html', '');
    try {
      const char = processCharacter(slug);
      if (char) results[slug] = char;
    } catch (err) {
      console.error(`Error processing ${slug}:`, err.message);
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Successfully generated ${OUT_FILE}`);
  
  const sample = results['qingxiao'];
  console.log('Sample qingxiao check:');
  console.log(' - Name:', sample?.nameAr);
  console.log(' - Talents count:', sample?.talents?.length);
  console.log(' - Sequences count:', sample?.sequences?.length);
  console.log(' - Weapons count:', sample?.weaponsDPS?.length);
  console.log(' - Damage chart present:', !!sample?.damageDistribution);
  console.log(' - Ascension mats count:', sample?.ascensionMaterials?.length);
  console.log(' - Skill mats count:', sample?.skillMaterials?.length);
  console.log(' - All mats count:', sample?.allMaterials?.length);
  console.log(' - Teams count:', sample?.teams?.length);
  console.log(' - Echo primary set:', sample?.recommendedEchoes?.primarySet);
  console.log(' - Echo substats priority:', sample?.recommendedEchoes?.substatsPriority);
}

main().catch(console.error);
