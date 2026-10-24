// Bước build cho Hostinger: kiểm tra dữ liệu mẫu và mọi view biên dịch được.
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const root = path.join(__dirname, '..');
for (const f of fs.readdirSync(path.join(root, 'seed'))) JSON.parse(fs.readFileSync(path.join(root, 'seed', f), 'utf8'));

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
const views = walk(path.join(root, 'views')).filter((f) => f.endsWith('.ejs'));
for (const v of views) ejs.compile(fs.readFileSync(v, 'utf8'), { filename: v });
console.log(`Build OK: ${views.length} view, dữ liệu mẫu hợp lệ.`);
