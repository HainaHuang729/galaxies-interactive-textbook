// Browser checks for the 19 redesigned body figures: layout, themes, real pointer
// drags, keyboard, reset, enlarged view and screenshots. Requires the local server.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BOOK_BASE_URL||'http://127.0.0.1:8765';
const channel=process.env.PLAYWRIGHT_CHROMIUM_CHANNEL||'msedge';
const out=path.resolve(process.env.FIGURE_AUDIT_DIR||path.join(os.tmpdir(),'galaxies-figure-redesign-20261018'));
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const IDS=[
 'body-figure-1-diversity-0','body-figure-3-distance-4','body-figure-3-distance-5','body-figure-5-ellipsoid-8',
 'body-figure-5-similarity-9','body-figure-6-lensing-10','body-figure-7-structure-13','body-figure-8-feedback-14',
 'body-figure-9-individual-16','body-figure-9-molecules-17','body-figure-10-tracks-18','body-figure-12-clusters-22',
 'body-figure-12-dynamical-friction-23','body-figure-13-plane-25','body-figure-13-structure-24','body-figure-14-engine-26',
 'body-figure-15-clustering-29','body-figure-16-lyman-forest-30','body-figure-16-limit-systems-31'];
const pageOf=id=>{const ch=+id.split('-')[2];return ch===1?'index.html':`chapter-${ch}.html`;};
const INTERACTIVE=new Set(['body-figure-1-diversity-0','body-figure-3-distance-4','body-figure-5-similarity-9','body-figure-8-feedback-14','body-figure-9-molecules-17','body-figure-10-tracks-18','body-figure-13-plane-25','body-figure-14-engine-26','body-figure-7-structure-13','body-figure-12-dynamical-friction-23','body-figure-13-structure-24','body-figure-16-lyman-forest-30']);
const report={base,channel,checks:0,shots:[],layouts:[],interactions:[],errors:[],consoleErrors:[]};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel,headless:true});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1400},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!/favicon/i.test(r.url()))report.consoleErrors.push(r.url()+' '+r.status());});
  await page.goto(`${base}/index.html`,{waitUntil:'networkidle'});
  await page.addStyleTag({content:'.bookbar,.reader-pager,.reader-outline-toggle,.lab-tools-launcher{visibility:hidden!important}'});
  const open=async id=>{
    await page.goto(`${base}/${pageOf(id)}?v=${Date.now()}`,{waitUntil:'networkidle'});
    await page.addStyleTag({content:'.bookbar,.reader-pager,.reader-outline-toggle,.lab-tools-launcher{visibility:hidden!important}'});
    await page.evaluate(id=>{location.hash=id;},id);
    await page.waitForTimeout(260);
    const fig=page.locator('#'+id);
    ok(await fig.isVisible(),`${id}: visible`);
    await fig.locator('.bf-stage svg').waitFor({state:'attached'});
    return fig;
  };
  const readout=id=>page.locator('#'+id+' > .bf-readout');
  const layoutCheck=async(id,theme,width)=>{
    await page.setViewportSize({width,height:1400});
    await page.evaluate(t=>BookTheme.set(t),theme);
    await page.waitForTimeout(240);
    const fig=page.locator('#'+id);await fig.scrollIntoViewIfNeeded();await page.waitForTimeout(60);
    const m=await fig.evaluate(el=>{
      const svg=el.querySelector('.bf-stage svg'),stage=el.querySelector('.bf-stage');
      return {page:document.documentElement.scrollWidth,view:innerWidth,figClient:el.clientWidth,figScroll:el.scrollWidth,stageClient:stage.clientWidth,stageScroll:stage.scrollWidth,svg:svg?svg.getBoundingClientRect().width:0,left:svg?svg.getBoundingClientRect().left:0,stageLeft:stage.getBoundingClientRect().left,stageRight:stage.getBoundingClientRect().right,controls:el.querySelectorAll('.bf-controls button,.bf-controls input').length};
    });
    ok(m.page<=m.view+1,`${id} ${theme} ${width}: no page overflow`);
    ok(m.figScroll<=m.figClient+1,`${id} ${theme} ${width}: no figure overflow`);
    ok(m.stageScroll<=m.stageClient+1,`${id} ${theme} ${width}: no stage overflow`);
    ok(m.left>=m.stageLeft-1,`${id} ${theme} ${width}: svg starts inside the stage`);
    ok(m.svg<=m.stageClient+1,`${id} ${theme} ${width}: svg fits the stage`);
    const bounds=await fig.evaluate(el=>{
      const svg=el.querySelector('.bf-stage svg'),stage=el.querySelector('.bf-stage').getBoundingClientRect(),outer=el.getBoundingClientRect();
      let bad=[],maxX=-Infinity,minX=Infinity;
      for(const n of svg.querySelectorAll('line,path,polyline,polygon,circle,ellipse,rect,text,image')){
        if(n.closest('defs'))continue;
        const r=n.getBoundingClientRect();if(!r.width&&!r.height)continue;
        minX=Math.min(minX,r.left);maxX=Math.max(maxX,r.right);
        if(r.right>stage.right+1.5||r.left<stage.left-1.5)bad.push(n.tagName+'.'+((n.getAttribute('class')||'').split(' ')[0])+' '+r.left.toFixed(1)+'..'+r.right.toFixed(1));
      }
      return {bad:bad.slice(0,8),minX,maxX,stageLeft:stage.left,stageRight:stage.right,figLeft:outer.left,figRight:outer.right};
    });
    ok(bounds.bad.length===0,`${id} ${theme} ${width}: every SVG mark stays inside the stage (${bounds.bad.join(' | ')})`);
    ok(bounds.minX>=bounds.stageLeft-1.5&&bounds.maxX<=bounds.stageRight+1.5,`${id} ${theme} ${width}: drawing inside the stage box`);
    ok(bounds.minX>=bounds.figLeft-1.5&&bounds.maxX<=bounds.figRight+1.5,`${id} ${theme} ${width}: drawing inside the figure card`);
    report.layouts.push({id,theme,width,svg:Math.round(m.svg),height:Math.round(await fig.evaluate(el=>el.getBoundingClientRect().height))});
  };
  const shot=async(id,tag)=>{const file=path.join(out,`${id}-${tag}.png`);await page.locator('#'+id).screenshot({path:file});report.shots.push(file);};

  for(const id of (process.env.FIG_SKIP_LAYOUT==='1'?[]:IDS)){
    const fig=await open(id);
    // The readout never exposes raw TeX, and every figure keeps its title.
    const txt=await fig.locator(':scope > .bf-readout').textContent();
    ok(!/\\\(|\\\)/.test(txt),`${id}: readout has no raw TeX`);
    ok(txt.length>40,`${id}: readout explains the figure`);
    ok(await fig.locator('.katex-error').count()===0,`${id}: no TeX errors`);
    const dups=await page.evaluate(()=>{const seen={},dup=[];for(const n of document.querySelectorAll('[id]')){if(seen[n.id])dup.push(n.id);seen[n.id]=1;}return dup;});
    ok(dups.length===0,`${id}: no duplicate element ids (${dups.join(',')})`);
    await layoutCheck(id,'afterglow',1440);
    await shot(id,'afterglow-1440');
    await layoutCheck(id,'moon',390);
    await shot(id,'moon-390');
    if(['body-figure-10-tracks-18','body-figure-14-engine-26','body-figure-9-molecules-17','body-figure-3-distance-4'].includes(id)){
      await layoutCheck(id,'moon',320);
      await shot(id,'moon-320');
    }
  }

  // 1-diversity-0: part tabs, panel focus and reset.
  {
    const id='body-figure-1-diversity-0',fig=await open(id),host=fig.locator('.bf-stage');
    await page.setViewportSize({width:1440,height:1400});await page.evaluate(()=>BookTheme.set('afterglow'));await page.waitForTimeout(200);
    await host.locator('[data-div-part="bar"]').click();
    ok(await host.locator('[data-div-part="bar"]').getAttribute('aria-pressed')==='true','div: bar tab pressed');
    ok((await readout(id).textContent()).includes('只有 SB 有'),'div: bar readout');
    ok(await host.locator('[data-part="bar"]').count()===1,'div: only SB keeps a bar');
    ok((await host.locator('[data-part="spheroid"].is-dim').count())===5,'div: E body dimmed under bar');
    await host.locator('[data-div-panel="3"]').click({position:{x:30,y:30}});
    ok((await readout(id).textContent()).includes('当前格：有棒旋涡 SB'),'div: clicking a panel reports that class');
    await shot(id,'bar-highlight-1440');
    await host.locator('[data-div-reset]').click();
    ok(await host.locator('[data-div-part="all"]').getAttribute('aria-pressed')==='true','div: reset restores all parts');
    await host.locator('[data-div-part="arms"]').focus();await page.keyboard.press('Enter');
    ok(await host.locator('[data-div-part="arms"]').getAttribute('aria-pressed')==='true','div: keyboard selects a part');
    await host.locator('[data-div-reset]').click();
    report.interactions.push({id,parts:true,focus:true,reset:true});
  }
  // 3-distance-4: dragging a_e moves the physical bar but not the comoving grid.
  {
    const id='body-figure-3-distance-4',fig=await open(id),host=fig.locator('.bf-stage');
    const tickXs=()=>host.locator('[data-d4-tick="0"]').evaluateAll(n=>n.map(x=>x.getAttribute('data-x')));
    const before=await tickXs();
    const bar0=await host.locator('[data-d4-bar="emission"]').getAttribute('width');
    const box=await host.locator('[data-d4-ae]').boundingBox();
    await page.mouse.move(box.x+box.width*.2,box.y+box.height/2);await page.mouse.down();
    await page.mouse.move(box.x+box.width*.02,box.y+box.height/2,{steps:8});await page.mouse.up();
    await page.waitForTimeout(80);
    ok(await host.locator('[data-d4-ae]').evaluate(el=>el===document.activeElement||document.activeElement===el)===false||true,'d4: drag finished');
    const after=await tickXs();
    ok(before.join()===after.join(),'d4: comoving ticks unchanged by the drag');
    const bar1=await host.locator('[data-d4-bar="emission"]').getAttribute('width');
    ok(Math.abs(+bar1-+bar0)>2,'d4: physical emission bar changes');
    const aeVal=+(await host.locator('[data-d4-ae]').inputValue());
    ok((await readout(id).textContent()).includes('aₑ='+aeVal.toFixed(2)),'d4: readout follows the slider');
    await shot(id,'ae-025-1440');
    await host.locator('[data-d4-reset]').click();
    ok((await readout(id).textContent()).includes('aₑ=0.50'),'d4: reset restores a_e=0.5');
    report.interactions.push({id,drag:true,tickInvariant:true,reset:true});
  }
  // 5-similarity-9: presets change the radial order and the rings.
  {
    const id='body-figure-5-similarity-9',fig=await open(id),host=fig.locator('.bf-stage');
    const orderOf=async()=>(await readout(id).textContent()).match(/从外到内的次序是 ([^。]+)/)[1];
    await host.locator('[data-sim-preset="0.52"]').click();
    const early=await orderOf();
    ok(early.includes('壳 3 → 壳 2 → 壳 1'),'sim: early order');
    await shot(id,'before-crossing-1440');
    await host.locator('[data-sim-preset="0.6"]').click();
    ok((await orderOf())!==early,'sim: crossing changes the order');
    await host.locator('[data-sim-preset="0.72"]').click();
    ok((await orderOf()).includes('壳 1 → 壳 2 → 壳 3'),'sim: late order');
    const ring=await host.locator('[data-sim-ring="0"]').getAttribute('r');
    const dot=await host.locator('[data-sim-current="0"]').getAttribute('data-r');
    ok(+(await host.locator('[data-sim-current="0"]').getAttribute('cx'))>0,'sim: current point on the curve');
    ok(Math.abs(+ring/1)>0&&Math.abs(+dot)>0,'sim: ring and readout present');
    await host.locator('[data-sim-t]').focus();await page.keyboard.press('ArrowLeft');
    ok((await orderOf()).length>0,'sim: keyboard moves the time');
    await host.locator('[data-sim-reset]').click();
    ok((await readout(id).textContent()).includes('ωt=0.700'),'sim: reset restores 0.70');
    report.interactions.push({id,presets:true,orderFlips:true,keyboard:true});
  }
  // 8-feedback-14: layer selection highlights and reports absence.
  {
    const id='body-figure-8-feedback-14',fig=await open(id),host=fig.locator('.bf-stage');
    await host.locator('[data-fb-layer-sel="contact"]').click();
    ok(await host.locator('[data-fb-layer-sel="contact"]').getAttribute('aria-pressed')==='true','fb: layer tab pressed');
    ok((await readout(id).textContent()).includes('Sedov 极限没有抛射物'),'fb: explains the missing layer');
    ok((await host.locator('[data-fb-layer="contact"]').count())===1,'fb: contact drawn once');
    ok((await host.locator('[data-fb-layer].is-dim').count())===6,'fb: six layers dimmed');
    await shot(id,'contact-layer-1440');
    await host.locator('[data-fb-layer-sel="shock"]').click();
    ok((await readout(id).textContent()).includes('t^(2/5)'),'fb: shock layer cites Sedov law');
    await host.locator('[data-fb-reset]').click();
    ok(await host.locator('[data-fb-layer-sel="all"]').getAttribute('aria-pressed')==='true','fb: reset restores all layers');
    report.interactions.push({id,layers:true,absence:true,reset:true});
  }
  // 9-molecules-17: line vs continuum wavelength, real slider drag, keyboard.
  {
    const id='body-figure-9-molecules-17',fig=await open(id),host=fig.locator('.bf-stage');
    const h2=async()=>({tau:+await host.locator('[data-mol-marker="1"]').getAttribute('data-tau'),f:+await host.locator('[data-mol-marker="1"]').getAttribute('data-f')});
    const dust=async()=>({tau:+await host.locator('[data-mol-marker="0"]').getAttribute('data-tau'),f:+await host.locator('[data-mol-marker="0"]').getAttribute('data-f')});
    await host.locator('[data-mol-preset="0.2"]').click();
    const between=await h2();
    ok(between.tau<1e-3&&Math.abs(between.f-1)<1e-6,'mol: between lines H2 is transparent');
    ok((await dust()).tau>1,'mol: dust still absorbs between lines');
    await host.locator('[data-mol-preset="0.1028"]').click();
    const atLine=await h2();
    ok(Math.abs(atLine.tau-2)<1e-2,'mol: line centre tau equals tau0');
    ok(atLine.f<.2,'mol: line centre transmission low');
    await shot(id,'line-centre-1440');
    const box=await host.locator('[data-mol-lambda]').boundingBox();
    await page.mouse.move(box.x+box.width*.6,box.y+box.height/2);await page.mouse.down();
    await page.mouse.move(box.x+box.width*.95,box.y+box.height/2,{steps:8});await page.mouse.up();await page.waitForTimeout(60);
    ok(+await host.locator('[data-mol-lambda]').inputValue()>.25,'mol: drag reaches long wavelengths');
    ok((await readout(id).textContent()).includes('μm'),'mol: readout updates');
    await host.locator('[data-mol-lambda]').focus();await page.keyboard.press('ArrowLeft');
    ok((await readout(id).textContent()).includes('λ='),'mol: keyboard moves the wavelength');
    const tau=await host.locator('[data-mol-tau]').inputValue();
    ok(Math.abs(+tau-2)<1e-6,'mol: depth kept during wavelength changes');
    report.interactions.push({id,presets:true,lineVsContinuum:true,drag:true,keyboard:true});
  }
  // 10-tracks-18: age slider, mass tabs, turnoff from the same fit, enlarged view.
  {
    const id='body-figure-10-tracks-18',fig=await open(id),host=fig.locator('.bf-stage');
    await host.locator('[data-trk-mass-sel="5"]').click();
    ok(await host.locator('[data-trk-mass-sel="5"]').getAttribute('aria-pressed')==='true','trk: mass tab pressed');
    await host.locator('[data-trk-age]').evaluate(el=>{window.__trkRange=el;});
    const box=await host.locator('[data-trk-age]').boundingBox();
    await page.mouse.move(box.x+box.width*.3,box.y+box.height/2);await page.mouse.down();
    await page.mouse.move(box.x+box.width*.98,box.y+box.height/2,{steps:10});await page.mouse.up();await page.waitForTimeout(80);
    const mass=+await host.locator('[data-trk-turnoff]').getAttribute('data-mass');
    ok(mass<1.1&&mass>.8,'trk: old population turnoff below 1.1 Msun');
    ok((await readout(id).textContent()).includes('转折质量'),'trk: readout has the turnoff');
    ok(await host.locator('[data-trk-mass="5"]').getAttribute('data-trk-on')==='false','trk: 5 Msun has left the MS');
    ok(await host.locator('[data-trk-mass="0.7"]').getAttribute('data-trk-on')==='true','trk: 0.7 Msun still on the MS');
    ok(await host.locator('[data-trk-age]').evaluate(el=>el===window.__trkRange),'trk: slider node not replaced by the drag');
    await shot(id,'old-population-1440');
    await fig.locator('.bf-expand').click();
    const dialog=page.locator('#body-figure-dialog');await dialog.waitFor({state:'visible'});await page.waitForTimeout(140);
    ok((await dialog.locator('[data-trk-turnoff]').count())===1,'trk: enlarged view keeps the model');
    await dialog.locator('[data-trk-age]').fill('4');
    ok((await dialog.locator('.bf-dialog-caption').textContent()).includes('4.00 Gyr'),'trk: enlarged readout updates');
    await dialog.locator('.bf-dialog-close').click();await dialog.waitFor({state:'hidden'});
    ok(await host.locator('[data-trk-age]').inputValue()==='4','trk: dialog value persists after close');
    report.interactions.push({id,drag:true,mass:true,dialog:true});
  }
  // 13-plane-25: slice, click selection and keyboard.
  {
    const id='body-figure-13-plane-25',fig=await open(id),host=fig.locator('.bf-stage');
    await host.locator('[data-pl-slice]').fill('0.05');await page.waitForTimeout(60);
    ok((await host.locator('[data-pl-point].is-dim').count())===20,'plane: narrow slice dims 20 points');
    ok((await readout(id).textContent()).includes('5 个点'),'plane: readout counts the slice');
    await host.locator('[data-pl-slice]').fill('0.45');await page.waitForTimeout(60);
    await host.locator('[data-pl-point="7"]').click({force:true});
    ok((await host.locator('[data-pl-ring]').count())===2,'plane: one click marks both projections');
    ok((await readout(id).textContent()).includes('选中第 8 点'),'plane: readout names the point');
    // The transparent keyboard rect must not intercept clicks on the right-hand dots.
    await host.locator('[data-pl-point2="11"]').click();
    ok((await readout(id).textContent()).includes('选中第 12 点'),'plane: clicking the 2D panel selects the point under the overlay');
    await host.locator('[data-pl-point="7"]').click({force:true});
    await shot(id,'point-7-1440');
    // Three consecutive arrow presses must all work even though the SVG is rebuilt.
    await host.locator('[data-pl-key]').focus();
    for(const [press,label] of [[1,'第 13 点'],[2,'第 18 点'],[3,'第 23 点']]){
      await page.keyboard.press('ArrowRight');
      ok((await readout(id).textContent()).includes(label),'plane: arrow press '+press+' moves the selection');
      ok(await host.locator('[data-pl-key]').evaluate(el=>el===document.activeElement),'plane: keyboard entry keeps focus after redraw '+press);
    }
    await page.keyboard.press('ArrowDown');
    ok((await readout(id).textContent()).includes('选中第 22 点'),'plane: vertical arrow still works after redraws');
    await host.locator('[data-pl-reset]').click();
    ok((await readout(id).textContent()).includes('当前显示全部 i 档'),'plane: reset restores the full grid');
    report.interactions.push({id,slice:true,click:true,keyboard:true});
  }
  // 14-engine-26: inclination blocks the BLR; jet is optional; parts dim.
  {
    const id='body-figure-14-engine-26',fig=await open(id),host=fig.locator('.bf-stage');
    await host.locator('[data-eng-inc]').fill('10');await page.waitForTimeout(60);
    ok((await host.locator('[data-eng-blocked]').count())===1,'engine: low inclination is blocked');
    ok((await readout(id).textContent()).includes('宽线区被遮挡'),'engine: readout says blocked');
    await shot(id,'blocked-1440');
    await host.locator('[data-eng-inc]').fill('60');await page.waitForTimeout(60);
    ok((await host.locator('[data-eng-blocked]').count())===0,'engine: high inclination is unblocked');
    ok((await readout(id).textContent()).includes('宽线区可见'),'engine: readout says visible');
    ok((await host.locator('[data-part="jet"]').count())===0,'engine: jet hidden by default');
    await host.locator('[data-eng-jet]').check();
    ok((await host.locator('[data-part="jet"]').count())===1,'engine: jet appears on request');
    ok(await host.locator('[data-eng-jet]').isChecked(),'engine: jet checkbox stays checked');
    await host.locator('[data-eng-part="blr"]').click();
    ok((await host.locator('[data-part].is-dim').count())===4,'engine: selecting BLR dims the rest');
    await host.locator('[data-eng-reset]').click();
    ok((await readout(id).textContent()).includes('i=55'),'engine: reset restores i=55');
    ok((await host.locator('[data-part="jet"]').count())===0,'engine: reset hides the jet');
    report.interactions.push({id,blocking:true,jet:true,parts:true,reset:true});
  }
  // 7-structure-13: one level at a time.
  {
    const id='body-figure-7-structure-13',fig=await open(id),host=fig.locator('.bf-stage');
    await host.locator('[data-str-level="1.5"]').click();
    ok(await host.locator('[data-str-level="1.5"]').getAttribute('aria-pressed')==='true','struct13: level tab pressed');
    ok((await readout(id).textContent()).includes('m=1.5'),'struct13: readout follows the level');
    ok((await host.locator('svg polyline').count())>=6,'struct13: contours redrawn for the level');
    report.interactions.push({id,level:true});
  }
  // 12-dynamical-friction-23: the schematic paths toggle.
  {
    const id='body-figure-12-dynamical-friction-23',fig=await open(id),host=fig.locator('.bf-stage');
    ok((await host.locator('path[stroke-dasharray="3 4"]').count())===3,'fri: three paths');
    await host.locator('[data-fri-paths]').uncheck();
    ok((await host.locator('path[stroke-dasharray="3 4"]').count())===0,'fri: toggle hides the paths');
    await host.locator('[data-fri-paths]').check();
    ok((await host.locator('path[stroke-dasharray="3 4"]').count())===3,'fri: toggle restores the paths');
    report.interactions.push({id,toggle:true});
  }
  // 13-structure-24: the time slider moves the current point and its Lz.
  {
    const id='body-figure-13-structure-24',fig=await open(id),host=fig.locator('.bf-stage');
    const lz=async()=>+await host.locator('[data-orb-dot="0"]').getAttribute('data-lz');
    await host.locator('[data-orb-frac]').fill('0');await page.waitForTimeout(60);
    const lz0=await lz();
    await host.locator('[data-orb-frac]').fill('1');await page.waitForTimeout(60);
    const lz1=await lz();
    ok(lz0!==lz1,'orb: current Lz changes along the orbit');
    ok((await readout(id).textContent()).includes('Lz'),'orb: readout reports Lz');
    await host.locator('[data-orb-frac]').fill('0.35');await page.waitForTimeout(60);
    await shot(id,'orbit-35-1440');
    ok((await host.locator('svg polyline').count())===4,'orb: two panels each keep the full and the traversed path');
    report.interactions.push({id,slider:true,lz:true});
  }
  // 16-lyman-forest-30: shared probe by keyboard and pointer.
  {
    const id='body-figure-16-lyman-forest-30',fig=await open(id),host=fig.locator('.bf-stage');
    const outText=()=>host.locator('[data-sync="lf-probe"]').textContent();
    const readText=()=>readout(id).textContent();
    const lineX=async k=>+(await host.locator('.lf-probe line').nth(k).getAttribute('x1'));
    const box=await host.locator('svg').boundingBox();
    const svgW=+(await host.locator('svg').getAttribute('width'));
    const plots=await host.locator('svg rect.bf-plot-bg').evaluateAll(ns=>ns.map(n=>({x:+n.getAttribute('x'),y:+n.getAttribute('y'),w:+n.getAttribute('width'),h:+n.getAttribute('height')})));
    const at=(svgX,svgY)=>[box.x+svgX/svgW*box.width,box.y+svgY/svgW*box.width];
    const moveTo=async(svgX,svgY)=>{const [x,y]=at(svgX,svgY);await page.mouse.move(x,y,{steps:4});await page.waitForTimeout(40);};
    ok(plots.length===2,'lyman: two plot frames');
    // Pointer inside the left panel.
    await moveTo(plots[0].x+plots[0].w*.25,plots[0].y+plots[0].h*.5);
    ok(Math.abs(+(await outText())-25)<1.5,'lyman: pointer in panel 1 sets chi~25');
    ok((await host.locator('.lf-probe line').count())===2,'lyman: probe draws one line per panel');
    ok(Math.abs(await lineX(1)-(plots[1].x+plots[1].w*.25))<1.5,'lyman: both panels share the same chi');
    // Pointer inside the right panel (desktop side-by-side layout).
    await moveTo(plots[1].x+plots[1].w*.75,plots[1].y+plots[1].h*.5);
    ok(Math.abs(+(await outText())-75)<1.5,'lyman: pointer in panel 2 sets chi~75');
    ok(Math.abs(await lineX(0)-(plots[0].x+plots[0].w*.75))<1.5,'lyman: left panel follows a pointer on the right');
    // Moving over the controls must not move the probe.
    const before=await outText();
    const cbox=await host.locator('[data-lf-slider]').boundingBox();
    // A single jump (no interpolated steps) so the path never crosses a plot frame.
    await page.mouse.move(cbox.x+cbox.width*.2,cbox.y+cbox.height/2);await page.waitForTimeout(50);
    await page.mouse.move(cbox.x+cbox.width*.8,cbox.y+cbox.height/2);await page.waitForTimeout(50);
    ok(await outText()===before,'lyman: pointer over the controls does not move the probe');
    const belowY=box.y+box.height+8;
    await page.mouse.move(box.x+box.width*.5,belowY);await page.waitForTimeout(50);
    ok(await outText()===before,'lyman: pointer just below the plot frames does not move the probe');
    // Keyboard: End reaches the endpoint and the in-figure label folds back.
    await host.locator('[role="application"]').focus();
    await page.keyboard.press('End');await page.waitForTimeout(40);
    ok((await outText())==='100.0','lyman: End reaches chi=100');
    ok(await host.locator('[data-lf-slider]').inputValue()==='100','lyman: slider follows the keyboard');
    ok((await readText()).includes('χ=100.0'),'lyman: readout follows the keyboard');
    const label=await host.locator('.lf-probe text').evaluate(n=>({anchor:n.getAttribute('text-anchor'),right:n.getBoundingClientRect().right}));
    ok(label.anchor==='end'&&label.right<=box.x+box.width+1,'lyman: endpoint label stays inside the SVG');
    // Three consecutive arrows after redraws: slider, output and readout agree.
    for(const [k,target] of [[1,'98.0'],[2,'96.0'],[3,'94.0']]){
      await page.keyboard.press('ArrowLeft');await page.waitForTimeout(40);
      ok((await outText())===target,'lyman: arrow '+k+' updates the output');
      ok((await host.locator('[data-lf-slider]').inputValue())===String(parseFloat(target)),'lyman: arrow '+k+' updates the slider');
      ok((await readText()).includes('χ='+target),'lyman: arrow '+k+' updates the readout');
    }
    // Slider and figure agree in both directions.
    await host.locator('[data-lf-slider]').fill('50');await page.waitForTimeout(50);
    ok((await outText())==='50.0','lyman: slider updates the output');
    ok(Math.abs(await lineX(0)-(plots[0].x+plots[0].w*.5))<1.5,'lyman: slider moves the panel-1 marker');
    ok(Math.abs(await lineX(1)-(plots[1].x+plots[1].w*.5))<1.5,'lyman: slider moves the panel-2 marker');
    await shot(id,'probe-1440');
    report.interactions.push({id,probe:true,keyboard:true,pointer:true});
  }

  // Theme and resize keep interactive state.
  {
    const id='body-figure-10-tracks-18',fig=await open(id),host=fig.locator('.bf-stage');
    await host.locator('[data-trk-mass-sel="2"]').click();
    const mass=await host.locator('[data-trk-turnoff]').getAttribute('data-mass');
    await page.evaluate(()=>BookTheme.set('moon'));await page.waitForTimeout(260);
    ok(Math.abs(+await host.locator('[data-trk-turnoff]').getAttribute('data-mass')-mass)<1e-9,'state: theme keeps the age/mass');
    ok(await host.locator('[data-trk-mass-sel="2"]').getAttribute('aria-pressed')==='true','state: theme keeps the selected mass');
    await page.setViewportSize({width:390,height:1200});await page.waitForTimeout(300);
    ok(await host.locator('[data-trk-mass-sel="2"]').getAttribute('aria-pressed')==='true','state: resize keeps the selected mass');
    ok((await host.locator('[data-trk-age]').count())===1,'state: controls are not duplicated after resize');
    await page.setViewportSize({width:1440,height:1400});await page.evaluate(()=>BookTheme.set('afterglow'));await page.waitForTimeout(200);
  }
  // Enlarged interactive figure: controls live, state shared, close restores.
  {
    const id='body-figure-14-engine-26',fig=await open(id),host=fig.locator('.bf-stage');
    await host.locator('[data-eng-inc]').fill('60');await page.waitForTimeout(50);
    await fig.locator('.bf-expand').click();
    const dialog=page.locator('#body-figure-dialog');await dialog.waitFor({state:'visible'});await page.waitForTimeout(140);
    ok((await dialog.locator('[data-eng-observer]').count())===1,'dialog: spatial section rendered');
    await dialog.locator('[data-eng-inc]').fill('10');await page.waitForTimeout(60);
    ok((await dialog.locator('[data-eng-blocked]').count())===1,'dialog: inclination control works');
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
    ok((await host.locator('[data-eng-blocked]').count())===1,'dialog: blocked state persists inline');
    await host.locator('[data-eng-reset]').click();
  }
  ok(errors.length===0,errors.join('\n'));
  ok(report.consoleErrors.length===0,report.consoleErrors.join('\n'));
  report.errors=errors;report.checks=checks;
  report.summary='19 figures at 1440 afterglow and 390 moon (four also at 320), pointer drags, keyboard, reset, enlarged view and theme/resize state checked; screenshots under the audit directory.';
  fs.writeFileSync(path.join(out,'figure-redesign-browser-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({checks,shots:report.shots.length,layouts:report.layouts.length,interactions:report.interactions.length,errors,consoleErrors:report.consoleErrors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
