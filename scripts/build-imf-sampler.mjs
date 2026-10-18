import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url)),REPO=process.env.GALAXIES_REPO||path.resolve(HERE,'..');
const QA=path.resolve(REPO,'work/anatomy-v32');fs.mkdirSync(QA,{recursive:true});
const k=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/iso-kit.mjs')));
const A=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/audit.mjs')));
// Figure: 75 physical parts, planned before geometry in imf-parts-plan.md.
// 10 base + 4 supporting rails + 5 finish + 8*(saddle/floor/2 sides/back/front/screw).
// Identical trays carry calibrated readout ink, never a pile of physical stars.
// All solids remain static. The parent pure sampling model supplies every bar.
const W=850,H=500,base={x:-154,y:-91,w:308,d:182,r:8};
const P=k.fitProjection([...k.boxCorners(base,-18,3),...k.boxCorners({x:-136,y:-66,w:268,d:134,r:0},3,34)],W,H,{pad:35,azimuth:47,elevation:43});
const R=A.recorder(P),parts=[],bins=[];
function slab(name,plan,z,h,{tone='mid',extra='',ground=false}={}){
 const shape=R.solid(A.slab(plan,z,h,{name,ground},6));
 const item=R.put({name,at:[plan.x+plan.w/2,plan.y+plan.d/2,z+h/2],shapes:[shape],svg:k.solidSvg(k.slabOf(plan,z,h,P,6,.35),{tone,inner:extra})});parts.push({name,kind:'rounded-prism',plan,z,h});return item;
}
function round(name,x,y,r,z,h,{tone='mid',extra=''}={}){
 const shape=R.solid(A.cylinder(x,y,r,z,h,{name}));
 const item=R.put({name,at:[x,y,z+h/2],shapes:[shape],svg:k.solidSvg(k.cylinder(x,y,r,z,h,P,32,.2),{tone,inner:extra})});parts.push({name,kind:'cylinder',x,y,r,z,h});return item;
}
for(const[i,[x,y]]of k.corners(base,19).entries())slab('base.foot.'+i,{x:x-7,y:y-7,w:14,d:14,r:3},-18,7,{tone:'lo',ground:true});
slab('base.plate',base,-11,11,{tone:'lo',extra:k.lineSvg(k.planOutline(k.insetPlan(base,4),0,P),{tone:'lo'})});
slab('base.deck',{x:-140,y:-78,w:280,d:156,r:4},0,3,{tone:'lo',extra:k.lineSvg(k.planOutline({x:-136,y:-74,w:272,d:148,r:3},3,P),{tone:'faint'})});
for(const[i,[x,y]]of k.corners(base,10).entries())round('base.screw.'+i,x,y,1.6,0,1,{tone:'hi',extra:k.dotsSvg([k.iso([x,y,1],P)],{size:.45,tone:'lo'})});
for(const rowY of [-62,16])for(const offset of [10,38])slab('support.rail.'+rowY+'.'+offset,{x:-136,y:rowY+offset-2,w:268,d:4,r:.6},3,4,{tone:'mid',extra:k.lineSvg(k.lineOnTop([-136,rowY+offset],[132,rowY+offset],7,P),{tone:'faint'})});
for(const y of [-77,72]){const ticks=k.topTicks(-130,130,5,5,y,3.7,[1.6,3.6],P);slab('base.ruler.'+y,{x:-132,y,w:264,d:5,r:.6},3,.7,{tone:'lo',extra:k.lineSvg(ticks.major,{tone:'mid'})+k.lineSvg(ticks.minor,{tone:'lo'})});}
slab('base.plaque',{x:-39,y:81,w:78,d:7,r:1},0,.8,{tone:'lo',extra:k.lineSvg(k.lineOnTop([-28,83],[27,83],.8,P)+k.lineOnTop([-28,85],[18,85],.8,P),{tone:'lo',free:true})});
for(const x of [-34,34])round('base.plaque-rivet.'+x,x,84.5,.9,.8,.5,{tone:'hi'});
for(const[row,y]of [-62,16].entries())for(const[col,x]of [-132,-64,4,72].entries()){
 const id=row*4+col,name='bin.'+id;
 slab(name+'.saddle',{x:x+7,y:y+6,w:40,d:36,r:1.2},7,4,{tone:'mid'});
 slab(name+'.floor',{x,y,w:54,d:48,r:1},11,3,{tone:'lo',extra:k.lineSvg(k.planOutline({x:x+4,y:y+4,w:46,d:40,r:.7},14,P),{tone:'faint'})});
 for(const side of [0,52])slab(name+'.side.'+side,{x:x+side,y,w:2,d:48,r:.2},14,18,{tone:'mid'});
 slab(name+'.back',{x:x+2,y,w:50,d:2,r:.2},14,18,{tone:'mid'});
 // This front wall is a physical calibration panel, not sample volume.
 const frontY=y+48,panel=slab(name+'.front-panel',{x:x+2,y:y+46,w:50,d:2,r:.2},14,18,{tone:'hi'});
 const originWorld=[x+6,frontY+.04,18],worldU=[42,0,0],worldV=[0,0,10];
 const project=(u,v)=>k.iso(originWorld.map((q,i)=>q+u*worldU[i]+v*worldV[i]),P);
 const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>project(u,v));
 const C=project(0,0),U=project(1,0).map((q,i)=>q-C[i]),V=project(0,1).map((q,i)=>q-C[i]);
 const closed=corners.map((p,i)=>(i?'L':'M')+p.join(',')).join('')+'Z';
 // Register data ink at the panel item's measured depth, so front trays can
 // correctly hide anything behind them. Both bar and border share its plane.
 panel.svg+=`<defs><clipPath id="imf-readout-${id}"><path d="${closed}"/></clipPath></defs><g data-imf-bar-${id} clip-path="url(#imf-readout-${id})"></g><g data-imf-selection-${id} opacity="0"><path d="${closed}" fill="none" stroke="var(--anatomy-lit)" stroke-width="1.5"/></g>`;
 // Fixed calibration outline and quarter marks all terminate on that outline.
 const marks=[];for(let t=0;t<=4;t++){
  const a=project(t/4,0),b=project(t/4,.16);marks.push(`M${a.join(',')}L${b.join(',')}`);
 }
 panel.svg+=k.lineSvg(closed,{tone:'lo'})+k.lineSvg(marks.join(''),{tone:'lo'});
 round(name+'.mounting-screw',x+1,y+5,.7,32,.6,{tone:'hi',extra:k.dotsSvg([k.iso([x+1,y+5,32.6],P)],{size:.3,tone:'lo'})});
 bins.push({index:id,row:row===0?'back':'front',column:col,physical:{x,y,width:54,depth:48,floorZ:14,height:18},plane:{originWorld,uWorld:worldU,vWorld:worldV,corners,origin:C,basis:{u:U,v:V},mapping:'screen = origin + u*basis.u + v*basis.v; 0<=u,v<=1; u is fraction width, v is upward face height'},barHook:'data-imf-bar-'+id,selectionHook:'data-imf-selection-'+id,clipId:'imf-readout-'+id});
}
A.settle(R,P,{states:[0]});
const physical=R.items.slice().sort((a,b)=>a.key-b.key).map(item=>`<g data-imf-part="${item.name}">${item.svg}</g>`).join('');
const svg=k.figureSvg({width:W,height:H,label:'八个相同收样托盘构成的初生质量函数分样教学台；正面条形表示统计份额，不表示恒星体积或大小。',body:`<path class="iso-halo" d="${k.haloOf(base,-18,12,P)}"/>${physical}`});
fs.writeFileSync(path.join(REPO,'dist/assets/imf-sampler.svg'),svg);
const projection={P,width:W,height:H,parts:R.solids.length,items:R.items.length,bins,binOrder:'Back row (-y): bins 0–3 increasing world x, then front row (+y): bins 4–7 increasing world x. Captions must name this order explicitly.',partsList:parts,limits:'Statistical partitioning teaching analogy only; never literal stars inside a machine. All eight trays have identical dimensions and remain fixed. Bar ink uses the same linear 0–1 fraction scale on every front panel; it encodes sampled count fraction or sampled mass fraction as declared by runtime. It does not encode stellar radius, tray depth, density or physical accumulated material. Fixed bin edges are equal in log10 mass over [0.1,100] solar masses; parent owns sampling, normalization, quantile selection, readouts and labels.'};
fs.writeFileSync(path.join(REPO,'content/imf-sampler-projection.json'),JSON.stringify(projection,null,2)+'\n');
for(const theme of ['dark','light']){
 const fig=k.plateHtml({fig:'Fig 9.1',title:'八箱初生质量分样台',hint:'等尺寸箱 · 同一份额标尺',readout:'条形由抽样模型给出',body:`<div class="iso-stage">${svg}</div>`,caption:'后排按世界x从左到右为第1–4箱，前排同向为第5–8箱；八个质量区间等宽于log质量。正面条形只表示数目份额或质量份额，并非把真实恒星放进托盘，箱深、恒星尺寸与数量都无直接对应。所有实体固定，仅数据墨迹更新。'});
 fs.writeFileSync(path.join(QA,`imf-preview-${theme}.html`),k.pageHtml({title:'八箱初生质量分样台',theme,body:fig}));
}
console.log(`IMF sampler: ${R.solids.length} true solids / ${R.items.length} measured-depth items.`);
A.auditOrExit(R,P,{apart:false,frames:[0]});
