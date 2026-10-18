import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const PREVIEW=path.resolve(HERE,'../../../work/absorption-bench-v28');fs.mkdirSync(PREVIEW,{recursive:true});
const REPO=process.env.GALAXIES_REPO||path.resolve(HERE,'..');
const k=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/iso-kit.mjs')));
const A=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/audit.mjs')));
// Figure: 69 real parts. Two independent calibrated incoherent beams share no optics.
// Base group: 4 feet, plate, deck, 4 fasteners, 4 rails, 2 rulers, plaque + 2 rivets.
// Each channel: 3 rail saddles; source support/case/lid/aperture + 2 screws;
// cuvette floor/side walls/cap/transparent medium + 4 screws + dial;
// detector support/case/lid/aperture + 2 screws. Paths are light, never material rods.
const W=820,H=470,base={x:-153,y:-78,w:306,d:156,r:8};
const P=k.fitProjection([...k.boxCorners(base,-17,0),...k.boxCorners({x:-137,y:-66,w:274,d:132},0,45)],W,H,{pad:34,azimuth:48,elevation:31});
const R=A.recorder(P),items=new Map();
function slab(name,plan,z,h,{tone='mid',lit=false,extra='',ground=false,transfer=null,glass=false}={}){
 const shape=R.solid(A.slab(plan,z,h,{name,ground},6));
 let svg=k.solidSvg(k.slabOf(plan,z,h,P,6,.35),{tone,lit})+extra;
 if(glass)svg=`<g class="absorption-medium" style="opacity:.2">${svg}</g>`;
 const item=R.put({name,at:[plan.x+plan.w/2,plan.y+plan.d/2,z+h/2],shapes:[shape],svg});item.transfer=transfer;items.set(name,item);return item;
}
function round(name,x,y,r,z,h,{tone='mid',extra='',ground=false,transfer=null}={}){
 const shape=R.solid(A.cylinder(x,y,r,z,h,{name,ground}));
 const item=R.put({name,at:[x,y,z+h/2],shapes:[shape],svg:k.solidSvg(k.cylinder(x,y,r,z,h,P,40,.25),{tone})+extra});item.transfer=transfer;items.set(name,item);return item;
}
for(const [i,[x,y]]of k.corners(base,19).entries())slab('base.foot.'+i,{x:x-7,y:y-7,w:14,d:14,r:3},-17,7,{ground:true,tone:'lo'});
slab('base.plate',base,-10,10,{tone:'lo',extra:k.lineSvg(k.planOutline(k.insetPlan(base,4),0,P),{tone:'lo'})});
slab('base.deck',{x:-139,y:-66,w:278,d:132,r:3},0,3,{tone:'lo',extra:k.lineSvg(k.planOutline({x:-134,y:-61,w:268,d:122,r:2},3,P),{tone:'faint'})});
for(const[i,[x,y]]of k.corners(base,11).entries())round('base.screw.'+i,x,y,1.7,0,1,{tone:'hi',extra:k.dotsSvg([k.iso([x,y,1],P)],{size:.5,tone:'lo'})});
for(const cy of [-30,30])for(const sign of [-1,1])slab('rail.'+cy+'.'+sign,{x:-133,y:cy+sign*11-2,w:266,d:4,r:.6},3,3,{extra:k.lineSvg(k.lineOnTop([-133,cy+sign*11],[133,cy+sign*11],6,P),{tone:'faint'})});
for(const y of [-61,49]){
 const strip={x:-129,y,w:258,d:6,r:.8},ticks=k.topTicks(-125,125,5,5,y+.6,3.7,[1.8,3.7],P);
 slab('base.ruler.'+y,strip,3,.7,{tone:'lo',extra:k.lineSvg(ticks.major,{tone:'mid'})+k.lineSvg(ticks.minor,{tone:'lo'})});
}
for(const [channel,cy] of [['variable',-30],['fixed',30]]){
 for(const [which,x,w]of [['source',-127,40],['cell',-23,46],['detector',84,42]])slab(channel+'.'+which+'.saddle',{x,y:cy-16,w,d:32,r:1.2},6,4,{tone:'hi',extra:k.dotsSvg([k.iso([x+3,cy-13,10],P),k.iso([x+w-3,cy+13,10],P)],{size:.45,tone:'lo'})});
 slab(channel+'.source.stem',{x:-114,y:cy-5,w:10,d:10,r:.5},10,8);
 slab(channel+'.source.case',{x:-125,y:cy-9,w:33,d:18,r:2},18,14,{extra:k.lineSvg(k.sideSeam({x:-125,y:cy-9,w:33,d:18,r:2},24,P,6),{tone:'faint'})});
 slab(channel+'.source.lid',{x:-125,y:cy-9,w:33,d:18,r:2},32,2,{tone:'hi'});
 slab(channel+'.source.aperture',{x:-92,y:cy-4,w:2,d:8,r:.3},21,8,{tone:'hi',lit:channel==='variable'});
 for(const [j,x]of [-119,-98].entries())round(channel+'.source.screw.'+j,x,cy,1.2,34,.7,{tone:'hi',extra:k.dotsSvg([k.iso([x,cy,34.7],P)],{size:.4,tone:'lo'})});
 slab(channel+'.cell.floor',{x:-14,y:cy-14,w:28,d:28,r:1},10,3,{tone:'hi'});
 for(const [j,y]of [cy-14,cy+11].entries())slab(channel+'.cell.wall.'+j,{x:-14,y,w:28,d:3,r:.3},13,24);
 slab(channel+'.cell.cap',{x:-14,y:cy-14,w:28,d:28,r:1},37,3,{tone:'hi'});
 slab(channel+'.cell.medium',{x:-11,y:cy-11,w:22,d:22,r:0},13,24,{tone:'hi',glass:true,transfer:channel==='variable'?'medium-variable':'medium-fixed'});
 for(const[j,[x,y]]of [[-9,cy-10],[9,cy-10],[-9,cy+10],[9,cy+10]].entries())round(channel+'.cell.screw.'+j,x,y,1,40,.7,{tone:'hi',extra:k.dotsSvg([k.iso([x,y,40.7],P)],{size:.35,tone:'lo'})});
 round(channel+'.cell.dial',0,cy,4.5,40,4,{tone:channel==='variable'?'hi':'mid',transfer:'dial-'+channel,extra:k.lineSvg(k.knurl(0,cy,4.5,40,44,24,P),{tone:'lo'})+k.lineSvg(k.lineOnTop([0,cy],[4.5,cy],44,P),{tone:'hi'})+k.dotsSvg([k.iso([0,cy,44],P)],{size:.45,tone:'hi'})});
 slab(channel+'.detector.stem',{x:100,y:cy-5,w:10,d:10,r:.5},10,6);
 slab(channel+'.detector.case',{x:93,y:cy-11,w:25,d:22,r:2},16,18,{extra:k.lineSvg(k.sideSeam({x:93,y:cy-11,w:25,d:22,r:2},26,P,6),{tone:'faint'})});
 slab(channel+'.detector.lid',{x:93,y:cy-11,w:25,d:22,r:2},34,2,{tone:'hi'});
 slab(channel+'.detector.aperture',{x:90,y:cy-5,w:3,d:10,r:.3},20,10,{tone:'hi',transfer:'detector-'+channel});
 for(const[j,x]of [99,112].entries())round(channel+'.detector.screw.'+j,x,cy,1.2,36,.7,{tone:'hi',extra:k.dotsSvg([k.iso([x,cy,36.7],P)],{size:.4,tone:'lo'})});
}
const label={x:-38,y:57,w:76,d:7,r:1};slab('base.calibration-plaque',label,3,.7,{tone:'lo',extra:k.lineSvg(k.lineOnTop([-24,59],[23,59],3.7,P)+k.lineOnTop([-24,61],[17,61],3.7,P),{tone:'lo',free:true})});
for(const x of [-33,33])round('base.plaque-rivet.'+x,x,60.5,.9,3.7,.5,{tone:'hi'});
A.settle(R,P,{states:[0]});
const sorted=R.items.slice().sort((a,b)=>a.key-b.key);
const physical=sorted.map(item=>`<g data-absorption-part="${item.name}"${item.transfer?` data-transfer-part="${item.transfer}"`:''}>${item.svg}</g>`).join('');
// Light is an illustrative overlay, not a material body. The beams end on real source/cell/detector surfaces.
const beams=[];for(const[channel,y]of [['variable',-30],['fixed',30]])for(const[part,xa,xb]of [['in',-90,-11],['through',-11,11],['out',11,90]]){
 const a=k.iso([xa,y,25],P),b=k.iso([xb,y,25],P);
 beams.push(`<g data-transfer-part="beam-${channel}-${part}" class="absorption-beam absorption-beam-${channel}" style="--beam-ink:${channel==='variable'?'#d3aa70':'#79b8bc'};opacity:${part==='in'?.75:.48}"><path d="M${a[0]},${a[1]}L${b[0]},${b[1]}" fill="none" stroke="var(--beam-ink)" stroke-width="5" stroke-linecap="butt" opacity=".12"/><path data-transfer-ray d="M${a[0]},${a[1]}L${b[0]},${b[1]}" fill="none" stroke="var(--beam-ink)" stroke-width="1.6" stroke-linecap="butt"/></g>`);
}
const svg=k.figureSvg({width:W,height:H,label:'双通道纯吸收光度计教学结构：独立的可调吸收池与固定吸收池，各有校准光源和独立探测器。',body:`<path class="iso-halo" d="${k.haloOf(base,-17,12,P)}"/>${physical}${beams.join('')}`});
fs.writeFileSync(path.join(REPO,'dist/assets/absorption-bench.svg'),svg);
const projection={P,width:W,height:H,parts:R.solids.length,items:R.items.length,channels:{variable:{y:-30,z:25,source:-90,cell:[-11,11],detector:90},fixed:{y:30,z:25,source:-90,cell:[-11,11],detector:90}},limits:'Independent calibrated incoherent beams; pure absorption; schematic cells and detectors; no telescope engineering, photon statistics or encoded speed of light.'};
fs.writeFileSync(path.join(REPO,'content/absorption-bench-projection.json'),JSON.stringify(projection,null,2)+'\n');
for(const theme of ['dark','light']){
 const fig=k.plateHtml({fig:'Fig 16.1',title:'双通道吸收光度计',hint:'独立光束 · 纯吸收示意',readout:'两路探测 · 外部求和',body:`<div class="iso-stage">${svg}</div>`,caption:'两束独立校准非相干光分别经过τ与0.1的纯吸收池；探测信号是f exp(−τ)和(1−f)exp(−0.1)。装置是教学类比，不是望远镜工程图；光路动效不代表光速或真实光子统计。'});
 fs.writeFileSync(path.join(PREVIEW,`preview-${theme}.html`),k.pageHtml({title:'双通道吸收光度计',theme,body:fig}));
}
console.log(`Absorption bench: ${R.solids.length} true solids, ${R.items.length} measured-depth items.`);
A.auditOrExit(R,P,{apart:false,frames:[0]});
