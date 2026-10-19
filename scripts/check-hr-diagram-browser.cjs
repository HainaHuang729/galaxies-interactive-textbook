// Focused browser check for the chapter-2 H-R diagram.
// Run with a local server: node scripts/check-hr-diagram-browser.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BOOK_BASE_URL||'http://127.0.0.1:8765';
const channel=process.env.PLAYWRIGHT_CHROMIUM_CHANNEL||'msedge';
const out=path.resolve(process.env.HR_AUDIT_DIR||path.join(os.tmpdir(),'galaxies-hr-figure-20261018'));
const SUN_T=5772;
let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++;};
const near=(actual,expected,tolerance,message)=>ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${message}: ${actual} != ${expected}`);
function parsePathPoints(d){
  return d.split(/(?=M|L)/).filter(Boolean).map(part=>{
    const [x,y]=part.slice(1).split(',').map(Number);
    return {x,y};
  });
}
function inverse(point,map){
  const logT=map.logtMax-(point.x-map.left)/map.plotWidth*(map.logtMax-map.logtMin);
  const logL=map.loglMax-(point.y-map.top)/map.plotHeight*(map.loglMax-map.loglMin);
  return {logT,logL,T:10**logT,L:10**logL};
}
(async()=>{
  fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({channel,headless:true});
  const report={base,channel,checks,shots:[],layouts:[],themes:[],errors:[]};
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1200},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/chapter-2.html#body-figure-2-stars-3`,{waitUntil:'networkidle'});
    await page.addStyleTag({content:'.bookbar,.reader-pager,.reader-outline-toggle{display:none!important}'});
    const figure=page.locator('#body-figure-2-stars-3'),host=figure.locator('.bf-stage');
    await host.locator('.hr-controls').waitFor();
    await page.waitForFunction(()=>document.querySelector('#body-figure-2-stars-3 .hr-diagram'));

    // Inventory, same-size points and absence of a tab stop per star.
    const inventory=await host.evaluate(el=>{
      const points=[...el.querySelectorAll('[data-hr-star]')];
      const counts={};for(const point of points)counts[point.dataset.hrStar]=(counts[point.dataset.hrStar]||0)+1;
      return {count:points.length,counts,radii:[...new Set(points.map(point=>point.getAttribute('r')))],tabStops:points.filter(point=>point.hasAttribute('tabindex')).length,labels:[...el.querySelectorAll('.hr-type-label')].map(label=>label.textContent)};
    });
    ok(inventory.count===170,`170 synthetic teaching points, got ${inventory.count}`);
    ok(inventory.counts.main===100&&inventory.counts.giant===40&&inventory.counts.dwarf===30,'declared type counts match points');
    ok(inventory.radii.length===1,'all synthetic points have one identical marker size');
    ok(inventory.tabStops===0,'individual synthetic points create no tab stops');
    ok(inventory.labels.includes('主序')&&inventory.labels.includes('巨星')&&inventory.labels.includes('白矮星'),'all three type labels exist');
    ok((await figure.locator(':scope > .bf-readout').getAttribute('aria-live'))==='polite','dynamic readout is an aria-live status');
    ok((await figure.locator(':scope > .bf-readout').getAttribute('data-no-math'))!==null,'dynamic readout is excluded from automatic math reprocessing');
    const initialReadout=await figure.locator(':scope > .bf-readout').textContent();
    ok(initialReadout.includes('L/L☉=(R/R☉)²(T/5772 K)⁴'),'formula remains plain readable text in the live readout');
    ok((await figure.locator('.katex-error').count())===0,'figure contains no TeX rendering errors');

    const map=await page.evaluate(()=>{
      const root=document.querySelector('#body-figure-2-stars-3 [data-hr-chart]');
      return {left:+root.dataset.hrLeft,top:+root.dataset.hrTop,plotWidth:+root.dataset.hrPlotWidth,plotHeight:+root.dataset.hrPlotHeight,logtMin:+root.dataset.hrLogtMin,logtMax:+root.dataset.hrLogtMax,loglMin:+root.dataset.hrLoglMin,loglMax:+root.dataset.hrLoglMax,sunT:+root.dataset.hrSunT};
    });
    near(map.logtMin,Math.log10(2500),1e-6,'declared hot-axis limit');
    near(map.logtMax,Math.log10(40000),1e-6,'declared cool-axis limit');
    const xOf=(logT)=>map.left+(map.logtMax-logT)/(map.logtMax-map.logtMin)*map.plotWidth;
    const yOf=(logL)=>map.top+(map.loglMax-logL)/(map.loglMax-map.loglMin)*map.plotHeight;

    // Temperature decreases to the right, and the solar reference sits at (5772 K, 1 Lsun).
    const ticks=await host.locator('[data-hr-temp-tick]').evaluateAll(nodes=>nodes.map(node=>({T:+node.dataset.hrTempTick,x:+node.getAttribute('x')})));
    const x30=ticks.find(t=>t.T===30000).x,x10=ticks.find(t=>t.T===10000).x,x25=ticks.find(t=>t.T===2500).x;
    ok(x30<x10&&x10<x25,'surface-temperature axis decreases from left to right');
    near(x30,xOf(Math.log10(30000)),.02,'30,000 K tick uses the declared log projection');
    near(x10,xOf(Math.log10(10000)),.02,'10,000 K tick uses the declared log projection');
    near(x25,xOf(Math.log10(2500)),.02,'2,500 K tick uses the declared log projection');
    const band=await page.evaluate(()=>{
      const gradient=[...document.querySelectorAll('#body-figure-2-stars-3 linearGradient')].find(node=>node.id.endsWith('-temperature'));
      const rgb=value=>(value||'').match(/\d+/g)?.map(Number)||[];
      const stops=[...gradient.querySelectorAll('stop')];
      return {first:rgb(stops[0].getAttribute('stop-color')),last:rgb(stops.at(-1).getAttribute('stop-color')),count:stops.length};
    });
    ok(band.count>=2&&band.first[2]>band.first[0]&&band.last[0]>band.last[2],'temperature-colour band runs hot/blue on the left to cool/red on the right');
    ok((await host.locator('[marker-end]').count())===0,'no evolution arrows are drawn between regions');
    const sun=await host.locator('[data-hr-sun]').evaluate(group=>{const halo=group.querySelector('.hr-sun-halo');return {T:+group.dataset.t,cx:+halo.getAttribute('cx'),cy:+halo.getAttribute('cy')};});
    ok(sun.T===SUN_T,'solar marker declares 5772 K');
    near(sun.cx,xOf(Math.log10(SUN_T)),.02,'solar x position');
    near(sun.cy,yOf(0),.02,'solar luminosity is unity');
    ok((await host.locator('.hr-sun-sub').first().textContent()).includes('5772'),'solar temperature labelled in figure');

    // Equal-radius curves are read back from the rendered path, then checked independently.
    const iso=await host.locator('[data-hr-isoradius]').evaluateAll(nodes=>nodes.map(node=>({R:+node.dataset.hrIsoradius,d:node.getAttribute('d')})));
    ok(iso.length===5,'five iso-radius curves are rendered');
    for(const line of iso){
      const points=parsePathPoints(line.d);
      ok(points.length>2,`iso-radius R=${line.R} has a drawn segment`);
      for(const point of [points[0],points[points.length-1]]){
        const inv=inverse(point,map),lhs=2*Math.log10(line.R)+4*(inv.logT-Math.log10(SUN_T)),rhs=inv.logL;
        near(rhs,lhs,2e-3,`rendered iso-radius R=${line.R} follows L=R²(T/5772K)⁴`);
      }
    }
    const solarIso=iso.find(line=>line.R===1);
    ok(parsePathPoints(solarIso.d).some(point=>Math.abs(point.x-xOf(Math.log10(SUN_T)))<2),'R=1 R_sun curve passes through the solar temperature');

    const readout=()=>figure.locator(':scope > .bf-readout').textContent();
    // Type highlighting is a single-selection control and its readout uses the same counts.
    for(const [key,label,count] of [['main','主序',100],['giant','巨星',40],['dwarf','白矮星',30]]){
      const button=host.locator(`[data-hr-group="${key}"]`);await button.click();
      ok((await button.getAttribute('aria-pressed'))==='true',`${label} button is pressed`);
      const active=await page.evaluate(key=>{
        const groups=[...document.querySelectorAll('#body-figure-2-stars-3 [data-hr-type-group]')];
        return groups.map(group=>({type:group.dataset.hrTypeGroup,on:group.classList.contains('is-on'),off:group.classList.contains('is-off')}));
      },key);
      ok(active.find(group=>group.type===key).on&&active.filter(group=>group.type!==key).every(group=>group.off),`${label} is highlighted and other bands are dimmed`);
      ok((await readout()).includes(`已高亮${label}：${count} 个合成点`),`${label} readout count equals rendered point count`);
      ok(await page.evaluate(key=>document.activeElement?.dataset.hrGroup===key,key),`${label} control keeps keyboard focus after highlight redraw`);
    }
    await host.locator('[data-hr-group="all"]').click();
    ok((await readout()).includes('当前显示全部三类合成教学分布'),'all-types view restores the full readout');

    // Same-temperature comparison: markers, y positions, cards and readout share one calculation.
    const compareBox=host.locator('[data-hr-compare]');
    ok(!(await host.locator('.hr-compare-panel').isVisible()),'comparison readings stay hidden while comparison is off');
    ok((await host.locator('[data-hr-comparison]').count())===0,'no comparison markers while comparison is off');
    await compareBox.check();
    ok(await host.locator('.hr-compare-panel').isVisible(),'comparison panel opens with the switch');
    ok((await host.locator('[data-hr-comparison]').count())===3,'three fixed-radius comparison markers');
    const temperatures=[3500,5772,10000];
    for(const T of temperatures){
      const range=host.locator('[data-hr-temperature]');await range.fill(String(T));await page.waitForTimeout(30);
      const data=await host.evaluate(()=>{
        const sun=document.querySelector('#body-figure-2-stars-3 [data-hr-sun] .hr-sun-halo');
        const markers=[...document.querySelectorAll('#body-figure-2-stars-3 [data-hr-comparison]')].map(marker=>{
          const ring=marker.querySelector('.hr-comparison-ring');
          return {R:+marker.dataset.radius,T:+marker.dataset.temperature,L:+marker.dataset.luminosity,cx:+ring.getAttribute('cx'),cy:+ring.getAttribute('cy')};
        });
        const cards=[...document.querySelectorAll('#body-figure-2-stars-3 [data-hr-reading]')].map(card=>({R:+card.dataset.hrReading,L:+card.querySelector('[data-hr-luminosity]').dataset.hrLuminosity,text:card.textContent}));
        return {markers,cards,sun:{cx:+sun.getAttribute('cx'),cy:+sun.getAttribute('cy')}};
      });
      ok(data.markers.length===3,`T=${T} has three comparison markers`);
      ok(data.markers.every(marker=>marker.T===T&&Math.abs(marker.cx-data.markers[0].cx)<1e-9),`T=${T} markers share one temperature and x position`);
      ok(new Set(data.markers.map(marker=>marker.R)).size===3,`T=${T} markers use three distinct radii`);
      for(const marker of data.markers){
        const expected=marker.R**2*(T/SUN_T)**4;
        near(marker.L,expected,1e-8,`T=${T}, R=${marker.R} luminosity`);
        near(marker.cx,xOf(Math.log10(T)),.02,`T=${T} marker x`);
        near(marker.cy,yOf(Math.log10(marker.L)),.02,`T=${T}, R=${marker.R} marker y`);
        const card=data.cards.find(item=>item.R===marker.R);
        ok(card&&Math.abs(card.L-marker.L)<1e-7,`T=${T}, R=${marker.R} card uses marker value`);
      }
      if(T===SUN_T){const solar=data.markers.find(marker=>marker.R===1);near(solar.cx,data.sun.cx,.02,'solar-radius comparison coincides with Sun x');near(solar.cy,data.sun.cy,.02,'solar-radius comparison coincides with Sun y');}
    }
    ok((await readout()).includes('同温 T=10,000 K'),'readout reports the same comparison temperature');
    ok((await readout()).includes('三个环标与这三项读数来自同一个黑体关系'),'readout states the shared source');
    await host.locator('[data-hr-temperature]').evaluate(el=>{window.__hrRange=el;});
    const box=await host.locator('[data-hr-temperature]').boundingBox();
    await page.mouse.move(box.x+box.width*.32,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.72,box.y+box.height/2,{steps:14});await page.mouse.up();
    ok(await host.locator('[data-hr-temperature]').evaluate(el=>el===window.__hrRange),'dragging the slider does not replace the input node');
    ok(+await host.locator('[data-hr-temperature]').inputValue()>3500,'continuous slider drag updates the temperature');
    ok((await host.locator('[data-hr-comparison]').count())===3,'continuous slider drag keeps three linked markers');
    await host.locator('[data-hr-temperature]').focus();const before=+await host.locator('[data-hr-temperature]').inputValue();await page.keyboard.press('ArrowRight');ok(+await host.locator('[data-hr-temperature]').inputValue()===Math.min(10000,before+1),'temperature slider supports keyboard arrows');
    await compareBox.uncheck();
    ok((await host.locator('[data-hr-comparison]').count())===0,'markers disappear when comparison is switched off');
    ok(!(await host.locator('.hr-compare-panel').isVisible()),'readings hide with comparison markers');
    ok((await host.locator('.hr-hint').isVisible()),'hint is visible when comparison is off');
    ok(!(await readout()).includes('同温 T='),'readout no longer reports a comparison temperature');

    // Sun location and the single reset action.
    const sunButton=host.locator('[data-hr-sun-locate]');await sunButton.click();
    ok((await sunButton.getAttribute('aria-pressed'))==='true','locate-Sun control is pressed');
    ok((await page.evaluate(()=>document.querySelector('#body-figure-2-stars-3 [data-hr-chart]').dataset.hrSunFocus))==='true','chart enters solar-focus state');
    ok((await host.locator('.hr-sun-guide').count())===2,'solar focus draws two guide lines');
    ok((await readout()).includes('已定位太阳：T=5772 K，L/L☉=1'),'solar-focus readout states the reference');
    await host.locator('[data-hr-reset]').click();
    ok((await host.locator('[data-hr-group="all"]').getAttribute('aria-pressed'))==='true','reset restores all types');
    ok(!(await host.locator('[data-hr-compare]').isChecked()),'reset disables comparison');
    ok((await host.locator('[data-hr-sun-locate]').getAttribute('aria-pressed'))==='false','reset clears solar focus');
    ok((await host.locator('.hr-sun-guide').count())===0,'reset removes solar guide lines');
    ok((await readout()).includes('当前显示全部三类合成教学分布'),'reset restores the default readout');

    // Keyboard operation of each native control.
    const mainButton=host.locator('[data-hr-group="main"]');await mainButton.focus();await page.keyboard.press('Enter');
    ok((await mainButton.getAttribute('aria-pressed'))==='true','type control works with Enter');
    const compare2=host.locator('[data-hr-compare]');await compare2.focus();await page.keyboard.press('Space');
    ok(await compare2.isChecked(),'comparison switch works with Space');
    const range2=host.locator('[data-hr-temperature]');await range2.focus();const keyboardStart=+await range2.inputValue();await page.keyboard.press('ArrowLeft');
    ok(+await range2.inputValue()===Math.max(3500,keyboardStart-1),'comparison slider works with arrow keys');
    await host.locator('[data-hr-reset]').click();

    // Themes and responsive redraw keep state and controls alive.
    await compareBox.check();await host.locator('[data-hr-temperature]').fill('5000');await sunButton.click();await host.locator('[data-hr-group="main"]').click();
    const backgrounds={};
    for(const theme of ['afterglow','moon'])for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:1100});
      await page.evaluate(theme=>BookTheme.set(theme),theme);
      await page.waitForTimeout(280);
      await figure.scrollIntoViewIfNeeded();await page.waitForTimeout(80);
      const layout=await figure.evaluate(el=>{
        const svg=el.querySelector('.hr-diagram'),stage=el.querySelector('.bf-stage'),note=el.querySelector('.hr-note');
        const cs=getComputedStyle(svg);
        const resolve=(property,value)=>{const probe=document.createElement('span');probe.style[property]=`var(${value})`;document.body.append(probe);const out=getComputedStyle(probe)[property];probe.remove();return out;};
        return {pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,figureClient:el.clientWidth,figureScroll:el.scrollWidth,stageClient:stage.clientWidth,stageScroll:stage.scrollWidth,svgLeft:svg.getBoundingClientRect().left,svgRight:svg.getBoundingClientRect().right,stageLeft:stage.getBoundingClientRect().left,stageRight:stage.getBoundingClientRect().right,bg:cs.backgroundColor,expectedBg:resolve('backgroundColor','--subtle'),noteFill:getComputedStyle(note).fill,expectedMuted:resolve('color','--muted'),buttons:[...el.querySelectorAll('.hr-controls button')].map(button=>button.getBoundingClientRect().height)};
      });
      ok(layout.pageWidth<=layout.viewport+1,`${theme} ${width}px has no page horizontal overflow`);
      ok(layout.figureScroll<=layout.figureClient+1,`${theme} ${width}px figure has no horizontal overflow`);
      ok(layout.stageScroll<=layout.stageClient+1,`${theme} ${width}px stage has no horizontal overflow`);
      ok(layout.svgRight<=layout.stageRight+1&&layout.svgLeft>=layout.stageLeft-1,`${theme} ${width}px SVG stays in stage`);
      ok(layout.bg===layout.expectedBg,`${theme} ${width}px chart uses the theme surface`);
      ok(layout.noteFill===layout.expectedMuted,`${theme} ${width}px muted SVG labels use the theme text color`);
      ok(layout.buttons.every(height=>height>=44),`${theme} ${width}px all buttons are touch-sized`);
      backgrounds[`${theme}-${width}`]=layout.bg;
      ok(await host.locator('[data-hr-comparison]').count()===3,`${theme} ${width}px comparison markers survive redraw`);
      ok(await host.locator('[data-hr-group="main"]').getAttribute('aria-pressed')==='true',`${theme} ${width}px type highlight survives redraw`);
      ok((await host.locator('[data-hr-sun-locate]').getAttribute('aria-pressed'))==='true',`${theme} ${width}px Sun focus survives redraw`);
      await page.waitForFunction(()=>document.fonts.status==='loaded');
      const shot=path.join(out,`hr-${theme}-${width}.png`);await figure.screenshot({path:shot});report.shots.push(shot);
      report.layouts.push({theme,width,height:await figure.evaluate(el=>el.getBoundingClientRect().height),background:layout.bg});
      await host.locator('[data-hr-group="giant"]').click();
      ok((await host.locator('[data-hr-group="giant"]').getAttribute('aria-pressed'))==='true',`${theme} ${width}px re-bound type control still works`);
      await host.locator('[data-hr-group="main"]').click();
      ok((await host.locator('[data-hr-group="main"]').getAttribute('aria-pressed'))==='true',`${theme} ${width}px type state can be restored after redraw`);
      if(width===1440&&theme==='afterglow'||width===320&&theme==='moon'){
        await figure.locator('.bf-expand').click();
        const dialog=page.locator('#body-figure-dialog');await dialog.waitFor({state:'visible'});await page.waitForTimeout(120);
        ok((await dialog.locator('[data-hr-comparison]').count())===3,`${theme} ${width}px enlarged view keeps comparison markers`);
        const dlg=await dialog.evaluate(el=>({open:el.open,scroll:el.scrollWidth,client:el.clientWidth,stage:el.querySelector('.bf-dialog-stage').clientWidth,svg:el.querySelector('.hr-diagram').getBoundingClientRect().width,title:el.querySelector('h2').textContent}));
        ok(dlg.open&&dlg.title.includes('赫罗图'),`${theme} ${width}px enlarged view opens with title`);
        ok(dlg.svg<=dlg.stage+1&&dlg.scroll<=dlg.client+1,`${theme} ${width}px enlarged chart does not overflow`);
        const dialogCaption=await dialog.locator('.bf-dialog-caption').textContent();
        ok(dialogCaption.includes('合成教学点')&&dialogCaption.includes('L/L☉=(R/R☉)²(T/5772 K)⁴'),`${theme} ${width}px enlarged readout keeps the source note and formula`);
        ok((await dialog.locator('.katex-error').count())===0,`${theme} ${width}px enlarged readout has no TeX errors`);
        const dshot=path.join(out,`hr-dialog-${theme}-${width}.png`);await dialog.screenshot({path:dshot});report.shots.push(dshot);
        if(width===1440){
          await dialog.locator('[data-hr-temperature]').fill('6200');
          ok((await dialog.locator('.bf-dialog-caption').textContent()).includes('6,200 K'),'enlarged readout updates with the selected comparison temperature');
          await dialog.locator('.bf-dialog-close').click();
          await dialog.waitFor({state:'hidden'});
          ok(await host.locator('[data-hr-temperature]').inputValue()==='6200','dialog change persists to the inline figure after close button');
          ok((await host.locator('[data-hr-comparison]').count())===3,'dialog close leaves the comparison intact');
        }else{
          await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
          ok(await host.locator('[data-hr-comparison]').count()===3,'Escape closes the enlarged figure and preserves state');
        }
        await figure.scrollIntoViewIfNeeded();
      }
    }
    ok(backgrounds['afterglow-1440']!==backgrounds['moon-1440'],'the two themes produce distinct chart surfaces');
    report.themes=Object.entries(backgrounds).map(([key,bg])=>({key,bg}));

    // One unobstructed all-types view for visual review.
    await page.setViewportSize({width:1440,height:1200});await page.evaluate(()=>BookTheme.set('afterglow'));await page.waitForTimeout(220);
    await host.locator('[data-hr-reset]').click();await host.locator('[data-hr-compare]').check();await host.locator('[data-hr-sun-locate]').click();
    await figure.scrollIntoViewIfNeeded();await page.waitForTimeout(100);
    const allShot=path.join(out,'hr-all-types-afterglow-1440.png');await figure.screenshot({path:allShot});report.shots.push(allShot);
    ok((await host.locator('[data-hr-group="all"]').getAttribute('aria-pressed'))==='true','all-types review screenshot starts from the default highlight');

    // Touch: tap through type, comparison and reset on a real touch-enabled viewport.
    const touchContext=await browser.newContext({viewport:{width:390,height:900},hasTouch:true,reducedMotion:'reduce'});
    const touch=await touchContext.newPage();const touchErrors=[];touch.on('pageerror',error=>touchErrors.push(error.message));
    await touch.goto(`${base}/chapter-2.html#body-figure-2-stars-3`,{waitUntil:'networkidle'});await touch.locator('#body-figure-2-stars-3 .hr-controls').waitFor();
    const touchHost=touch.locator('#body-figure-2-stars-3 .bf-stage');
    await touchHost.locator('[data-hr-group="giant"]').tap();
    ok((await touchHost.locator('[data-hr-group="giant"]').getAttribute('aria-pressed'))==='true','touch tap highlights a type');
    await touchHost.locator('[data-hr-compare]').tap();
    ok(await touchHost.locator('[data-hr-comparison]').count()===3,'touch tap enables linked comparison markers');
    await touchHost.locator('[data-hr-sun-locate]').tap();
    ok((await touchHost.locator('[data-hr-sun-locate]').getAttribute('aria-pressed'))==='true','touch tap locates the Sun');
    await touchHost.locator('[data-hr-reset]').tap();
    ok((await touchHost.locator('[data-hr-group="all"]').getAttribute('aria-pressed'))==='true','touch tap resets the figure');
    ok(touchErrors.length===0,touchErrors.join('\n'));
    await touchContext.close();

    ok(errors.length===0,errors.join('\n'));
    report.errors=errors;report.checks=checks;report.points=inventory.count;report.screenshots=report.shots;
    report.summary='Axes, solar anchor, rendered iso-radius paths, synthetic distributions, shared comparison readouts, type/Sun/reset controls, pointer and keyboard manipulation, both themes, 1440/390/320 layouts, and enlarged close paths checked.';
    fs.writeFileSync(path.join(out,'hr-figure-browser-report.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({checks,points:inventory.count,screenshots:report.shots,layouts:report.layouts,errors}));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
