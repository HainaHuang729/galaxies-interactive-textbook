import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url)),REPO=process.env.GALAXIES_REPO||path.resolve(HERE,'..');
const QA=path.resolve(REPO,'work/anatomy-v34');fs.mkdirSync(QA,{recursive:true});
const k=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/iso-kit.mjs')));
const G=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/lathe.mjs')));
const A=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/audit.mjs')));
// Figure: 67 true fixed parts, planned in photometry-parts-plan.md before geometry.
// Twin desktop plotting consoles carry computed signal/SNR traces. No real
// telescope optics, photons or instrument noise are modeled by this machine.
const W=850,H=500,base={x:-161,y:-71,w:322,d:142,r:8};
const P=k.fitProjection([...k.boxCorners(base,-18,3),...k.boxCorners({x:-128,y:-45,w:258,d:94,r:0},3,38)],W,H,{pad:34,azimuth:50,elevation:46});
const R=A.recorder(P),parts=[],panels=[];
function slab(name,plan,z,h,{tone='mid',extra='',ground=false}={}){
 const shape=R.solid(A.slab(plan,z,h,{name,ground},6));
 const item=R.put({name,at:[plan.x+plan.w/2,plan.y+plan.d/2,z+h/2],shapes:[shape],svg:k.solidSvg(k.slabOf(plan,z,h,P,6,.4),{tone,inner:extra})});parts.push({name,kind:'rounded-prism',plan,z,h});return item;
}
function round(name,x,y,r,z,h,{tone='mid',extra=''}={}){
 const shape=R.solid(A.cylinder(x,y,r,z,h,{name}));
 const item=R.put({name,at:[x,y,z+h/2],shapes:[shape],svg:k.solidSvg(k.cylinder(x,y,r,z,h,P,40,.25),{tone,inner:extra})});parts.push({name,kind:'cylinder',x,y,r,z,h});return item;
}
function faceDisc(name,x,y,z,r,h,{knurl=false,tone='mid'}={}){
 const F=G.frameAlong([x,y,z],[0,1,0]),shape=R.solid(A.disc(F,0,h,r,{name}));
 const texture=knurl?k.fadedSvg(G.ribsOf(F,0,h,r,24,P,{fade:[.05,.5],seams:true}),{tone:'lo'}):'';
 const item=R.put({name,at:[x,y+h/2,z],shapes:[shape],svg:k.solidSvg(G.disc(0,h,r,F,P,{steps:40,bevel:.2}),{tone,inner:texture})});parts.push({name,kind:'face-cylinder',worldOrigin:[x,y,z],axis:[0,1,0],r,h});return item;
}
for(const[i,[x,y]]of k.corners(base,19).entries())slab('base.foot.'+i,{x:x-7,y:y-7,w:14,d:14,r:3},-18,7,{tone:'lo',ground:true});
slab('base.plate',base,-11,11,{tone:'lo',extra:k.lineSvg(k.planOutline(k.insetPlan(base,4),0,P),{tone:'lo'})});
slab('base.deck',{x:-147,y:-58,w:294,d:116,r:4},0,3,{tone:'lo',extra:k.lineSvg(k.planOutline({x:-143,y:-54,w:286,d:108,r:3},3,P),{tone:'faint'})});
for(const[i,[x,y]]of k.corners(base,10).entries())round('base.fastener.'+i,x,y,1.6,0,1,{tone:'hi',extra:k.dotsSvg([k.iso([x,y,1],P)],{size:.45,tone:'lo'})});
for(const y of [-57,51]){const ticks=k.topTicks(-138,138,6,5,y,3.7,[1.6,3.6],P);slab('base.ruler.'+y,{x:-141,y,w:282,d:5,r:.6},3,.7,{tone:'lo',extra:k.lineSvg(ticks.major,{tone:'mid'})+k.lineSvg(ticks.minor,{tone:'lo'})});}
slab('base.plaque',{x:-39,y:62,w:78,d:7,r:1},0,.8,{tone:'lo',extra:k.lineSvg(k.lineOnTop([-28,64],[27,64],.8,P)+k.lineOnTop([-28,66],[18,66],.8,P),{tone:'lo',free:true})});
for(const x of [-34,34])round('base.plaque-rivet.'+x,x,65.5,.9,.8,.5,{tone:'hi'});
for(const[id,x]of [-128,18].entries()){
 const n='channel.'+id;
 slab(n+'.plinth',{x:x+7,y:-42,w:98,d:84,r:2},3,4,{tone:'lo'});
 for(const xx of [x+17,x+95])for(const yy of [-29,29])slab(n+'.rubber-foot.'+xx+'.'+yy,{x:xx-6,y:yy-6,w:12,d:12,r:2},7,4,{tone:'lo'});
 const body={x,y:-45,w:112,d:90,r:2};
 slab(n+'.case',body,11,17,{tone:'mid',extra:k.lineSvg(k.sideSeam(body,21,P,6),{tone:'faint'})});
 const face=slab(n+'.screen-backplate',{x:x+8,y:-34,w:96,d:58,r:.6},28,1,{tone:'lo'});
 const originWorld=[x+12,20,29.04],worldU=[88,0,0],worldV=[0,-50,0];
 const project=(u,v)=>k.iso(originWorld.map((q,j)=>q+u*worldU[j]+v*worldV[j]),P);
 const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>project(u,v));
 const C=project(0,0),U=project(1,0).map((q,j)=>q-C[j]),V=project(0,1).map((q,j)=>q-C[j]);
 const closed=corners.map((p,j)=>(j?'L':'M')+p.join(',')).join('')+'Z';
 const seg=(u0,v0,u1,v1)=>`M${project(u0,v0).join(',')}L${project(u1,v1).join(',')}`;
 const ticks=[];for(let i=0;i<=6;i++){const u=i/6;ticks.push(seg(u,0,u,.07),seg(u,1,u,.95));}
 const sides=[];for(const v of [.25,.5,.75])sides.push(seg(0,v,.035,v),seg(1,v,.965,v));
 // The horizontal x ruler is common. The two vertical quantities are separately
 // labeled outside the machine by root. All ticks root in the closed border.
 face.svg+=`<defs><clipPath id="photometry-screen-${id}"><path d="${closed}"/></clipPath></defs>`+k.lineSvg(closed,{tone:'lo'})+k.lineSvg(ticks.join('')+sides.join(''),{tone:'lo'})+`<g data-photometry-trace-${id} clip-path="url(#photometry-screen-${id})"></g><g data-photometry-probe-${id} clip-path="url(#photometry-screen-${id})"></g><g data-photometry-selection-${id} opacity="0"><path d="${closed}" fill="none" stroke="var(--anatomy-lit)" stroke-width="1.5"/></g>`;
 for(const[which,plan]of [
  ['back',{x:x+5,y:-37,w:102,d:3,r:.2}],
  ['front',{x:x+5,y:24,w:102,d:3,r:.2}],
  ['left',{x:x+5,y:-34,w:3,d:58,r:.2}],
  ['right',{x:x+104,y:-34,w:3,d:58,r:.2}]])slab(n+'.bezel.'+which,plan,28,3,{tone:'hi'});
 slab(n+'.control-fascia',{x:x+7,y:45,w:98,d:3,r:.5},14,9,{tone:'hi'});
 for(const xx of [x+20,x+42,x+64])faceDisc(n+'.knob.'+xx,xx,48,18.5,2.8,4,{knurl:true});
 slab(n+'.rocker-switch',{x:x+80,y:48,w:7,d:2,r:.5},16.5,4,{tone:'mid'});
 for(const xx of [x+94,x+100])faceDisc(n+'.connector.'+xx,xx,48,18.5,1.5,2,{tone:'lo'});
 const vents=[];for(let i=0;i<7;i++)vents.push(k.planOutline({x:x+16+i*9,y:31,w:3,d:6,r:1},28.5,P,4));
 slab(n+'.vent-plate',{x:x+12,y:29,w:68,d:10,r:1},28,.5,{tone:'lo',extra:k.lineSvg(vents.join(''),{tone:'faint'})});
 for(const xx of [x+4,x+108])for(const yy of [-41,41])round(n+'.top-fastener.'+xx+'.'+yy,xx,yy,1,28,.7,{tone:'hi'});
 for(const xx of [x+20,x+86])slab(n+'.handle-post.'+xx,{x:xx,y:-44,w:6,d:5,r:.7},28,6,{tone:'mid'});
 slab(n+'.handle-bridge',{x:x+20,y:-44,w:72,d:5,r:1},34,3,{tone:'hi'});
 panels.push({index:id,role:id===0?'Gaussian-encircled-signal-fraction':'normalized-SNR',order:id===0?'left/smaller-world-x':'right/larger-world-x',plane:{originWorld,uWorld:worldU,vWorld:worldV,corners,origin:C,basis:{u:U,v:V},mapping:'screen = origin + u*basis.u + v*basis.v; u,v in [0,1]; u = (r/FWHM)/3; v increases toward back (-world y)'},traceHook:'data-photometry-trace-'+id,probeHook:'data-photometry-probe-'+id,selectionHook:'data-photometry-selection-'+id,clipId:'photometry-screen-'+id,xDomain:[0,3],xTickValues:[0,.5,1,1.5,2,2.5,3],physicalScreen:{width:88,depth:50,z:29.04}});
}
A.settle(R,P,{states:[0]});
const physical=R.items.slice().sort((a,b)=>a.key-b.key).map(item=>`<g data-photometry-part="${item.name}">${item.svg}</g>`).join('');
const svg=k.figureSvg({width:W,height:H,label:'两只相同顶部绘图窗的测光计算读出台；左窗为包围信号份额，右窗为归一化信噪比，横标尺均为半径除以FWHM。',body:`<path class="iso-halo" d="${k.haloOf(base,-18,12,P)}"/>${physical}`});
fs.writeFileSync(path.join(REPO,'dist/assets/photometry-comparator.svg'),svg);
const projection={P,width:W,height:H,parts:R.solids.length,items:R.items.length,panels,partsList:parts,ordering:'Panel 0 at smaller world x/left is Gaussian encircled signal fraction; panel 1 at larger x/right is normalized SNR. Use explicit hooks/index, never DOM painter order.',limits:'Computational photometry comparison only; no real telescope, PSF optics, detected photons or empirical noise response is depicted. All solids stay fixed. Both top plot windows use exactly the same x domain 0<=r/FWHM<=3, with u=(r/FWHM)/3. Vertical quantities differ and must be labeled separately outside the machine. Parent owns Gaussian encircled-energy law, aperture-noise/SNR model, normalization, probes, values and chapter integration.'};
fs.writeFileSync(path.join(REPO,'content/photometry-comparator-projection.json'),JSON.stringify(projection,null,2)+'\n');
for(const theme of ['dark','light']){
 const fig=k.plateHtml({fig:'Fig 2.1',title:'双通道测光读出台',hint:'相同半径标尺 · 分别标注纵量',readout:'包围信号份额 / 归一化信噪比',body:`<div class="iso-stage">${svg}</div>`,caption:'左窗（世界x较小）读出Gaussian包围信号份额，右窗读出归一化SNR；横向均为0≤r/FWHM≤3。两者纵量不同，必须分别标注。仪器仅展示计算结果，不表示真实望远镜光学或探测过程；所有实体固定，仅屏面曲线和探针变化。'});
 fs.writeFileSync(path.join(QA,`photometry-preview-${theme}.html`),k.pageHtml({title:'双通道测光读出台',theme,body:fig}));
}
console.log(`Photometry comparator: ${R.solids.length} true solids / ${R.items.length} measured-depth items.`);
A.auditOrExit(R,P,{apart:false,frames:[0]});
