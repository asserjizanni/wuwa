const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data_source/character_pages/qingxiao.html', 'utf8'));

console.log($('#build .awcd-echo-visuals').html());
