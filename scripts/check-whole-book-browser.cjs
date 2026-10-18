// Fresh full-book visible-glyph, actual-path and responsive-layout audit.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BOOK_PREVIEW_URL||'http://127.0.0.1:18765';
const out=process.env.WHOLE_BOOK_AUDIT_DIR||path.join(require('node:os').tmpdir(),'galaxies-whole-book-v36');
fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHROMIUM_CHANNEL||'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),report={pages:[],markerStates:[],semanticCases:[],errors:[]};
p.on('pageerror',e=>report.errors.push(e.message));
async function go(ch,id){await p.goto(`${base}/${ch===1?'index':`chapter-${ch}`}.html#${id}`,{waitUntil:'networkidle'});}
function inspect(){
 const page=document.querySelector('.reader-slide.is-active');BookGlossary.enhance(page);const unbound=[];
 for(const ex of page.querySelectorAll('.inline-math,.math-line .katex')){
  // Native selects have an accessible, adjacent option glossary; their overlay is decorative.
  if(ex.closest('.glossary-ui,.math-measure,.math-select-preview,button,a'))continue;
  for(const n of ex.querySelectorAll('.katex-html .mord,.katex-html .mop')){
   if(n.querySelector('.mord,.mop')||n.closest('.text,.accent-body')||!/[A-Za-zα-ωΑ-Ω]/u.test(n.textContent))continue;
   const bound=n.closest('[data-glossary-ids]');
   if(!bound||bound.classList.contains('glossary-math-root')&&bound.dataset.glossaryLabel==='公式中的符号')unbound.push({text:n.textContent,tex:ex.querySelector('annotation')?.textContent});
  }
 }
 const markers=[...page.querySelectorAll('circle[data-model-point-series]')].map(n=>{
  const svg=n.ownerSVGElement,s=BookCharts.inspect(svg),index=+n.dataset.modelPointSeries,x=+n.dataset.modelPointX,y=+n.dataset.modelPointY;
  const curve=s.series[index],path=svg.querySelector(`path[data-plot-series="${index}"]`),drawn=path?.__data__||[];
  const serialized=path&&d3.line().defined(d=>Number.isFinite(d.y)&&(!s.y.base||d.y>0)).x(d=>s.x(d.x)).y(d=>s.y(d.y))(drawn);
  return {chart:svg.id,index,x,y,node:curve?.data.some(d=>d.x===x&&d.y===y),pathNode:drawn.some(d=>d.x===x&&d.y===y),serialized:path?.getAttribute('d')===serialized,positionError:Math.max(Math.abs(+n.getAttribute('cx')-s.x(x)),Math.abs(+n.getAttribute('cy')-s.y(y)))};
 });
 return {unbound,markers,katexErrors:page.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth>innerWidth+1};
}
for(const [theme,width]of [['afterglow',1440],['moon',320]]){
 await p.setViewportSize({width,height:1100});
 for(let ch=1;ch<=16;ch++){
  await go(ch,'opening');await p.evaluate(t=>BookTheme.set(t),theme);
  const targets=await p.locator('.reader-slide').evaluateAll(ns=>ns.map(n=>n.dataset.pageTarget));
  for(const target of targets){
   await p.evaluate(t=>location.hash=t,target);await p.waitForTimeout(90);const row=await p.evaluate(inspect);
   assert.deepEqual(row.unbound,[],`${ch} ${target}: missing visible glyph explanation`);
   assert.equal(row.katexErrors,0);assert.equal(row.overflow,false,`${theme}/${width} ${ch}#${target} overflow`);
   for(const m of row.markers){assert(m.node&&m.pathNode&&m.serialized&&m.positionError<1e-9,JSON.stringify(m));}
   report.pages.push({ch,target,theme,width,markers:row.markers.length,katexErrors:0,unbound:0,overflow:false});
   if(row.markers.length&&width===1440){
    const values=await p.locator('.reader-slide.is-active input[type=range]').evaluateAll(ns=>ns.map(n=>n.value));
    for(const state of ['min','max','interior']){
     await p.locator('.reader-slide.is-active input[type=range]').evaluateAll((ns,state)=>{for(const n of ns){n.value=state==='interior'?+n.min+.371*(n.max-n.min):n[state];n.dispatchEvent(new Event('input',{bubbles:true}));}},state);
     await p.waitForTimeout(90);const check=await p.evaluate(inspect);for(const m of check.markers)assert(m.node&&m.pathNode&&m.serialized&&m.positionError<1e-9,`${state}: ${JSON.stringify(m)}`);
     assert.deepEqual(check.unbound,[]);assert.equal(check.katexErrors,0);report.markerStates.push({ch,target,state,markers:check.markers});
    }
    await p.locator('.reader-slide.is-active input[type=range]').evaluateAll((ns,values)=>ns.forEach((n,i)=>{n.value=values[i];n.dispatchEvent(new Event('input',{bubbles:true}));}),values);
   }
  }
  fs.writeFileSync(path.join(out,'browser-review.json'),JSON.stringify(report,null,2));console.log(`${theme}/${width}: chapter ${ch}, ${targets.length} pages`);
 }
}
// Click rendered compound glyphs, including different meanings of the same letter.
for(const [ch,target,id]of [[4,'growth-lab-model','c4-Dplus'],[4,'growth-lab-model','v36-c4-Ddot'],[4,'growth-lab-model','v36-c4-Dddot'],[4,'smoothing-lab-model','v36-c4-smoothed-delta'],[8,'wind-lab-model','v36-c8-rho-ambient'],[10,'body-figure-10-chemistry-19','c10-za'],[15,'matching-lab-model','v36-match-m'],[15,'counts-lab-model','c15-counts-m'],[15,'cosmic-sfr-lab-model','v36-sfr-cut']]){
 await go(ch,target);await p.waitForTimeout(100);const n=p.locator(`.reader-slide.is-active .katex-html [data-glossary-ids="${id}"]`).first();
 await n.click();assert.equal(await p.locator(`.glossary-card[data-entry-id="${id}"]`).count(),1,`${ch}#${target}: ${id}`);await p.keyboard.press('Escape');report.semanticCases.push({ch,target,id});
}
const layouts=[[2,'profile-lab'],[7,'boundary-lab'],[4,'growth-lab'],[4,'smoothing-lab'],[8,'wind-lab-model'],[10,'body-figure-10-chemistry-19'],[15,'matching-lab-model'],[15,'cosmic-sfr-lab']];
report.layouts=[];
for(const theme of ['afterglow','moon'])for(const width of [1440,390,320])for(const [ch,target]of layouts){
 await p.setViewportSize({width,height:1100});await go(ch,target);await p.evaluate(t=>BookTheme.set(t),theme);await p.waitForTimeout(220);
 const row=await p.evaluate(inspect);assert.equal(row.overflow,false);assert.equal(row.katexErrors,0);report.layouts.push({theme,width,ch,target});
 if((width===390&&theme==='afterglow'||width===1440&&theme==='moon')&&[4,10,15].includes(ch))await p.locator('.reader-slide.is-active').screenshot({path:path.join(out,`${ch}-${target}-${theme}-${width}.png`)});
}
assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'browser-review.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pages:report.pages.length,markerStates:report.markerStates.length,semanticCases:report.semanticCases.length,layouts:report.layouts.length,errors:report.errors.length}));
await browser.close();
})().catch(e=>{console.error(e.stack);process.exit(1);});
