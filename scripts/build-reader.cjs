// Keep the shared reading experience on hand-authored and generated chapters.
const fs = require('node:fs');
const path = require('node:path');
const dist = path.resolve(__dirname, '../dist');
const guides = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../content/lab-guides.json'), 'utf8'));
fs.writeFileSync(path.join(dist, 'assets/lab-guides.js'), 'window.BookLabGuides=' + JSON.stringify(guides).replaceAll('</', '<\\/') + ';\n');
for (const page of ['index.html', ...Array.from({length: 15}, (_, i) => `chapter-${i + 2}.html`)]) {
  const file = path.join(dist, page);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<link rel="stylesheet" href="assets\/reader-slides\.css">|<script src="assets\/(?:reader-slides|lab-guides)\.js" defer><\/script>/g, '');
  html = html.replace('</head>', '<link rel="stylesheet" href="assets/reader-slides.css"><script src="assets/lab-guides.js" defer></script><script src="assets/reader-slides.js" defer></script></head>');
  fs.writeFileSync(file, html);
}
console.log('Installed slide reader on all 16 chapters.');
require('./build-lab-details.cjs');
require('./build-chapter-expansion.cjs');
require('./build-measurement-labs.cjs');
require('./build-tide-selection.cjs');
require('./build-population-response.cjs');
require('./build-shell-conduction.cjs');
require('./build-photometry-drift.cjs');
require('./build-themes.cjs');
require('./build-illustrations.cjs');
require('./build-body-figures.cjs');
require('./build-scientific-charts.cjs');

require('./build-inline-math.cjs');

require('./build-academic-visuals.cjs');
require('./build-glossary.cjs');
require('./build-open-source.cjs');
