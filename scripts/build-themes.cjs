// Install shared theme assets on authored and generated pages. This is idempotent.
const fs = require('node:fs'), path = require('node:path');
const dist = path.resolve(__dirname, '../dist');
require('./build-theme-tokens.cjs');
for (const file of fs.readdirSync(dist).filter(name => name.endsWith('.html'))) {
  const target = path.join(dist, file);
  let html = fs.readFileSync(target, 'utf8');
  html = html.replace(/<script src="assets\/book-theme\.js"><\/script>|<link rel="stylesheet" href="assets\/(?:book-theme|theme-tokens)\.css">/g, '');
  html = html.replace(/(<head[^>]*>)/, '$1<script src="assets/book-theme.js"></script>');
  html = html.replace('</head>', '<link rel="stylesheet" href="assets/theme-tokens.css"><link rel="stylesheet" href="assets/book-theme.css"></head>');
  fs.writeFileSync(target, html);
}
console.log('Installed persistent afterglow / moon theme switch on every page.');
