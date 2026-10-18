// Original body figures are stored independently of generated chapter HTML.
// Inserting direct section children lets the reader keep each figure on one page.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const records=JSON.parse(fs.readFileSync(path.join(root,'content/body-figures.json'),'utf8')).figures;
const e=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function gallery(r){
 const missing=r.images.filter(im=>![im.path,im.fullPath].every(file=>fs.existsSync(path.join(dist,file))));
 if(missing.length&&missing.every(im=>im.distribution==='external_reference_only'))return `<div class="bf-reference-card"><p>这幅真实观测图像采用发布方的独立素材许可，开源下载包提供官方链接。</p><p><a class="inline-link" href="${e(r.sourceURL)}" target="_blank" rel="noopener noreferrer">在官方页面查看观测图像 ↗</a></p><p data-no-math>${r.images.map(im=>e(im.credit)).join(' · ')}</p></div>`;

 const buttons=r.images.length>1?[['all','全部对照'],...r.images.map((im,i)=>[String(i),im.label])].map(([mode,label])=>`<button type="button" data-bf-mode="${mode}" aria-pressed="${mode==='all'}">${e(label)}</button>`).join(''):'';
 const panels=r.images.map(im=>{
  for(const file of [im.path,im.fullPath])if(!fs.existsSync(path.join(dist,file)))throw Error('Missing image '+file);
  return `<figure class="bf-image-panel" data-full-src="${e(im.fullPath)}"><button type="button" aria-label="查看大图：${e(im.label)}" aria-haspopup="dialog"><img src="${e(im.path)}" ${im.srcset?`srcset="${e(im.srcset)}" sizes="(min-width: 900px) ${Math.floor(100/r.images.length)}vw, calc(100vw - 48px)"`:''} width="${im.width}" height="${im.height}" alt="${e(im.alt)}" loading="lazy" decoding="async"></button><figcaption data-no-math><strong>${e(im.label)}</strong><span>${e(im.description)}</span><br><span class="bf-image-credit" data-no-math><a href="${e(r.sourceURL)}" target="_blank" rel="noopener">${e(im.credit)}</a></span></figcaption></figure>`;
 }).join('');
 const provenance=r.production==='observation'?`<p class="bf-observation-note">${e(r.observationNote)}</p><div class="bf-credits"><a href="${e(r.sourceURL)}" target="_blank" rel="noopener">官方观测产品 · ${e(r.releaseDate)}</a>${r.policySources.map((p,i)=>`<a href="${e(p.url)}" target="_blank" rel="noopener">${e(p.label||['Chandra 使用说明','NASA 图像政策','ESA/Hubble · CC BY 4.0'][i])}</a>`).join('')}</div>`:'';
 return `${buttons?`<div class="bf-gallery-controls" aria-label="图像对照方式">${buttons}</div>`:''}<div class="bf-images${r.images.length===1?' bf-images-single':''}" style="--bf-count:${r.images.length}">${panels}</div>${provenance}`;
}
function figure(r){
 const kind={code:'模型与几何图解',imagegen:'AI 科教示意 · 非观测数据',observation:'真实观测 · 发布方显示色'}[r.production];
 const source=r.sourceKey?`<button class="source bf-source" data-source="${e(r.sourceKey)}">${e(r.sourceLabel)}</button>`:`<span class="bf-source" data-no-math>${e(r.sourceLabel)}</span>`;
 const controls=r.controls==='growth'?'<div class="bf-model-controls"><label>膨胀背景<select data-bf-growth-model><option value="0.3">物质＋Λ：Ωm,0=0.3</option><option value="1">纯物质 EdS：Ωm,0=1</option></select></label><p>早期种子固定；移动指针或聚焦图像后按方向键读取密度。<a href="#growth-lab">查看连续参数实验</a></p></div>':'';
 return `<figure class="body-figure" id="${e(r.id)}" data-production="${r.production}" aria-labelledby="${e(r.id)}-title"><div class="bf-heading"><h3 id="${e(r.id)}-title">${e(r.title)}</h3><span class="bf-kind">${e(r.kindLabel||kind)}</span></div><p class="bf-purpose">${e(r.caption)}</p>${r.question?`<p class="bf-purpose">${e(r.question)}</p>`:''}${controls}${r.production==='code'?'<div class="bf-stage"></div><p class="bf-readout"></p>':gallery(r)}<div class="bf-footer">${r.production==='code'?'<button class="bf-expand" type="button" aria-haspopup="dialog">放大图解 ↗</button>':''}${source}</div><details class="bf-assumptions"><summary>图的假设与出处</summary><p>${e(r.scope)}</p><p>${r.production==='code'?'本图为配合书中主题制作的原创图解，未复制原书插图。':'本组采用官方发布的观测产品，作为教材主题的补充证据。'}${r.production==='code'?'图中计算条件与结果见图内标注；未使用真实观测点。':'观测图保留发布方原始 JPEG，不裁剪、不改色；各图完整署名列在画面下方。'}</p></details></figure>`;
}
function sectionEnd(html,anchor){
 const start=html.indexOf(`<section id="${anchor}"`);if(start<0)throw Error('Missing section '+anchor);
 const tags=/<section\b[^>]*>|<\/section>/g;tags.lastIndex=start;let depth=0,m;
 while((m=tags.exec(html))){depth+=m[0].startsWith('</')?-1:1;if(depth===0)return m.index;}
 throw Error('Unclosed section '+anchor);
}
const assets=['body-figure-content','body-figure-geometry','body-figures-early','body-figures-late','body-figures-physical','body-figures'];
for(const page of fs.readdirSync(dist).filter(p=>p.endsWith('.html'))){
 const file=path.join(dist,page);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<!-- body-figures:start -->[\s\S]*?<!-- body-figures:end -->/g,'').replace(/<link rel="stylesheet" href="assets\/body-figures\.css">/g,'');
 for(const asset of assets)html=html.replaceAll(`<script src="assets/${asset}.js" defer></script>`,'');
 const items=records.filter(r=>r.page===page);
 for(const anchor of new Set(items.map(r=>r.anchor))){const end=sectionEnd(html,anchor);html=html.slice(0,end)+'<!-- body-figures:start -->'+items.filter(r=>r.anchor===anchor).map(figure).join('')+'<!-- body-figures:end -->'+html.slice(end);}
 if(items.length)html=html.replace('</head>','<link rel="stylesheet" href="assets/body-figures.css">'+assets.map(a=>`<script src="assets/${a}.js" defer></script>`).join('')+'</head>');
 if(page==='experiments.html'){
  html=html.replace(/<!-- body-figure-index:start -->[\s\S]*?<!-- body-figure-index:end -->/g,'');
  const index=`<!-- body-figure-index:start --><section class="experiment-group" id="body-figure-index"><h2>正文图解与观测 · 16 章 / ${records.length} 组</h2><p>科学模型、几何示意与真实观测，按章节排列。每幅图可独立翻页、放大查看。</p><ul>${records.map(r=>`<li><a href="${r.page}#${r.id}">第 ${r.chapter} 章 · ${e(r.title)}</a><p>${e(r.caption)}</p></li>`).join('')}</ul></section><!-- body-figure-index:end -->`;
  html=html.replace('<footer class="chapter-footer">',index+'<footer class="chapter-footer">');
 }
 fs.writeFileSync(file,html);
}
fs.writeFileSync(path.join(dist,'assets/body-figure-content.js'),'window.BookBodyFigures='+JSON.stringify(records)+';\n');
console.log(`Installed ${records.length} body figures across ${new Set(records.map(r=>r.chapter)).size} chapters.`);
