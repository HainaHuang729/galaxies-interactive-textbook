import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const REPO=process.env.GALAXIES_REPO||path.resolve(HERE,'..');
const PREVIEW=path.resolve(REPO,'work/anatomy-v30');fs.mkdirSync(PREVIEW,{recursive:true});
const k=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/iso-kit.mjs')));
const A=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/audit.mjs')));
// Figure: a fixed-slit line-readout teaching bench. The source, two slit leaves,
// aperture mount, detector panel and hardware are physical. A mathematical line
// profile is registered on the detector plane by runtime, not ray-traced here.
// No grating, wavelength calibration, optical dispersion or telescope is claimed.
// LOSVD and instrumental Gaussian width change the synthetic profile only;
// neither changes the fixed slit gap or the machine's physical dimensions.
const W=840,H=480,base={x:-160,y:-76,w:320,d:152,r:8};
const P=k.fitProjection([...k.boxCorners(base,-17,3),...k.boxCorners({x:-142,y:-48,w:284,d:96,r:0},3,55)],W,H,{pad:34,azimuth:48,elevation:36});
const R=A.recorder(P),parts=[];
function slab(name,plan,z,h,{tone='mid',lit=false,extra='',ground=false,hook=null}={}){
 const shape=R.solid(A.slab(plan,z,h,{name,ground},6));
 const item=R.put({name,at:[plan.x+plan.w/2,plan.y+plan.d/2,z+h/2],shapes:[shape],svg:k.solidSvg(k.slabOf(plan,z,h,P,6,.35),{tone,lit,inner:extra})});
 item.hook=hook;parts.push({name,kind:'rounded-prism',plan,z,h});return item;
}
function round(name,x,y,r,z,h,{tone='mid',extra=''}={}){
 const shape=R.solid(A.cylinder(x,y,r,z,h,{name}));
 const item=R.put({name,at:[x,y,z+h/2],shapes:[shape],svg:k.solidSvg(k.cylinder(x,y,r,z,h,P,40,.25),{tone,inner:extra})});
 parts.push({name,kind:'cylinder',x,y,r,z,h});return item;
}
for(const[i,[x,y]]of k.corners(base,19).entries())slab('base.foot.'+i,{x:x-7,y:y-7,w:14,d:14,r:3},-17,7,{tone:'lo',ground:true});
slab('base.plate',base,-10,10,{tone:'lo',extra:k.lineSvg(k.planOutline(k.insetPlan(base,4),0,P),{tone:'lo'})});
slab('base.deck',{x:-146,y:-63,w:292,d:126,r:4},0,3,{tone:'lo',extra:k.lineSvg(k.planOutline({x:-142,y:-59,w:284,d:118,r:3},3,P),{tone:'faint'})});
for(const[i,[x,y]]of k.corners(base,10).entries())round('base.fastener.'+i,x,y,1.7,0,1,{tone:'hi',extra:k.dotsSvg([k.iso([x,y,1],P)],{size:.45,tone:'lo'})});
for(const y of [-39,39]){
 slab('guide.rail.'+y,{x:-138,y:y-2,w:276,d:4,r:.6},3,4,{extra:k.lineSvg(k.lineOnTop([-138,y],[138,y],7,P),{tone:'faint'})});
 for(const x of [-142,138]){slab('guide.stop.'+x+'.'+y,{x,y:y-5,w:4,d:10,r:.7},3,7,{tone:'hi'});round('guide.stop-bolt.'+x+'.'+y,x+2,y,1,10,.7,{tone:'hi'});}
}
for(const y of [-59,53]){
 const strip={x:-133,y,w:266,d:5,r:.6},ticks=k.topTicks(-130,130,5,5,y,3.7,[1.6,3.6],P);
 slab('guide.ruler.'+y,strip,3,.7,{tone:'lo',extra:k.lineSvg(ticks.major,{tone:'mid'})+k.lineSvg(ticks.minor,{tone:'lo'})});
}
const plaque={x:-35,y:64,w:70,d:7,r:1};slab('base.plaque',plaque,0,.7,{tone:'lo',extra:k.lineSvg(k.lineOnTop([-24,66],[24,66],.7,P)+k.lineOnTop([-24,68],[15,68],.7,P),{tone:'lo',free:true})});
for(const x of [-30,30])round('base.plaque-rivet.'+x,x,67.5,.9,.7,.5,{tone:'hi'});
// Source assembly. A separate exit window is on the right-facing case wall.
slab('source.saddle',{x:-134,y:-43,w:39,d:86,r:1.5},7,4,{tone:'hi'});
slab('source.stem',{x:-124,y:-8,w:18,d:16,r:1},11,7);
slab('source.case',{x:-132,y:-15,w:35,d:30,r:2},18,27,{extra:k.lineSvg(k.sideSeam({x:-132,y:-15,w:35,d:30,r:2},36,P,6),{tone:'faint'})});
slab('source.lid',{x:-132,y:-15,w:35,d:30,r:2},45,2,{tone:'hi'});
slab('source.exit-window',{x:-97,y:-6,w:1.5,d:12,r:.2},25,13,{tone:'hi'});
for(const[i,x]of [-125,-105].entries())round('source.lid-fastener.'+i,x,0,1.2,47,.8,{tone:'hi',extra:k.dotsSvg([k.iso([x,0,47.8],P)],{size:.4,tone:'lo'})});
// The true slit opening is the empty interval -2.5 < y < 2.5 between leaves.
slab('slit.saddle',{x:-81,y:-43,w:20,d:86,r:1.2},7,4,{tone:'hi'});
slab('slit.bottom',{x:-77,y:-22,w:12,d:44,r:.8},11,7);
slab('slit.top',{x:-77,y:-22,w:12,d:44,r:.8},48,4,{tone:'hi'});
for(const y of [-22,19])slab('slit.side.'+y,{x:-77,y,w:12,d:3,r:.4},18,30);
for(const[side,y]of [['far',-19],['near',2.5]])slab('slit.leaf.'+side,{x:-73,y,w:4,d:16.5,r:.15},20,26,{tone:'hi',hook:'slit-leaf-'+side});
for(const x of [-74,-68])round('slit.top-fastener.'+x,x,0,1,52,.7,{tone:'hi'});
for(const y of [-15,15])round('slit.adjust-knob.'+y,-71,y,3.2,52,3,{tone:'mid',extra:k.lineSvg(k.knurl(-71,y,3.2,52,55,20,P),{tone:'lo'})});
// An open registration/mounting frame. It intentionally contains no invented
// grating or lens prescription; its opening stays open in both art and audit.
slab('optic.saddle',{x:-44,y:-43,w:25,d:86,r:1.2},7,4,{tone:'hi'});
slab('optic.stem',{x:-37,y:-7,w:11,d:14,r:.5},11,6);
slab('optic.frame-bottom',{x:-38,y:-17,w:13,d:34,r:.6},17,4);
slab('optic.frame-top',{x:-38,y:-17,w:13,d:34,r:.6},45,4,{tone:'hi'});
for(const y of [-17,13])slab('optic.frame-side.'+y,{x:-38,y,w:13,d:4,r:.5},21,24);
for(const y of [-12,12])round('optic.fastener.'+y,-31.5,y,1,49,.7,{tone:'hi'});
// Right panel is horizontal so the synthetic line distribution remains legible.
slab('detector.saddle',{x:4,y:-43,w:130,d:86,r:1.5},7,4,{tone:'hi'});
const detectorPlan={x:9,y:-30,w:120,d:60,r:2};
slab('detector.case',detectorPlan,11,9,{extra:k.lineSvg(k.sideSeam(detectorPlan,16,P,6),{tone:'faint'})});
slab('detector.panel',{x:14,y:-25,w:110,d:50,r:1},20,1,{tone:'lo',hook:'detector-panel'});
for(const[x,y,w,d]of [[9,-30,120,5],[9,25,120,5],[9,-25,5,50],[124,-25,5,50]])slab('detector.bezel.'+x+'.'+y,{x,y,w,d,r:.3},20,2,{tone:'hi'});
for(const[x,y]of [[11.5,-27.5],[126.5,-27.5],[11.5,27.5],[126.5,27.5]])round('detector.fastener.'+x+'.'+y,x,y,1,22,.7,{tone:'hi'});
for(const x of [119,127])round('detector.control.'+x,x,35,2.2,11,1.5,{tone:'mid'});
A.settle(R,P,{states:[0]});
const sorted=R.items.slice().sort((a,b)=>a.key-b.key);
const physical=sorted.map(item=>`<g data-line-part="${item.name}"${item.hook?` data-line-${item.hook}`:''}>${item.svg}</g>`).join('');
const point=(x,y,z=21.15)=>k.iso([x,y,z],P);
const bounds={x0:20,x1:118,y0:-20,y1:20,z:21.15};
const corners=[[bounds.x0,bounds.y0],[bounds.x1,bounds.y0],[bounds.x1,bounds.y1],[bounds.x0,bounds.y1]].map(([x,y])=>point(x,y));
const clipD=corners.map((p,i)=>(i?'L':'M')+p.join(',')).join('')+'Z';
// Dynamic data ink is non-material. The clipping plane is precisely registered;
// the parent runtime projects the same pure model that supplies its chart.
const svg=k.figureSvg({width:W,height:H,label:'固定双叶狭缝与水平探测面组成的谱线扫描教学台；不表示完整光栅光学设计。',body:`<defs><clipPath id="line-readout-plane"><path d="${clipD}"/></clipPath></defs><path class="iso-halo" d="${k.haloOf(base,-17,12,P)}"/>${physical}<g data-line-profile clip-path="url(#line-readout-plane)"></g><g data-line-scan-marker clip-path="url(#line-readout-plane)"></g>`});
fs.writeFileSync(path.join(REPO,'dist/assets/line-spread-bench.svg'),svg);
const projection={P,width:W,height:H,parts:R.solids.length,items:R.items.length,detector:{world:bounds,points:corners,origin:point(bounds.x0,bounds.y0),xEnd:point(bounds.x1,bounds.y0),yEnd:point(bounds.x0,bounds.y1),worldToSvg:{origin:point(0,0),xUnit:point(1,0).map((v,i)=>v-point(0,0)[i]),yUnit:point(0,1).map((v,i)=>v-point(0,0)[i])}},slit:{x:[-73,-69],yGap:[-2.5,2.5],z:[20,46],fixed:true},hooks:['data-line-part','data-line-slit-leaf-far','data-line-slit-leaf-near','data-line-detector-panel','data-line-profile','data-line-scan-marker'],partsList:parts,limits:'Teaching registration/readout bench only. Fixed slit opening; changing the Gaussian LOSVD/instrumental widths only changes a synthetic line profile, never the slit geometry. No invented grating ray paths, physical optical dispersion, detector calibration or full telescope engineering. Detector plane units are arbitrary display coordinates; the runtime must use the same pure line model as the data chart.'};
fs.writeFileSync(path.join(REPO,'content/line-spread-bench-projection.json'),JSON.stringify(projection,null,2)+'\n');
for(const theme of ['dark','light']){
 const fig=k.plateHtml({fig:'Fig 13.1',title:'固定狭缝谱线扫描台',hint:'固定狭缝 · 合成线型读出',readout:'扫描位置由数值模型给出',body:`<div class="iso-stage">${svg}</div>`,caption:'此装置仅说明谱向扫描的线型读出。固定双叶狭缝不随速度弥散变化；曲线与扫描读数由同一合成谱线模型给出。没有绘制或声称完整光栅、望远镜光学设计及真实探测器标定。'});
 fs.writeFileSync(path.join(PREVIEW,`line-preview-${theme}.html`),k.pageHtml({title:'固定狭缝谱线扫描台',theme,body:fig}));
}
console.log(`Line spread bench: ${R.solids.length} true solids, ${R.items.length} measured-depth items.`);
A.auditOrExit(R,P,{apart:false,frames:[0]});
