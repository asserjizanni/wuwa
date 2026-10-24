const fs = require('fs');
const html = fs.readFileSync('timeline_dump.html', 'utf8');

// Find all heights or paddings in the timeline dump
console.log('--- Header search ---');
const hIdx = html.indexOf('id="header"');
console.log(html.slice(hIdx, hIdx + 200));

console.log('--- Footer search ---');
const fIdx = html.indexOf('id="footer"');
console.log(html.slice(fIdx, fIdx + 200));
