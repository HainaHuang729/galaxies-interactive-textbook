// Verify real legend nodes, styles, responsive layouts, SVG snapshots and artwork dialogs.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright');
const arts=require('../content/illustrations.json').images;
const out=path.join(os.tmpdir(),'galaxies-book-legends-20261019');fs.mkdirSync(out,{recursive:true});
const report={charts:[],artworks:[],dialogs:[],layouts:[],screenshots:[],errors:[]};
(async()=>{
 const browser=await chromium.launch({channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
 page.on('pageerror',e=>report.errors.push(e.message));
 const open=async id=>{await page.evaluate(id=>{location.hash=id},id);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 try{
  for(let chapter=1;chapter<=16;chapter++){
   const file=chapter===1?'index.html':`chapter-${chapter}.html`;
   await page.goto('http://127.0.0.1:8765/'+file);await page.waitForFunction(()=>document.body.classList.contains('reader-ready'));
   const charts=await page.evaluate(()=>[...document.querySelectorAll('svg.chart')].filter(n=>BookCharts.inspect(n)?.series.length).map(n=>({id:n.id,target:n.closest('.reader-slide').dataset.pageTarget})));
   for(const theme of ['afterglow','moon'])for(const width of [1440,390,320]){
    await page.setViewportSize({width,height:1100});await page.evaluate(t=>BookTheme.set(t),theme);
    // Chapter renderers intentionally debounce viewport redraws by 100–150ms.
    await page.waitForTimeout(220);
    for(const chart of charts){
     await open(chart.target);
     const state=await page.evaluate(id=>{
      const n=document.getElementById(id),f=BookCharts.inspect(n),items=[...f.legend.querySelectorAll(':scope > [data-legend-series]')];
      return {series:f.series.map(s=>s.label),keys:items.map(x=>({label:x.dataset.legendLabel,matched:x.dataset.legendMatched,svg:!!x.querySelector('svg'),font:+parseFloat(getComputedStyle(x).fontSize),w:x.getBoundingClientRect().width})),visible:!!f.legend.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth+1,mathErrors:n.closest('.reader-slide').querySelectorAll('.katex-error').length};
     },chart.id);
     assert.equal(state.keys.length,state.series.length,chart.id+': all series have a key');
     state.keys.forEach((key,i)=>{assert.equal(key.label,state.series[i]);assert.equal(key.matched,'true',chart.id+': key matches a drawn shape');assert.ok(key.svg&&key.font>=12&&key.w<=width,chart.id+': readable key');});
     assert.ok(state.visible&&!state.overflow&&!state.mathErrors,`${chart.id} ${theme} ${width}: ${JSON.stringify(state)}`);
     report.layouts.push({chapter,id:chart.id,theme,width,series:state.series.length});
     if(theme==='afterglow'&&width===1440)report.charts.push({chapter,id:chart.id,series:state.series});
    }
    for(const art of arts.filter(a=>a.page===file)){
     await open('illustration-'+art.id);
     // Cover artwork uses the existing chapter-art ID.
     const id=art.placement==='body'?'illustration-'+art.id:'chapter-art';
     await open(id);
     const figure=page.locator('#'+id);
     const state=await figure.evaluate(n=>({visible:!!n.getBoundingClientRect().height,items:n.querySelectorAll('.illustration-legend-item').length,font:parseFloat(getComputedStyle(n.querySelector('.illustration-legend-item')).fontSize),overflow:document.documentElement.scrollWidth>innerWidth+1,image:n.querySelector('img').complete&&n.querySelector('img').naturalWidth>0,legendOverflow:n.querySelector('.illustration-legend').scrollWidth>n.querySelector('.illustration-legend').clientWidth+1}));
     assert.equal(state.items,art.legend.items.length,art.id+': all legend explanations');assert.ok(state.visible&&state.image&&state.font>=12&&!state.overflow&&!state.legendOverflow,art.id+': artwork layout');
     report.artworks.push({chapter,id:art.id,theme,width,items:state.items});
     if(theme==='moon'&&width===320){
      await figure.locator('.illustration-open').click();
      const dialog=page.locator('#illustration-dialog');await dialog.waitFor({state:'visible'});
      const d=await dialog.evaluate(n=>({items:n.querySelectorAll('.illustration-legend-item').length,source:n.querySelector('.illustration-dialog-provenance').textContent,scroll:n.querySelector('.illustration-dialog-image').scrollWidth>n.querySelector('.illustration-dialog-image').clientWidth,overflow:document.documentElement.scrollWidth>innerWidth+1}));
      assert.equal(d.items,art.legend.items.length);assert.ok(d.source.includes(art.generator)&&!d.overflow,art.id+': source and dialog legend');
      if(art.format==='svg'){assert.ok(d.scroll,art.id+': mobile vector view pans');await dialog.locator('.illustration-dialog-image').screenshot({path:path.join(out,art.id+'-mobile-detail.png')});report.screenshots.push(art.id+'-mobile-detail.png');}
      await dialog.locator('.illustration-dialog-close').click();
      assert.ok(await figure.locator('.illustration-open').evaluate(n=>document.activeElement===n),art.id+': focus returns');
      report.dialogs.push({id:art.id,theme,width});
     }
     if(theme==='afterglow'&&width===1440){const hide=await page.addStyleTag({content:'.reader-pager,.lab-tools-launcher{visibility:hidden!important}'});await figure.locator('.illustration-legend').screenshot({path:path.join(out,art.id+'-legend.png')});await hide.evaluate(n=>n.remove());report.screenshots.push(art.id+'-legend.png');}
    }
   }
  }
  // Actual key colors/dashes are copied from the rendered paths, then follow theme changes.
  for(const theme of ['afterglow','moon']){
   await page.goto('http://127.0.0.1:8765/chapter-13.html#anisotropy-lab');await page.evaluate(t=>BookTheme.set(t),theme);await open('anisotropy-lab');
   const keys=await page.evaluate(()=>{const n=document.getElementById('anisotropy-chart'),f=BookCharts.inspect(n);return [...f.legend.querySelectorAll(':scope > span')].map((item,i)=>{const key=item.querySelector('svg line'),curve=n.querySelector(`[data-plot-series="${i}"]`);return {color:key.getAttribute('stroke'),dash:key.getAttribute('stroke-dasharray'),realColor:getComputedStyle(curve).stroke,realDash:getComputedStyle(curve).strokeDasharray};});});
   for(const k of keys){assert.equal(k.color,k.realColor);assert.equal(k.dash,k.realDash);}
   await page.getByRole('button',{name:'固定当前曲线',exact:true}).click();
   assert.equal(await page.locator('#anisotropy-lab .scientific-legend-reference').count(),1);
   await page.locator('#anisotropy-beta').fill('0.3');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));
   assert.equal(await page.locator('#anisotropy-lab .scientific-legend-reference').count(),1,'pinned key survives redraw');
   const snapshot=await page.evaluate(()=>{const n=document.getElementById('anisotropy-chart'),s=BookCharts.snapshot(n);return {text:s.textContent,height:+s.getAttribute('height'),original:n.viewBox.baseVal.height};});
   assert.ok(snapshot.text.includes('参考')&&snapshot.text.includes('已固定')&&snapshot.height>snapshot.original,'zoom/export snapshot contains legends');
   await page.getByRole('button',{name:'清除参照曲线',exact:true}).click();assert.equal(await page.locator('.scientific-legend-reference').count(),0);
  }
  // Equal numerical curves retain their separate physical identities and colors.
  await page.goto('http://127.0.0.1:8765/chapter-8.html#thermal-conduction-lab');await open('thermal-conduction-lab');
  await page.locator('#thermal-conduction-diffusion').fill('0');
  const coincident=await page.evaluate(()=>{const n=document.getElementById('thermal-conduction-chart'),f=BookCharts.inspect(n),keys=[...f.legend.querySelectorAll(':scope > span')];return keys.map((key,i)=>({color:key.querySelector('svg line').getAttribute('stroke'),actual:getComputedStyle([...n.querySelectorAll('path')].find(p=>p.__data__===f.series[i].source)).stroke}));});
  assert.equal(coincident.length,2);coincident.forEach(k=>assert.equal(k.color,k.actual));assert.notEqual(coincident[0].color,coincident[1].color);
  report.coincidentCurves='thermal conduction at zero diffusion: both physical series keep their actual colors';
  assert.equal(report.charts.length,115);assert.equal(report.artworks.length,19*6);assert.equal(report.dialogs.length,19);assert.deepEqual(report.errors,[]);
  report.summary={chapters:16,charts:report.charts.length,series:report.charts.reduce((n,c)=>n+c.series.length,0),chartLayouts:report.layouts.length,illustrations:19,illustrationLayouts:report.artworks.length,dialogs:report.dialogs.length};
  fs.writeFileSync(path.join(out,'browser-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
