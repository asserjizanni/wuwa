const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data_source/character_pages/shorekeeper.html', 'utf8'));

$('section').each((i, s) => {
  console.log(`Sec ${i}: id="${$(s).attr('id')}" class="${$(s).attr('class')}" h2="${$(s).find('h2').text().trim()}"`);
});
