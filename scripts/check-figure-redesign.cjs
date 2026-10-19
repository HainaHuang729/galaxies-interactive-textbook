// Model-level checks for the 19 redesigned body figures.
// Pure SVG output plus the declared analytic models; no browser required.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const A=require('../dist/assets/advanced-physics.js');
const context={window:{AdvancedPhysics:A},console};vm.createContext(context);
vm.runInContext(read('dist/assets/body-figure-geometry.js'),context);
vm.runInContext(read('dist/assets/body-figures-early.js'),context);
vm.runInContext(read('dist/assets/body-figures-late.js'),context);
vm.runInContext(read('dist/assets/body-figures-physical.js'),context);
const W=context.window,R=W.BookFigureRenderers;
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const near=(a,b,t=1e-6,m='')=>{assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${m}: ${a} != ${b}`);checks++;};

// Approximate rendered width of a label (CJK ~1em, latin ~0.56em).
function textWidth(s,size){let w=0;for(const ch of s)w+=/[\u2e80-\u9fff\uff00-\uffef\u3000-\u303f]/.test(ch)?size*1.08:size*.6;return w;}
function textBoxes(svg){
  const out=[];
  for(const m of svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)"([^>]*)>([^<]+)<\/text>/g)){
    const attrs=m[3],cls=(attrs.match(/class="([^"]*)"/)||[,''])[1],anchor=(attrs.match(/text-anchor="([^"]*)"/)||[,'start'])[1];
    const size=/bf-title|hr-type-label/.test(cls)?14:/hr-axis-title|hr-tick|hr-iso-label|hr-comparison-title/.test(cls)?10:/bf-small|bf-callout-muted|hr-note|hr-formula/.test(cls)?10.5:/bf-callout/.test(cls)?11:12;
    out.push({x:+m[1],y:+m[2],w:textWidth(m[4].trim(),size),anchor,text:m[4]});
  }
  return out;
}
const FIGURES=[
  ['body-figure-1-diversity-0','1-diversity-0'],
  ['body-figure-3-distance-4','3-distance-4'],
  ['body-figure-3-distance-5','3-distance-5'],
  ['body-figure-5-ellipsoid-8','5-ellipsoid-8'],
  ['body-figure-5-similarity-9','5-similarity-9'],
  ['body-figure-6-lensing-10','6-lensing-10'],
  ['body-figure-7-structure-13','7-structure-13'],
  ['body-figure-8-feedback-14','8-feedback-14'],
  ['body-figure-9-individual-16','9-individual-16'],
  ['body-figure-9-molecules-17','9-molecules-17'],
  ['body-figure-10-tracks-18','10-tracks-18'],
  ['body-figure-12-clusters-22','12-clusters-22'],
  ['body-figure-12-dynamical-friction-23','12-dynamical-friction-23'],
  ['body-figure-13-plane-25','13-plane-25'],
  ['body-figure-13-structure-24','13-structure-24'],
  ['body-figure-14-engine-26','14-engine-26'],
  ['body-figure-15-clustering-29','15-clustering-29'],
  ['body-figure-16-lyman-forest-30','16-lyman-forest-30'],
  ['body-figure-16-limit-systems-31','16-limit-systems-31']
];
for(const [id,renderer] of FIGURES){
  for(const width of [1440,1100,768,390,320,288]){
    const out=R[renderer](width,{});
    ok(Number.isFinite(out.height)&&out.height>60,`${id} ${width}: height`);
    ok(!/NaN|Infinity|undefined/.test(out.svg),`${id} ${width}: finite geometry`);
    ok(out.svg.length>500,`${id} ${width}: has drawing`);
    if(!/^(2-stars|4-|6-galaxies|7-progenitors|10-chemistry|11-|14-engine-27|15-distribution)/.test(renderer)){
      for(const box of textBoxes(out.svg)){
        const x0=box.anchor==='end'?box.x-box.w:box.anchor==='middle'?box.x-box.w/2:box.x;
        ok(x0>=-2,`${id} ${width}: label starts inside (${box.text.slice(0,12)} at ${x0.toFixed(0)})`);
        ok(x0+box.w<=width+2,`${id} ${width}: label ends inside (${box.text.slice(0,12)} to ${(x0+box.w).toFixed(0)})`);
      }
    }
  }
}
// 1-diversity-0: E has no separable bulge/disk; part selection only keeps the matching part.
{
  const bar=R['1-diversity-0'](1100,{divPart:'bar'});
  ok((bar.svg.match(/data-part="bar"/g)||[]).length===1,'diversity: only SB draws a bar');
  ok((bar.svg.match(/data-part="spheroid"/g)||[]).length===5,'diversity: E body is an overall spheroid under bar highlight');
  const bulge=R['1-diversity-0'](1100,{divPart:'bulge'});
  ok((bulge.svg.match(/data-part="spheroid"/g)||[]).length===5,'diversity: E body is an overall spheroid, not a bulge');
  ok(bulge.readout.includes('E 在本图不分解'),'diversity: readout says E is not decomposed');
  ok(!bulge.readout.includes('四类都有'),'diversity: no claim that E has a bulge');
  ok(!/密度波图案/.test(bulge.readout),'diversity: arms are not asserted to be density waves');
  ok(R['1-diversity-0'](1100,{divPart:'arms'}).readout.includes('密度波是对它的一种解释'),'diversity: density wave kept as one interpretation');
}
// 3-distance-4: comoving ticks stay put; physical bars scale as 1/a_e.
{
  const ticks=[],vals=[];
  for(const ae of [.25,.5,1]){
    const out=R['3-distance-4'](1100,{d4Ae:ae});
    const emission=out.svg.match(/data-d4-bar="emission" data-v="([\d.]+)"/)[1];
    const reception=out.svg.match(/data-d4-bar="reception" data-v="([\d.]+)"/)[1];
    near(+emission/+reception,ae,1e-6,`d4 emission ratio a=${ae}`);
    const rows=[...out.svg.matchAll(/data-d4-tick="(\d)" data-x="([\d.]+)"/g)];
    ok(rows.length===14,`d4 a=${ae}: 7 ticks per row`);
    const r0=rows.filter(r=>r[1]==='0').map(r=>+r[2]),r1=rows.filter(r=>r[1]==='1').map(r=>+r[2]);
    ok(r0.join()===r1.join(),`d4 a=${ae}: comoving tick positions identical at both times`);
    ticks.push(r0.join());vals.push(emission);
  }
  ok(new Set(ticks).size===1,'d4: comoving grid does not move with a_e');
  ok(new Set(vals).size===3,'d4: physical emission length changes with a_e');
  const out=R['3-distance-4'](1100,{});
  ok(out.svg.includes('角大小定义')&&out.svg.includes('通量定义'),'d4: definition panels present');
  ok(!/\(D/.test(out.readout),'d4: readout uses no raw TeX');
}
// 5-similarity-9: slider state drives radii, rings, ruler and order text.
{
  const q=[1,2,3],u=[-.1,-1.4,-3];
  const cross=(i,j)=>Math.atan2(q[j]-q[i],u[i]-u[j]);
  for(const t of [.52,.6,.72]){
    const out=R['5-similarity-9'](1100,{simT:t});
    const dots=[...out.svg.matchAll(/data-sim-current="(\d)" data-r="([\d.]+)"/g)].map(m=>({i:+m[1],r:+m[2]}));
    ok(dots.length===3,`sim t=${t}: three current points`);
    for(const d of dots)near(d.r,q[d.i]*Math.cos(t)+u[d.i]*Math.sin(t),1e-3,`sim t=${t} shell ${d.i+1}`);
    const order=[0,1,2].sort((i,j)=>(q[j]*Math.cos(t)+u[j]*Math.sin(t))-(q[i]*Math.cos(t)+u[i]*Math.sin(t)));
    ok(out.readout.includes(`从外到内的次序是 ${order.map(i=>`壳 ${i+1}`).join(' → ')}`),`sim t=${t}: order text matches radii`);
    ok((out.svg.match(/data-sim-ring="\d"/g)||[]).length===3,`sim t=${t}: three rings with fixed scale`);
    ok(out.svg.includes('窗口 0–1.3 r₀'),'sim: fixed radius window declared');
  }
  const early=R['5-similarity-9'](1100,{simT:.52});
  const late=R['5-similarity-9'](1100,{simT:.72});
  ok(early.readout.includes('壳 3 → 壳 2 → 壳 1')&&late.readout.includes('壳 1 → 壳 2 → 壳 3'),'sim: order reverses across the crossing');
  ok(cross(0,2)>cross(1,2)&&cross(0,1)>cross(0,2),'sim: three crossings ordered');
  ok(late.readout.includes('已经交叉：壳 1与壳 2'),'sim: crossed pairs listed');
}
// 8-feedback-14: layer inventory per limit and highlight state.
{
  const out=R['8-feedback-14'](1100,{});
  const count=k=>(out.svg.match(new RegExp(`data-fb-layer="${k}"`,'g'))||[]).length;
  ok(count('shock')===2,'fb: shock in both limits');
  ok(count('hot')===2,'fb: hot gas in both limits');
  ok(count('contact')===1&&count('reverse')===1&&count('cold')===1,'fb: contact/reverse/cold only in the wind limit');
  const sel=R['8-feedback-14'](1100,{fbLayer:'contact'});
  ok((sel.svg.match(/is-dim/g)||[]).length===6,'fb: selecting a layer dims the other six');
  ok(sel.readout.includes('Sedov 极限没有抛射物'),'fb: contact readout explains the Sedov absence');
  ok(!/0\.9r/.test(sel.readout),'fb: no invented 0.9r layer');
  const shock=R['8-feedback-14'](1100,{fbLayer:'shock'});
  ok(shock.readout.includes('t^(2/5)')&&shock.readout.includes('t^(3/5)'),'fb: both wind laws stated');
  ok(shock.svg.includes('R ∝ t^0.4')&&shock.svg.includes('R ∝ t^0.6'),'fb: in-figure power laws');
}
// 9-molecules-17: dust tau=tau0*0.15/lambda, H2 only inside schematic lines.
{
  const line=0.1028,lam=0.2;
  for(const tau0 of [0,1,2,4]){
    const atLine=R['9-molecules-17'](1100,{molTau:tau0,molLambda:line});
    const dust=atLine.svg.match(/data-mol-marker="0"[^>]*data-tau="([\d.]+)"[^>]*data-f="([\d.]+)"/);
    const h2=atLine.svg.match(/data-mol-marker="1"[^>]*data-tau="([\d.]+)"[^>]*data-f="([\d.]+)"/);
    near(+dust[1],tau0*.15/line,1e-6,`mol dust tau ${tau0}`);
    near(+dust[2],Math.exp(-tau0*.15/line),1e-6,`mol dust F ${tau0}`);
    near(+h2[1],tau0,1e-3,`mol H2 line-centre tau ${tau0}`);
    near(+h2[2],Math.exp(-tau0),1e-3,`mol H2 line-centre F ${tau0}`);
  }
  const between=R['9-molecules-17'](1100,{molTau:2,molLambda:lam});
  const h2=between.svg.match(/data-mol-marker="1"[^>]*data-tau="([\d.]+)"/);
  ok(+h2[1]<1e-3,'mol: H2 is transparent between lines');
  ok(between.readout.includes('F=1.000'),'mol: readout reports F=1 between lines');
  ok(between.svg.includes('紫外·教学波段'),'mol: axis called UV teaching band, not far-UV');
  ok(!between.svg.includes('远紫外'),'mol: no far-UV claim for the whole axis');
  ok(between.svg.includes('data-mol-marker="0"')&&between.svg.includes('data-mol-marker="1"'),'mol: both spectra present');
}
// 10-tracks-18: the turnoff comes from the same lifetime fit as the on/off flags.
{
  const T=W.BookTrackFigureModel;
  ok(typeof T==='object'&&T!==null,'trk: model exported');
  const independent=age=>{let lo=.35,hi=12;for(let i=0;i<200;i++){const m=(lo+hi)/2;if(T.life(m)>age)lo=m;else hi=m;}return (lo+hi)/2;};
  for(const age of [.2,1,4,8,12]){
    const out=R['10-tracks-18'](1100,{trkAge:age});
    const mass=+out.svg.match(/data-trk-turnoff data-mass="([\d.]+)"/)[1];
    near(mass,independent(age),1e-6,`trk turnoff at ${age} Gyr`);
    for(const m of [.7,1,2,5]){
      const on=new RegExp(`data-trk-mass="${m}" data-trk-on="(true|false)"`).exec(out.svg)[1]==='true';
      assert.equal(on,T.life(m)>age,`trk ${m} M at ${age} Gyr`);checks++;
    }
    ok(out.readout.includes(`转折质量 ≈${mass.toFixed(2)}`),`trk: readout uses the same turnoff (${age})`);
  }
  const out=R['10-tracks-18'](1100,{trkAge:4,trkMass:2});
  ok(out.readout.includes('主序时长 0.79 Gyr'),'trk: MS lifetime from the fit');
  ok(!/等龄线\n/.test(out.readout),'trk: no isochrone claim');
  ok(out.readout.includes('不是等龄线或演化轨迹'),'trk: scope stated');
}
// 13-plane-25: 25 synthetic points on the declared plane; slice dims the rest.
{
  const out=R['13-plane-25'](1100,{});
  const pts=[...out.svg.matchAll(/data-pl-point="(\d+)" data-s="([-\d.]+)" data-i="([-\d.]+)" data-r="([-\d.]+)"/g)].map(m=>({s:+m[2],i:+m[3],r:+m[4]}));
  ok(pts.length===25,'plane: 25 synthetic points');
  for(const p of pts)near(p.r,1.25*p.s-.8125*p.i,1e-9,'plane: r=1.25s-0.8125i');
  ok((out.svg.match(/data-pl-point2=/g)||[]).length===25,'plane: same points in the 2D panel');
  ok(!/bf-faint/.test(out.svg),'plane: no filled bf-faint polylines');
  ok(out.svg.includes('bf-wire'),'plane: grid uses the stroke-only class');
  const slice=R['13-plane-25'](1100,{plSlice:.1});
  ok((slice.svg.match(/is-dim/g)||[]).length===40,'plane: slice keeps only i=0 row in both panels');
  const sel=R['13-plane-25'](1100,{plSel:7});
  ok((sel.svg.match(/data-pl-point="7"/g)||[]).length===1,'plane: selected point still drawn once');
  ok((sel.svg.match(/data-pl-ring/g)||[]).length===2,'plane: selection ring in both panels');
}
// 14-engine-26: geometric blocking threshold and optional jet.
{
  const alpha=Math.atan(.30/.72)*180/Math.PI;
  near(alpha,22.62,1e-3,'engine: torus opening angle');
  for(const [inc,blocked] of [[10,true],[22,true],[23,false],[55,false],[85,false]]){
    const out=R['14-engine-26'](1100,{engInc:inc});
    assert.equal(/data-eng-blocked/.test(out.svg),blocked,`engine i=${inc}`);checks++;
    assert.equal(out.readout.includes('宽线区被遮挡'),blocked,`engine readout i=${inc}`);checks++;
    ok(out.svg.includes(`当前 i = ${inc}°`),`engine: in-figure angle i=${inc}`);
  }
  const jet=R['14-engine-26'](1100,{engJet:true});
  ok((jet.svg.match(/data-part="jet"/g)||[]).length===1,'engine: optional jet layer');
  ok(jet.controls.includes('不是所有 AGN 都有'),'engine: jet caveat in controls');
  ok(R['14-engine-26'](1100,{engPart:'jet'}).readout.includes('部分 AGN'),'engine: jet described as optional');
  const layer=R['14-engine-26'](1100,{engPart:'blr'});
  ok((layer.svg.match(/is-dim/g)||[]).length===3,'engine: selecting a part dims the other three');
  ok(!/1 型|2 型|Type 1|Type 2/.test(layer.readout),'engine: no type labels invented');
}
// 7-structure-13: one level at a time, cross-section linked.
{
  for(const m of [.5,1,1.5]){
    const out=R['7-structure-13'](1100,{strLevel:m});
    const contours=(out.svg.match(/class="bf-series(-2|-3)?"/g)||[]).length;
    ok(contours>=6,`struct13 m=${m}: three contours per panel`);
    ok(out.svg.includes(`当前 m=${m}`),`struct13 m=${m}: figure states the level`);
    ok((out.svg.match(/bf-wire/g)||[]).length===4,`struct13 m=${m}: two faint cross-sections per panel`);
  }
  ok(R['7-structure-13'](1100,{strLevel:1.5}).readout.includes('只画当前 m=1.5'),'struct13: only one level drawn');
}
// 9-individual-16: framing relationship, no invented units.
{
  const out=R['9-individual-16'](1100,{});
  ok((out.svg.match(/stroke-dasharray="4 3"/g)||[]).length===2,'indiv: two framing boxes');
  ok((out.svg.match(/取景 → /g)||[]).length===2,'indiv: two framing arrows');
  ok(!/×\s?\d|倍率\s?\d/.test(out.svg),'indiv: no invented magnification');
  ok(!/pc|kpc|AU/.test(out.svg),'indiv: no invented units');
  ok(out.readout.includes('不给出倍率'),'indiv: framing stated, no magnification');
}
// 12-clusters-22: the infusion arrows reach the disk edge and the tail leaves it.
{
  const out=R['12-clusters-22'](1100,{});
  ok((out.svg.match(/data-pair/g)||[]).length===0,'clusters: no stray pair marks');
  ok(out.svg.includes('来流：团内气体向右吹过星系'),'clusters: inflow labelled');
  ok(out.svg.includes('尾迹：盘气体被剥离'),'clusters: tail labelled');
  ok(out.svg.includes('椭圆 = 恒星主体'),'clusters: stellar body labelled');
  ok(!/\\\(/.test(out.readout),'clusters: readout has no raw TeX');
  ok(out.readout.includes('横轴是位置、不是时间'),'clusters: tide axis meaning stated');
}
// 12-dynamical-friction-23: vectors and wake are distinct and toggleable.
{
  const out=R['12-dynamical-friction-23'](1100,{});
  ok((out.svg.match(/stroke-dasharray="3 4"/g)||[]).length===3,'fri: three schematic deflection paths');
  const off=R['12-dynamical-friction-23'](1100,{friPaths:false});
  ok(!/stroke-dasharray="3 4"/.test(off.svg),'fri: paths hidden by the toggle');
  ok(out.svg.includes('data-fri-sat'),'fri: satellite marked');
  ok(out.readout.includes('没有迎风剥离')||out.readout.includes('不是气体迎面流过'),'fri: not ram pressure');
}
// 13-structure-24: reused integration, current Lz and direction.
{
  const D=W.BookFigureLateDiagnostics;
  ok(D.orbitData.every(o=>Array.isArray(o.samples)&&o.samples.length>100),'orb: sampled trajectory exported');
  const box=D.orbitData[0],tube=D.orbitData[1];
  ok(box.minL<0&&box.maxL>0,'orb: box orbit has both Lz signs');
  ok(tube.minL>0,'orb: tube orbit keeps Lz positive');
  const out=R['13-structure-24'](1100,{orbFrac:.5});
  const dot=out.svg.match(/data-orb-dot="(\d)" data-lz="([-\d.]+)" data-t="([\d.]+)"/g);
  ok(dot.length===2,'orb: current point in both panels');
  const boxDot=/data-orb-dot="0" data-lz="([-\d.]+)" data-t="([\d.]+)"/.exec(out.svg);
  const idx=Math.round(.5*(box.samples.length-1));
  near(+boxDot[1],box.samples[idx].lz,1e-4,'orb: box current Lz matches the sampled state');
  near(+boxDot[2],box.samples[idx].t,1e-4,'orb: current time matches the sample');
  const first=R['13-structure-24'](1100,{orbFrac:0});
  const firstDot=/data-orb-dot="0" data-lz="([-\d.]+)" data-t="([\d.]+)"/.exec(first.svg);
  near(+firstDot[2],box.samples[0].t,1e-6,'orb: t=0 current time');
  near(+firstDot[1],box.samples[0].lz,1e-4,'orb: t=0 Lz equals the initial sampled state');
}
// 15-clustering-29: every pair is a visible line and totals match.
{
  const out=R['15-clustering-29'](1100,{});
  ok((out.svg.match(/data-pair/g)||[]).length===16,'cluster: 4+12 member pairs drawn');
  ok(!/bf-faint/.test(out.svg),'cluster: chords do not use bf-faint');
  ok(out.svg.includes('本组配对总数 = 4')&&out.svg.includes('本组配对总数 = 12'),'cluster: totals in figure');
}
// 16-lyman-forest-30: shared probe readout from the same density function.
{
  const A2=W.AdvancedPhysics;
  for(const chi of [0,21,55,82,100]){
    const out=R['16-lyman-forest-30'](1100,{lfProbe:chi});
    const d=A2.forestDensity(chi,1.2),F=Math.exp(-.35*d**1.65);
    ok(out.readout.includes(`χ=${chi.toFixed(1)}`),`lyman: probe position ${chi}`);
    ok(out.readout.includes(`Δ=${d.toFixed(3)}`),`lyman: density readout ${chi}`);
    ok(out.readout.includes(`F=${F.toFixed(3)}`),`lyman: transmission readout ${chi}`);
  }
  const out=R['16-lyman-forest-30'](1100,{});
  ok(!/bf-faint/.test(out.svg),'lyman: guides are not bf-faint');
  ok((out.svg.match(/bf-guide-dash/g)||[]).length>=6,'lyman: visible alignment guides');
}
// 16-limit-systems-31: nested bands keep the inclusion relation.
{
  const out=R['16-limit-systems-31'](1100,{});
  ok((out.svg.match(/data-limit-band="(forest|lls|dla)"/g)||[]).length===3,'limit: three bands');
  ok(out.svg.includes('⊂ 包含在 LLS 内'),'limit: inclusion label');
  ok(out.svg.includes('DLA（NHI ≥ 2×10²⁰）'),'limit: DLA label inside its own row');
  ok(!/互斥/.test(out.readout.split('不是互斥')[0]),'limit: not described as exclusive');
  ok(out.readout.includes('包含'),'limit: readout states inclusion');
}
console.log(JSON.stringify({checks,figures:FIGURES.length,renderers:Object.keys(R).length}));
