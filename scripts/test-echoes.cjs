const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data_source/character_pages/qingxiao.html', 'utf8'));
const build = $('#build');
build.find('section').each((i, el) => {
  console.log(`Panel ${i}:`, $(el).find('h3, h4').map((_, h) => $(h).text().trim()).get().join(' | '));
  console.log(' text snippet:', $(el).text().replace(/\s+/g, ' ').substring(0, 150));
});
