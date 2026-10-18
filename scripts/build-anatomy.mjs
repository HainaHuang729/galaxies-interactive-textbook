import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as k from '../vendor/anatomy/iso-kit.mjs';
import * as A from '../vendor/anatomy/audit.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),W=760,H=450;
const base={x:-138,y:-75,w:250,d:150,r:6};
const P=k.fitProjection([...k.boxCorners(base,-18,0),...k.boxCorners({x:-32,y:-31,w:20,d:62},4,61),...k.boxCorners({x:70,y:-60,w:25,d:120},4,37),...k.boxCorners({x:-120,y:-60,w:22,d:120},4,36)],W,H,{pad:32,azimuth:55,elevation:34});
const R=A.recorder(P),byId=new Map();
function slab(name,plan,z,h,{piece='base',move=[0,0,0],lit=false,tone='mid',extra='',pixel=null,ground=false}={}){
 const shape=R.solid(A.slab(plan,z,h,{name,ground},6));
 const svg=k.solidSvg(k.slabOf(plan,z,h,P,6,.35),{tone,lit})+extra;
 const item=R.put({name,piece,move,at:[plan.x+plan.w/2,plan.y+plan.d/2,z+h/2],shapes:[shape],svg});item.pixel=pixel;byId.set(name,item);return item;
}
function round(name,x,y,r,z,h,{extra='',tone='mid',piece='controls'}={}){const shape=R.solid(A.cylinder(x,y,r,z,h,{name}));const item=R.put({name,piece,at:[x,y,z+h/2],shapes:[shape],svg:k.solidSvg(k.cylinder(x,y,r,z,h,P,48,.25),{tone})+extra});byId.set(name,item);return item;}
for(const [i,[x,y]] of k.corners(base,18).entries())slab('stand.foot'+i,{x:x-6,y:y-6,w:12,d:12,r:2},-18,6,{ground:true,tone:'lo'});
slab('base.plate',base,-12,12,{extra:k.lineSvg(k.planOutline(k.insetPlan(base,4),0,P),{tone:'lo'})});
slab('base.bed',{x:-126,y:-62,w:226,d:124,r:3},0,4,{tone:'lo',extra:(()=>{let paths='';for(let x=-90;x<=60;x+=15)for(let y=-40;y<=35;y+=15)paths+=k.ring(x,y,.75,4,P,16);return k.lineSvg(paths,{tone:'faint'});})()});
slab('base.ruler',{x:-123,y:-70,w:218,d:6,r:1},0,.7,{extra:(()=>{const q=k.topTicks(-119,91,5,5,-69.3,.7,[2,4],P);return k.lineSvg(q.major+q.minor,{tone:'mid'});})()});
for(const [i,[x,y]] of k.corners(base,10).entries())round('base.fastener'+i,x,y,1.7,0,1,{piece:'base',tone:'hi',extra:k.dotsSvg([k.iso([x,y,1],P)],{size:.55,tone:'lo'})});
slab('source.track',{x:-116,y:-56,w:14,d:112,r:1},4,3);
for(const y of [-60,56])slab('source.stop'+y,{x:-120,y,w:22,d:4,r:1},4,8,{tone:'hi'});
for(const [piece,sign] of [['sourceL',-1],['sourceR',1]]){
 const cy=sign*3.5,move=[0,sign*38.5,0],o={piece,move};
 slab(piece+'.carriage',{x:-117,y:cy-3,w:16,d:6,r:.6},7,5,{...o,tone:'hi'});
 slab(piece+'.post',{x:-111,y:cy-2,w:4,d:4,r:.4},12,13,o);
 slab(piece+'.source',{x:-114,y:cy-3,w:10,d:6,r:.5},25,10,{...o,lit:true,extra:k.dotsSvg([k.iso([-103.7,cy,30],P)],{size:1.4,tone:'lit'})});
 slab(piece+'.cap',{x:-114,y:cy-3,w:10,d:6,r:.5},35,1,{...o,tone:'hi'});
}
slab('lens.base',{x:-32,y:-31,w:20,d:62,r:2},4,5,{piece:'lens',tone:'hi'});
for(const y of [-29,24])slab('lens.post'+y,{x:-25,y,w:7,d:5,r:.5},9,46,{piece:'lens'});
slab('lens.lower',{x:-25,y:-24,w:7,d:48,r:.4},9,5,{piece:'lens'});
slab('lens.upper',{x:-25,y:-29,w:7,d:58,r:.4},55,5,{piece:'lens',tone:'hi'});
slab('lens.glass',{x:-22,y:-24,w:2,d:48,r:0},14,41,{piece:'lens',tone:'lo'});
for(const y of [-27,27])round('lens.bolt'+y,-21.5,y,1.5,60,1,{piece:'lens',tone:'hi'});
slab('detector.base',{x:70,y:-60,w:25,d:120,r:2},4,5,{piece:'detector'});
for(const y of [-52,47])slab('detector.support'+y,{x:76,y,w:9,d:5,r:.5},9,14,{piece:'detector'});
slab('detector.carrier',{x:74,y:-54,w:14,d:108,r:1},23,2,{piece:'detector',tone:'lo'});
for(let i=0;i<16;i++)slab('detector.pixel'+i,{x:79,y:-48+6*i,w:4,d:5,r:.2},25,8,{piece:'detector',lit:true,pixel:i});
for(const y of [-58,54])slab('detector.stop'+y,{x:74,y,w:14,d:4,r:.5},23,14,{piece:'detector',tone:'hi'});
slab('controls.plinth',{x:-4,y:42,w:60,d:18,r:2},4,5,{piece:'controls'});
slab('controls.face',{x:-4,y:42,w:60,d:18,r:2},9,4,{piece:'controls',tone:'hi'});
for(const [i,x] of [10,30].entries()){
 round('controls.knob'+i,x,51,5,13,5,{extra:k.lineSvg(k.knurl(x,51,5,13,18,28,P),{tone:'lo'})+k.dotsSvg([k.iso([x,51,18],P)],{size:.65})});
}
for(let i=0;i<4;i++)slab('controls.key'+i,{x:42,y:44+i*3.5,w:7,d:2.4,r:.5},13,1,{piece:'controls',tone:'lo'});
const label={x:4,y:-55,w:50,d:10,r:1};slab('base.label',label,4,.7,{tone:'lo',extra:k.faceTextSvg(k.topMatrix([29,-50],4.7,P,'x'),'PSF',{size:4,tone:'mid',anchor:'middle'})});
for(const x of [8,50])round('base.rivet'+x,x,-50,1.1,4.7,.6,{piece:'base',tone:'hi'});
A.settle(R,P,{states:[0,.25,.5,.75,1]});
const items=R.items.slice().sort((a,b)=>a.key-b.key);
const content=items.map(item=>`<g data-bench-part="${item.name}" data-bench-piece="${item.piece}"${item.piece==='sourceL'||item.piece==='sourceR'?` transform="${k.translateAlong(P,[0,(item.piece==='sourceL'?-1:1)*17.5,0])}"`: ""}${item.pixel!==null&&item.pixel!==undefined?` data-bench-pixel="${item.pixel}"`:''}>${item.svg}</g>`).join('');
const svg=k.figureSvg({width:W,height:H,label:'分辨率测试台：双源滑台、成像元件、16单元探测器和两个旋钮；双源间距和探测器读数由同一高斯模型驱动。',body:content});
fs.writeFileSync(path.join(root,'dist/assets/resolution-bench.svg'),svg);
fs.writeFileSync(path.join(root,'dist/assets/resolution-bench-projection.json'),JSON.stringify({P,parts:R.solids.length,sourceScale:7,restSeparation:.5},null,2)+'\n');
const figure=k.plateHtml({fig:'Fig 2.1',title:'双源分辨率测试台',hint:'方向键改变双源间距',readout:'高斯 PSF · 同源模型',body:`<div class="iso-stage" tabindex="0" role="slider" aria-label="双源分辨率测试台" aria-valuemin="0.5" aria-valuemax="6" aria-valuenow="3">${svg}</div>`,caption:'教学结构：不是望远镜的真实工程图。分辨条件来自等亮、等宽高斯双源模型，不是Rayleigh判据。'});
const output=path.join(root,'../../work/anatomy');fs.mkdirSync(output,{recursive:true});for(const theme of ['dark','light'])fs.writeFileSync(path.join(output,`resolution-${theme}.html`),k.pageHtml({title:'双源分辨率测试台',theme,body:figure}));
console.log(`Resolution bench: ${R.solids.length} true solids, ${R.items.length} depth-sorted items.`);
A.auditOrExit(R,P,{frames:Array.from({length:21},(_,i)=>i/20),apart:true});
