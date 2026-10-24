import fs from 'fs';
import path from 'path';

async function parseEnemiesFromHtml() {
  console.log('Fetching https://arabwuwa.com/ar/enemies/...');
  const res = await fetch('https://arabwuwa.com/ar/enemies/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  
  // Regex to match enemy-card divs and attributes
  const cardRegex = /<a[^>]*class="[^"]*enemy-card[^"]*"[^>]*href="([^"]*)"[^>]*data-id="([^"]*)"[^>]*data-class="([^"]*)"[^>]*data-elements="([^"]*)"[^>]*data-hp="([^"]*)"[^>]*data-atk="([^"]*)"[^>]*data-def="([^"]*)"[^>]*data-search="([^"]*)"[\s\S]*?<\/a>/gi;
  
  // If attribute order differs, let's parse card blocks:
  const cardBlocks = html.match(/<a[^>]*class="[^"]*enemy-card[^"]*"[\s\S]*?<\/a>/gi) || [];
  console.log('Found enemy card blocks:', cardBlocks.length);

  const enemies = [];
  for (const block of cardBlocks) {
    const hrefMatch = block.match(/href="([^"]*)"/);
    const idMatch = block.match(/data-id="([^"]*)"/);
    const classMatch = block.match(/data-class="([^"]*)"/);
    const elementsMatch = block.match(/data-elements="([^"]*)"/);
    const hpMatch = block.match(/data-hp="([^"]*)"/);
    const atkMatch = block.match(/data-atk="([^"]*)"/);
    const defMatch = block.match(/data-def="([^"]*)"/);
    const searchMatch = block.match(/data-search="([^"]*)"/);
    
    // image
    const imgMatch = block.match(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"/);
    // name
    const titleMatch = block.match(/<[^>]*class="[^"]*enemy-card-title[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/i);
    let rawName = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    // description
    const descMatch = block.match(/class="[^"]*enemy-card-description[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    
    // searchMatch contains English + Arabic name
    const searchStr = searchMatch ? searchMatch[1] : '';
    // Split search into English and Arabic names cleanly
    const arIdx = searchStr.search(/[\u0600-\u06FF]/);
    let nameEn = arIdx !== -1 ? searchStr.slice(0, arIdx).trim() : searchStr;
    let nameAr = arIdx !== -1 ? searchStr.slice(arIdx).trim() : (rawName || nameEn);
    if (!nameEn) nameEn = nameAr;

    const desc = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    const image = imgMatch ? imgMatch[1] : '';
    const url = hrefMatch ? hrefMatch[1] : '';
    const slug = url.split('/').filter(Boolean).pop() || `enemy-${idMatch ? idMatch[1] : enemies.length + 1}`;

    enemies.push({
      id: idMatch ? idMatch[1] : String(enemies.length + 1),
      slug: slug,
      name: nameEn || nameAr,
      nameAr: nameAr || nameEn,
      enemyClass: classMatch ? classMatch[1] : 'Common',
      elements: elementsMatch ? elementsMatch[1].split(' ').filter(Boolean) : [],
      hp: hpMatch && hpMatch[1] ? Number(hpMatch[1]) : null,
      atk: atkMatch && atkMatch[1] ? Number(atkMatch[1]) : null,
      def: defMatch && defMatch[1] ? Number(defMatch[1]) : null,
      search: searchStr,
      description: desc,
      image: image.startsWith('http') ? image : `https://arabwuwa.com${image}`,
      detailUrl: url
    });
  }

  console.log(`Parsed ${enemies.length} enemies!`);
  if (enemies.length > 0) {
    console.log('Sample enemy:', enemies[0]);
    const outPath = path.join(process.cwd(), 'data_source', 'enemies.json');
    fs.writeFileSync(outPath, JSON.stringify(enemies, null, 2));
    console.log('Successfully saved to data_source/enemies.json!');
  }
}

parseEnemiesFromHtml();
