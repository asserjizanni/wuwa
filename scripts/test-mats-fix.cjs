const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data_source/character_pages/qingxiao.html', 'utf8'));

$('.cp-character-materials').each((idx, el) => {
  const $sec = $(el);
  const title = $sec.find('h3').first().text().trim();
  const items = [];

  $sec.find('article.character-page-upgrading-materials-card').each((_, mEl) => {
    const $m = $(mEl);
    const icon = $m.find('img').first().attr('src') || '';
    const amount = $m.find('.cp-materials-count-amount').first().text().trim();
    const mName = $m.find('.cp-materials-count-name').first().text().trim();
    if (mName) {
      items.push({ name: mName, amount, icon });
    }
  });

  console.log(`Sec ${idx}: ${title} -> ${items.length} items`);
  if (items.length > 0) console.log(' sample item:', items[0]);
});
