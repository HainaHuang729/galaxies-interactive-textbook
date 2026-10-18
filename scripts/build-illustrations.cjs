// One manifest owns cover and body illustrations and their scientific provenance.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), dist = path.join(root, 'dist');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/illustrations.json'), 'utf8'));
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for (const page of fs.readdirSync(dist).filter(file => file.endsWith('.html'))) {
  const file = path.join(dist, page);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<!-- chapter-art(?::[\w-]+)?:start -->[\s\S]*?<!-- chapter-art(?::[\w-]+)?:end -->/g, '');
  html = html.replace(/<link rel="stylesheet" href="assets\/book-illustrations\.css">|<script src="assets\/book-illustrations\.js" defer><\/script>/g, '');
  const artworks = manifest.images.filter(image => image.page === page);
  for (const art of artworks) {
    for (const width of [640,960,1536]) {
      if (!fs.existsSync(path.join(dist, `assets/illustrations/${art.id}-${width}.webp`))) throw Error(`Missing artwork ${art.id}-${width}`);
    }
    const body = art.placement === 'body';
    const base = `assets/illustrations/${art.id}`, id = body ? `illustration-${art.id}` : 'chapter-art', captionId = `${id}-caption`;
    const sources = art.book_reference ? `<p class="illustration-source" data-no-math>物理依据：${escape(art.book_reference)}${art.references?.length?' · '+art.references.map(ref=>`<a href="${escape(ref.url)}" target="_blank" rel="noopener">${escape(ref.label)}</a>`).join(' · '):''}<span>（参考资料不代表本图来源）</span></p>` : '';
    const image = `<figure class="chapter-illustration${body?' body-illustration':''}" id="${id}">${body?`<div class="illustration-body-heading"><span class="small-label">结构与物理图景</span><h3>${escape(art.title)}</h3></div>`:''}<button class="illustration-open" type="button" aria-label="查看大图：${escape(art.title)}" aria-haspopup="dialog" aria-controls="illustration-dialog" aria-describedby="${captionId}" data-full-src="${base}-1536.webp" data-art-title="${escape(art.title)}" data-art-caption="${escape(art.caption)}" data-art-provenance="${escape(art.provenance)}"><img src="${base}-960.webp" srcset="${base}-640.webp 640w, ${base}-960.webp 960w, ${base}-1536.webp 1536w" sizes="${body?'(min-width: 1100px) 940px, calc(100vw - 52px)':'(min-width: 1100px) 650px, (min-width: 850px) 50vw, calc(100vw - 52px)'}" width="${art.width}" height="${art.height}" loading="lazy" decoding="async" alt="${escape(art.alt)}"><span class="illustration-zoom" aria-hidden="true">查看大图 ↗</span></button><figcaption id="${captionId}"><div class="illustration-caption-heading"><strong>${body?'读图说明':escape(art.title)}</strong><span>${escape(art.provenance)}</span></div><p>${escape(art.caption)}</p><p class="illustration-observe"><span>观察线索</span>${escape(art.cue)}</p>${sources}</figcaption></figure>`;
    const regions=art.regions?.length?`<div class="illustration-study" data-regions="${escape(JSON.stringify(art.regions))}"><div class="illustration-study-controls" aria-label="选择读图区域">${art.regions.map((r,i)=>`<button type="button" data-region="${i}" aria-pressed="false">${escape(r.label)}</button>`).join('')}</div><p class="illustration-study-text" aria-live="polite">选择一个区域，查看它与本节模型的关系。</p></div>`:'';
    const complete=regions?image.replace('</figcaption>',regions+'</figcaption>'):image;
    let position;
    if (body) {
      const start = html.indexOf(`<section id="${art.anchor}"`);
      position = html.indexOf('</section>', start);
      if (start < 0 || position < 0) throw Error(`Missing artwork section ${page}#${art.anchor}`);
    } else {
      const opening = html.indexOf('<section id="opening"');
      position = html.indexOf('<div class="chapter-meta"', opening);
      if (opening < 0 || position < 0) throw Error(`No chapter opening in ${page}`);
    }
    html = html.slice(0,position) + `<!-- chapter-art:${art.id}:start -->` + complete + `<!-- chapter-art:${art.id}:end -->` + html.slice(position);
  }
  if (artworks.length) html = html.replace('</head>', '<link rel="stylesheet" href="assets/book-illustrations.css"><script src="assets/book-illustrations.js" defer></script></head>');
  fs.writeFileSync(file, html);
}
console.log(`Installed ${manifest.images.length} captioned cover/body illustrations.`);
