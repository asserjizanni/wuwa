const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data_source/character_pages/qingxiao.html', 'utf8'));
console.log('Sections with cp-character-materials:', $('.cp-character-materials').length);
$('.cp-character-materials').each((i, el) => {
  console.log('Sec', i, 'h3:', $(el).find('h3').text(), 'cards:', $(el).find('article').length);
  $(el).find('article').each((j, a) => {
    console.log('  card', j, 'img:', $(a).find('img').attr('src'), 'count:', $(a).find('.cp-materials-count-amount').text().trim(), 'name:', $(a).find('.cp-materials-count-name').text().trim());
  });
});
