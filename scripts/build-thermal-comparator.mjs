import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url)),REPO=process.env.GALAXIES_REPO||path.resolve(HERE,'..');
const QA=path.resolve(REPO,'work/anatomy-v33');fs.mkdirSync(QA,{recursive:true});
const k=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/iso-kit.mjs')));
const G=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/lathe.mjs')));
const A=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/audit.mjs')));
// Figure: 71 planned real fixed parts. See work/anatomy-v33/thermal-parts-plan.md.
// The two readout cabinets compare computed perturbations; no heat transport,
// particles, actual oscilloscope electronics or sensor physics is simulated.
const W=850,H=500,base={x:-161,y:-58,w:322,d:116,r:8};
const P=k.fitProjection([...k.boxCorners(base,-18,3),...k.boxCorners({x:-128,y:-36,w:258,d:48,r:0},3,106)],W,H,{pad:34,azimuth:60,elevation:28});
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
slab('base.deck',{x:-147,y:-45,w:294,d:90,r:4},0,3,{tone:'lo',extra:k.lineSvg(k.planOutline({x:-143,y:-41,w:286,d:82,r:3},3,P),{tone:'faint'})});
for(const[i,[x,y]]of k.corners(base,10).entries())round('base.fastener.'+i,x,y,1.6,0,1,{tone:'hi',extra:k.dotsSvg([k.iso([x,y,1],P)],{size:.45,tone:'lo'})});
for(const y of [-44,39]){const ticks=k.topTicks(-138,138,6,5,y,3.7,[1.6,3.6],P);slab('base.ruler.'+y,{x:-141,y,w:282,d:5,r:.6},3,.7,{tone:'lo',extra:k.lineSvg(ticks.major,{tone:'mid'})+k.lineSvg(ticks.minor,{tone:'lo'})});}
slab('base.plaque',{x:-39,y:49,w:78,d:7,r:1},0,.8,{tone:'lo',extra:k.lineSvg(k.lineOnTop([-28,51],[27,51],.8,P)+k.lineOnTop([-28,53],[18,53],.8,P),{tone:'lo',free:true})});
for(const x of [-34,34])round('base.plaque-rivet.'+x,x,52.5,.9,.8,.5,{tone:'hi'});
for(const[id,x]of [-128,18].entries()){
 const n='channel.'+id;
 slab(n+'.plinth',{x:x+8,y:-24,w:96,d:42,r:2},3,4,{tone:'hi'});
 for(const xx of [x+13,x+99])round(n+'.mount-screw.'+xx,xx,12,1.2,7,.8,{tone:'hi'});
 for(const xx of [x+27,x+85]){
  round(n+'.collar.'+xx,xx,-5,6,7,4);
  round(n+'.post.'+xx,xx,-5,3,11,13,{extra:k.lineSvg(k.sideArc(xx,-5,3,17,P),{tone:'faint'})});
 }
 slab(n+'.crossbrace',{x:x+20,y:-10,w:72,d:10,r:.8},24,5,{tone:'mid'});
 const body={x,y:-36,w:112,d:40,r:2};
 slab(n+'.cabinet',body,29,65,{tone:'mid',extra:k.lineSvg(k.sideSeam(body,75,P,6),{tone:'faint'})});
 slab(n+'.lid',body,94,3,{tone:'hi'});
 const face=slab(n+'.screen-backplate',{x:x+9,y:4,w:94,d:1.2,r:.6},42,46,{tone:'lo'});
 const originWorld=[x+12,5.23,45],worldU=[88,0,0],worldV=[0,0,40];
 const project=(u,v)=>k.iso(originWorld.map((q,j)=>q+u*worldU[j]+v*worldV[j]),P);
 const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>project(u,v));
 const C=project(0,0),U=project(1,0).map((q,j)=>q-C[j]),V=project(0,1).map((q,j)=>q-C[j]);
 const closed=corners.map((p,j)=>(j?'L':'M')+p.join(',')).join('')+'Z';
 const seg=(u0,v0,u1,v1)=>`M${project(u0,v0).join(',')}L${project(u1,v1).join(',')}`;
 const marks=[];for(const u of [.25,.5,.75])marks.push(seg(u,0,u,.065),seg(u,1,u,.935));
 // Data lives in the actual backplate's measured depth slot. The zero line
 // reaches the closed border; each small tick roots in that border as well.
 face.svg+=`<defs><clipPath id="thermal-screen-${id}"><path d="${closed}"/></clipPath></defs>`+k.lineSvg(closed,{tone:'lo'})+k.lineSvg(seg(0,.5,1,.5),{tone:'faint'})+k.lineSvg(marks.join(''),{tone:'lo'})+`<g data-thermal-wave-${id} clip-path="url(#thermal-screen-${id})"></g><g data-thermal-selection-${id} opacity="0"><path d="${closed}" fill="none" stroke="var(--anatomy-lit)" stroke-width="1.5"/></g>`;
 for(const[which,plan,z,h]of [
  ['bottom',{x:x+6,y:4,w:100,d:3,r:.2},39,3],
  ['top',{x:x+6,y:4,w:100,d:3,r:.2},88,3],
  ['left',{x:x+6,y:4,w:3,d:3,r:.2},42,46],
  ['right',{x:x+103,y:4,w:3,d:3,r:.2},42,46]])slab(n+'.bezel.'+which,plan,z,h,{tone:'hi'});
 slab(n+'.control-panel',{x:x+7,y:4,w:98,d:3,r:.5},30,8,{tone:'hi'});
 for(const xx of [x+20,x+42,x+64])faceDisc(n+'.knob.'+xx,xx,7,34,2.8,4,{knurl:true});
 slab(n+'.rocker-switch',{x:x+80,y:7,w:7,d:2,r:.5},32,4,{tone:'mid'});
 for(const xx of [x+94,x+100])faceDisc(n+'.connector.'+xx,xx,7,34,1.5,2,{tone:'lo'});
 const ventPlan={x:x+12,y:-29,w:88,d:18,r:1};
 const vents=[];for(let i=0;i<9;i++)vents.push(k.planOutline({x:x+18+i*8,y:-26,w:2.2,d:12,r:1},97.5,P,4));
 slab(n+'.vent-plate',ventPlan,97,.5,{tone:'lo',extra:k.lineSvg(vents.join(''),{tone:'faint'})});
 for(const xx of [x+22,x+84])slab(n+'.handle-post.'+xx,{x:xx,y:-5,w:6,d:6,r:.7},97,6,{tone:'mid'});
 slab(n+'.handle-bridge',{x:x+22,y:-5,w:68,d:6,r:1},103,3,{tone:'hi'});
 for(const xx of [x+6,x+106])round(n+'.lid-fastener.'+xx,xx,-30,1.1,97,.7,{tone:'hi'});
 panels.push({index:id,role:id===0?'reference-without-conduction':'with-conduction',order:id===0?'left/smaller-world-x':'right/larger-world-x',plane:{originWorld,uWorld:worldU,vWorld:worldV,corners,origin:C,basis:{u:U,v:V},mapping:'screen = origin + u*basis.u + v*basis.v; u,v in [0,1]; v increases upward; zero at v=0.5'},waveHook:'data-thermal-wave-'+id,selectionHook:'data-thermal-selection-'+id,clipId:'thermal-screen-'+id,physicalScreen:{width:88,height:40,frontY:5.23},zeroV:.5});
}
A.settle(R,P,{states:[0]});
const physical=R.items.slice().sort((a,b)=>a.key-b.key).map(item=>`<g data-thermal-part="${item.name}">${item.svg}</g>`).join('');
const svg=k.figureSvg({width:W,height:H,label:'两只相同安装支撑的读出屏组成热模比较台；左侧无传导参照，右侧含传导，波形由同一数值模型计算。',body:`<path class="iso-halo" d="${k.haloOf(base,-18,12,P)}"/>${physical}`});
fs.writeFileSync(path.join(REPO,'dist/assets/thermal-comparator.svg'),svg);
const projection={P,width:W,height:H,parts:R.solids.length,items:R.items.length,panels,partsList:parts,ordering:'Panel 0 at smaller world x: reference without conduction. Panel 1 at larger world x: with conduction. External captions label the two in this order.',limits:'Computational comparison instrument only. No physical heat-transfer paths, particles, actual oscilloscope electronics or sensing mechanism is modeled. Solids remain fixed; only clipped waveform/readout ink changes. Both identical screen planes must show the same two wavelengths and share a common amplitude scale and zero. Parent owns Fourier-perturbation model, normalization/autoscale, wave values and chapter integration.'};
fs.writeFileSync(path.join(REPO,'content/thermal-comparator-projection.json'),JSON.stringify(projection,null,2)+'\n');
for(const theme of ['dark','light']){
 const fig=k.plateHtml({fig:'Fig 8.1',title:'双通道热模比较台',hint:'相同屏面 · 共用振幅标尺',readout:'无传导参照 / 含传导',body:`<div class="iso-stage">${svg}</div>`,caption:'左侧（世界x较小）为无传导参照，右侧为含传导模型；两屏显示相同空间区间并共用振幅标尺，居中细线为零点。仪器只读出计算得到的热扰动，不表示实体传热实验或真实传感器，所有实体固定，仅屏面数据墨迹变化。'});
 fs.writeFileSync(path.join(QA,`thermal-preview-${theme}.html`),k.pageHtml({title:'双通道热模比较台',theme,body:fig}));
}
console.log(`Thermal comparator: ${R.solids.length} true solids / ${R.items.length} measured-depth items.`);
A.auditOrExit(R,P,{apart:false,frames:[0]});
