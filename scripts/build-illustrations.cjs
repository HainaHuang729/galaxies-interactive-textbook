// One manifest owns cover and body illustrations, their scientific provenance and their legends.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), dist = path.join(root, 'dist');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/illustrations.json'), 'utf8'));
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const color = value => /^#[0-9a-fA-F]{6}$/.test(String(value)) ? String(value) : '#84bcd5';

// Legend glyphs: dot / line / dashed / area / arrow / ring. Colors only identify the drawn object.
const legendGlyphs = {
  dot: c => `<circle cx="14" cy="8" r="5" fill="${c}"/>`,
  line: c => `<line x1="3" y1="8" x2="25" y2="8" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  dashed: c => `<line x1="3" y1="8" x2="25" y2="8" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="5 4"/>`,
  area: c => `<rect x="3" y="3" width="22" height="10" rx="2.5" fill="${c}" fill-opacity=".5" stroke="${c}" stroke-width="1.2"/>`,
  arrow: c => `<line x1="3" y1="8" x2="20" y2="8" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/><path d="M19 3.2 27 8 19 12.8Z" fill="${c}"/>`,
  ring: c => `<circle cx="14" cy="8" r="6" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="3.5 3"/>`
};
const legendIcon = (icon, swatch) => {
  const draw = legendGlyphs[icon] || legendGlyphs.line;
  return `<svg class="illustration-legend-icon" viewBox="0 0 28 16" width="28" height="16" aria-hidden="true" focusable="false">${draw(color(swatch))}</svg>`;
};
const legendHtml = art => {
  const legend = art.legend;
  if (!legend || !Array.isArray(legend.items) || !legend.items.length) return '';
  const items = legend.items.map(item => `<li class="illustration-legend-item"><span class="illustration-legend-swatch">${legendIcon(item.icon, item.color)}</span><span class="illustration-legend-copy"><strong>${escape(item.label)}</strong>${escape(item.meaning)}</span></li>`).join('');
  const note = legend.note ? `<p class="illustration-legend-note">${escape(legend.note)}</p>` : '';
  const read = legend.read ? `<p class="illustration-legend-read"><span>读图线索</span>${escape(legend.read)}</p>` : '';
  return `<div class="illustration-legend" data-no-math data-legend-kind="${escape(legend.kind || '')}"><p class="illustration-legend-title">图例</p><ul class="illustration-legend-list">${items}</ul>${note}${read}</div>`;
};

for (const page of fs.readdirSync(dist).filter(file => file.endsWith('.html'))) {
  const file = path.join(dist, page);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<!-- chapter-art(?::[\w-]+)?:start -->[\s\S]*?<!-- chapter-art(?::[\w-]+)?:end -->/g, '');
  html = html.replace(/<link rel="stylesheet" href="assets\/book-illustrations\.css">|<script src="assets\/book-illustrations\.js" defer><\/script>/g, '');
  const artworks = manifest.images.filter(image => image.page === page);
  for (const art of artworks) {
    const isSvg = art.format === 'svg';
    let source, fullSrc;
    if (isSvg) {
      // Code-drawn original SVG: one vector source, no raster srcset.
      const svgPath = art.files?.[0]?.path || `assets/illustrations/${art.id}.svg`;
      if (!fs.existsSync(path.join(dist, svgPath))) throw Error(`Missing artwork ${svgPath}`);
      source = fullSrc = svgPath;
    } else {
      for (const width of [640,960,1536]) {
        if (!fs.existsSync(path.join(dist, `assets/illustrations/${art.id}-${width}.webp`))) throw Error(`Missing artwork ${art.id}-${width}`);
      }
      source = `assets/illustrations/${art.id}-960.webp`;
      fullSrc = `assets/illustrations/${art.id}-1536.webp`;
    }
    const isBody = art.placement === 'body';
    const id = isBody ? `illustration-${art.id}` : 'chapter-art', captionId = `${id}-caption`;
    const generator = art.generator || (isSvg ? '原创SVG代码绘制（本项目）' : 'ImageGen（内置工具）');
    const dimensions = `width="${art.width}" height="${art.height}" loading="lazy" decoding="async" alt="${escape(art.alt)}"`;
    const imageTag = isSvg
      ? `<img src="${source}" ${dimensions}>`
      : `<img src="${source}" srcset="assets/illustrations/${art.id}-640.webp 640w, assets/illustrations/${art.id}-960.webp 960w, assets/illustrations/${art.id}-1536.webp 1536w" sizes="${isBody?'(min-width: 1100px) 940px, calc(100vw - 52px)':'(min-width: 1100px) 650px, (min-width: 850px) 50vw, calc(100vw - 52px)'}" ${dimensions}>`;
    const sources = art.book_reference ? `<p class="illustration-source" data-no-math>物理依据：${escape(art.book_reference)}${art.references?.length?' · '+art.references.map(ref=>`<a href="${escape(ref.url)}" target="_blank" rel="noopener">${escape(ref.label)}</a>`).join(' · '):''}<span>（参考资料不代表本图来源）</span></p>` : '';
    const figureOpen = `<figure class="chapter-illustration${isBody?' body-illustration':''}" id="${id}" data-art-kind="${isSvg?'code-svg':'ai-image'}" data-art-id="${escape(art.id)}">`;
    const heading = isBody ? `<div class="illustration-body-heading"><span class="small-label">结构与物理图景</span><h3>${escape(art.title)}</h3></div>` : '';
    const captionHeading = `<div class="illustration-caption-heading"><strong>${isBody?'读图说明':escape(art.title)}</strong><span>${escape(art.provenance)}</span></div>`;
    const legend = legendHtml(art);
    const figure = `${figureOpen}${heading}<button class="illustration-open" type="button" aria-label="查看大图：${escape(art.title)}" aria-haspopup="dialog" aria-controls="illustration-dialog" aria-describedby="${captionId}" data-full-src="${fullSrc}" data-art-title="${escape(art.title)}" data-art-caption="${escape(art.caption)}" data-art-provenance="${escape(art.provenance)}" data-art-generator="${escape(generator)}" data-art-format="${isSvg?'svg':'webp'}">${imageTag}<span class="illustration-zoom" aria-hidden="true">查看大图 ↗</span></button><figcaption id="${captionId}">${captionHeading}<p>${escape(art.caption)}</p><p class="illustration-observe"><span>观察线索</span>${escape(art.cue)}</p>${legend}${sources}</figcaption></figure>`;
    const regions = art.regions?.length ? `<div class="illustration-study" data-regions="${escape(JSON.stringify(art.regions))}"><div class="illustration-study-controls" aria-label="选择读图区域">${art.regions.map((r,i)=>`<button type="button" data-region="${i}" aria-pressed="false">${escape(r.label)}</button>`).join('')}</div><p class="illustration-study-text" aria-live="polite">选择一个区域，查看它与本节模型的关系。</p></div>` : '';
    const complete = regions ? figure.replace('</figcaption>', regions+'</figcaption>') : figure;
    let position;
    if (isBody) {
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
const svgCount = manifest.images.filter(image => image.format === 'svg').length;
console.log(`Installed ${manifest.images.length} captioned cover/body illustrations (${svgCount} code SVG, ${manifest.images.length - svgCount} webp).`);
