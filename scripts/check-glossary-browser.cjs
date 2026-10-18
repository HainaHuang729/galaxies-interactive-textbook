// Run against a local static preview; PLAYWRIGHT_MODULE may point to a bundled runtime.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BOOK_PREVIEW_URL||'http://127.0.0.1:18765';
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHROMIUM_CHANNEL||'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 page.setDefaultTimeout(7000);
 const report={semanticCases:[],chapters:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
 async function go(ch,target){await page.goto(`${base}/${ch===1?'index':`chapter-${ch}`}.html#${target}`,{waitUntil:'networkidle'});await page.waitForTimeout(200);}
 async function expect(ch,target,texPart,glyph,id){
  await go(ch,target);
  const hit=await page.evaluate(({texPart,glyph})=>{
   const active=document.querySelector('.reader-slide.is-active');BookGlossary.enhance(active);const expr=[...active.querySelectorAll('.inline-math,.math-line .katex')].find(n=>n.querySelector('annotation')?.textContent.includes(texPart));
   if(!expr)return {missing:texPart};
   const leaves=[...expr.querySelectorAll('.katex-html .mord,.katex-html .mop')].filter(n=>!n.querySelector('.mord,.mop')&&BookGlossary.normalize(n.textContent)===BookGlossary.normalize(glyph));
   const bound=leaves[0]?.closest('[data-glossary-ids]')||expr;
   return {ids:bound.dataset.glossaryIds,label:bound.dataset.glossaryLabel,tex:expr.querySelector('annotation').textContent};
  },{texPart,glyph});
  assert.equal(hit.ids,id,`${ch}#${target} ${glyph}: ${JSON.stringify(hit)}`);report.semanticCases.push({ch,target,glyph,id});
 }
 try{
  await expect(2,'profile-lab-model','I(R)=','R','c2-sersic-radius');
  await expect(4,'sheet-lab-model','x(q)','q','c4-q-initial');
  await expect(4,'statistics','W(kR)','R','c4-R-window');
  await expect(4,'statistics','W(kR)','k','c4-k');
  await expect(5,'sphere-lab','delta_L =','δ','c5-deltaL');
  await expect(6,'cmb-lab','widehat C','C','c6-Clhat');
  await expect(8,'radcool-lab-model','Lambda(T)=','K','common-unit-K');
  await expect(8,'radcool-lab-model','rho_{\\mathrm{tot}}','ρ','supp-c8-total-density');
  await expect(8,'thermal-lab-model','theta=','0','supp-c8-equilibrium-T0');
  await expect(11,'disk-spin-lab','j =','j','supp-c11-spin-j-ratio');
  await expect(11,'toomre-lab-model','min_k','min','common-min');
  await expect(13,'fundamental-plane-lab-model','L = 2','e','c13-fp-Ie');
  // A second e in the same expression belongs to R_e, never Euler's number.
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.reader-slide.is-active .katex-html [data-glossary-ids="common-e"]')].length),0);
  for(const [ch,target,id]of [[8,'buoy-lab','supp-c8-buoyant-acceleration'],[14,'agn-feedback-lab','c14-fb-Ecoup'],[15,'occupation-bias-lab','c15-bias-ni'],[15,'occupation-bias-lab','c15-bias-Ni'],[16,'transmission-lab','c16-trans-cont'],[16,'metal-thermometer-lab','c16-metal-bm'],[16,'neutral-census-lab','supp-element-He']]){
   await go(ch,target);const label=page.locator(`.reader-slide.is-active svg [data-glossary-ids="${id}"]`).first();await label.waitFor({state:'visible'});await label.click();assert.equal(await page.locator(`.glossary-card[data-entry-id="${id}"]`).count(),1);await page.keyboard.press('Escape');report.semanticCases.push({ch,target,id,click:true});
  }
  await go(12,'body-figure-12-clusters-22');
  assert(await page.locator('.reader-slide.is-active .bf-readout annotation').evaluateAll(n=>n.some(x=>x.textContent.includes('M_{g,0}=\\exp[-0.8'))),'complete dynamic caption TeX');
  assert.equal(await page.locator('.reader-slide.is-active .bf-readout').evaluate(n=>{const c=n.cloneNode(true);c.querySelectorAll('.inline-math').forEach(n=>n.remove());return /\\\(|_\{/.test(c.textContent)}),false,'raw TeX leaked in caption');
  await go(3,'thermal');await page.evaluate(()=>location.hash=document.getElementById('thermal-picker').closest('.reader-slide').dataset.pageTarget);await page.waitForTimeout(150);
  for(const [state,ids]of [[0,['c3-H-thermal']],[1,['c3-proton','c3-n-neutron']],[3,['c3-proton','c3-electron','c3-hydrogen','supp-c3-recombination-photon']]]){
   await page.locator(`[data-thermal="${state}"]`).click();await page.waitForTimeout(150);
   const found=await page.locator('#thermal-symbol [data-glossary-ids]').evaluateAll(ns=>[...new Set(ns.flatMap(n=>n.dataset.glossaryIds.split(' ')))]);
   if(state)for(const id of ids)assert(found.includes(id),`thermal state ${state}: ${id} ${found}`);
  }
  // Confirm signed stability N² is explained as a squared quantity once.
  await go(8,'buoy-lab-model');const n2=page.locator('.reader-slide.is-active [data-glossary-ids="c8-brunt"]').first();await n2.click();assert.equal(await page.locator('.glossary-expression-note').count(),0);await page.keyboard.press('Escape');
  // Inspect all reader pages and both endpoints of every control page.
  for(let ch=1;ch<=16;ch++){
   await go(ch,'opening');const rows=await page.evaluate(()=>[...document.querySelectorAll('.reader-slide')].map(p=>({target:p.dataset.pageTarget,ranges:p.querySelectorAll('input[type=range]').length}))),result={chapter:ch,pages:rows.length,controlPages:0,rangeInputs:0,endpointStates:0};
   for(const r of rows){
    if(!r.ranges)continue;result.controlPages++;result.rangeInputs+=r.ranges;
    await page.evaluate(t=>location.hash=t,r.target);await page.waitForTimeout(75);
    const original=await page.locator('.reader-slide.is-active input[type=range]').evaluateAll(ns=>ns.map(n=>n.value));
    for(const endpoint of ['min','max']){
     await page.locator('.reader-slide.is-active input[type=range]').evaluateAll((ns,endpoint)=>{for(const n of ns){n.value=n[endpoint];n.dispatchEvent(new Event('input',{bubbles:true}));}},endpoint);await page.waitForTimeout(85);
     const bad=await page.evaluate(()=>{const p=document.querySelector('.reader-slide.is-active');BookGlossary.enhance(p);return {katex:p.querySelectorAll('.katex-error').length,unknownIds:[...p.querySelectorAll('[data-glossary-ids]')].flatMap(n=>n.dataset.glossaryIds.split(' ')).filter(id=>!BookGlossary.byId.has(id)),undefinedText:/\b(?:NaN|undefined)\b/.test(p.innerText)};});
     assert.equal(bad.katex,0,`${ch} ${r.target} KaTeX`);assert.deepEqual(bad.unknownIds,[]);assert.equal(bad.undefinedText,false,`${ch} ${r.target}: nonfinite label`);result.endpointStates++;
    }
    await page.locator('.reader-slide.is-active input[type=range]').evaluateAll((ns,values)=>ns.forEach((n,i)=>{n.value=values[i];n.dispatchEvent(new Event('input',{bubbles:true}));}),original);
   }
   report.chapters.push(result);console.log(`chapter ${ch}: ${result.pages} pages, ${result.endpointStates} endpoint states`);
  }
  // Render every dictionary card too: the index is part of the book, and raw
  // underscore notation can otherwise survive a chapter-only coverage scan.
  await page.goto(`${base}/glossary.html`,{waitUntil:'networkidle'});await page.setViewportSize({width:320,height:1100});
  const cardIds=await page.evaluate(()=>BookGlossary.entries.map(e=>e.id));
  for(const id of cardIds){
   const bad=await page.evaluate(id=>{BookGlossary.openEntries([id],null);BookMath.typeset(document.querySelector('#glossary-dialog'));const card=document.querySelector('.glossary-card'),copy=card.cloneNode(true);copy.querySelectorAll('.inline-math,.katex,details').forEach(n=>n.remove());return {raw:/_|\\\(|\\\)/.test(copy.textContent),errors:card.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth>innerWidth+1};},id);
   assert.deepEqual(bad,{raw:false,errors:0,overflow:false},`dictionary card ${id}`);
  }
  report.dictionaryCards=cardIds.length;
  assert.deepEqual(report.errors,[]);
  if(process.env.BOOK_AUDIT_REPORT)fs.writeFileSync(process.env.BOOK_AUDIT_REPORT,JSON.stringify(report,null,2));
  console.log(`${report.semanticCases.length} observed semantic regressions passed; all chapter control endpoints checked.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
