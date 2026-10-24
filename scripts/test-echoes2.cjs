const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data_source/character_pages/qingxiao.html', 'utf8'));

console.log('--- ECHO DETAILS ---');
$('.awcd-echo-card, [class*="echo"]').each((i, el) => {
  const cls = $(el).attr('class');
  if (cls && (cls.includes('main') || cls.includes('sonata') || cls.includes('card') || cls.includes('item'))) {
    console.log(`Echo el ${i} (${cls}):`, $(el).text().replace(/\s+/g, ' ').substring(0, 100));
  }
});
