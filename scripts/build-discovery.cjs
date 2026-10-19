const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const entries = JSON.parse(fs.readFileSync(path.join(root, 'content/discovery-chapters.json'), 'utf8'));
const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
if (entries.length !== 16 || new Set(entries.map(n => n.chapter)).size !== 16) throw Error('Discovery index must cover all 16 chapters');
for (const entry of entries) {
  const file = path.join(root, 'dist', entry.chapter === 1 ? 'index.html' : `chapter-${entry.chapter}.html`);
  if (!fs.readFileSync(file, 'utf8').includes(`id="${entry.target}"`)) throw Error('Missing discovery target: ' + entry.target);
}
const file = path.join(root, 'dist/experiments.html');
let html = fs.readFileSync(file, 'utf8').replace(/<!-- discovery-index:start -->[\s\S]*?<!-- discovery-index:end -->/g, '');
const block = '<!-- discovery-index:start --><section class="experiment-group" id="discovery"><h2>全书探索 · 区间取样与对照</h2><p>已登记连续曲线可打开“区间取样”，比较选区内的曲线节点；第 11 章另有圆环质量联动。下列为各章推荐起点。</p><ul>' + entries.map(n => `<li><a href="${n.chapter === 1 ? 'index' : 'chapter-' + n.chapter}.html#${esc(n.target)}">第 ${n.chapter} 章 · 探索任务</a><p>${esc(n.question)}</p></li>`).join('') + '</ul></section><!-- discovery-index:end -->';
html = html.replace('<footer class="chapter-footer">', block + '<footer class="chapter-footer">');
fs.writeFileSync(file, html);
console.log('Installed discovery starting points for all 16 chapters.');
