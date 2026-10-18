import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url)),REPO=process.env.GALAXIES_REPO||path.resolve(HERE,'..');
const QA=path.resolve(REPO,'work/anatomy-v31');fs.mkdirSync(QA,{recursive:true});
const k=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/iso-kit.mjs')));
const G=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/lathe.mjs')));
const A=await import(pathToFileURL(path.join(REPO,'vendor/anatomy/audit.mjs')));
// Figure. Planned and counted before geometry in work/anatomy-v31/tidal-parts-plan.md.
// 69 physical parts: base 10; plaque/rulers 5; four endpoint stacks 24;
// hub support 4; rigid half-baselines 4; two mounted dial assemblies 22.
// This object reads a computed tensor: the fixed rods and blocks do not deform.
// No gravimeter elasticity, instrument sensitivity, measurement noise or real
// actuation is inferred. Runtime creates data-ink needles from the same pure
// Plummer model as the chart, not from any pictured spring/rod displacement.
const W=830,H=490,base={x:-154,y:-91,w:308,d:182,r:8};
const P=k.fitProjection([...k.boxCorners(base,-18,3),...k.boxCorners({x:-131,y:-76,w:248,d:152,r:0},3,45)],W,H,{pad:36,azimuth:47,elevation:39});
const R=A.recorder(P),parts=[];
function slab(name,plan,z,h,{tone='mid',extra='',ground=false}={}){
 const shape=R.solid(A.slab(plan,z,h,{name,ground},6));
 const item=R.put({name,at:[plan.x+plan.w/2,plan.y+plan.d/2,z+h/2],shapes:[shape],svg:k.solidSvg(k.slabOf(plan,z,h,P,6,.4),{tone,inner:extra})});parts.push({name,kind:'rounded-prism',plan,z,h});return item;
}
function round(name,x,y,r,z,h,{tone='mid',extra=''}={}){
 const shape=R.solid(A.cylinder(x,y,r,z,h,{name}));
 const item=R.put({name,at:[x,y,z+h/2],shapes:[shape],svg:k.solidSvg(k.cylinder(x,y,r,z,h,P,64,.3),{tone,inner:extra})});parts.push({name,kind:'cylinder',x,y,r,z,h});return item;
}
function bezel(name,x,y,z,h,ri,ro){
 // Split the true annular body into camera-back/front halves. A raised annulus
 // wraps its inset face; one unsplit item cannot have a correct painter order.
 const a=(P.azimuth??45)*Math.PI/180;
 for(const [half,from]of [['back',a+Math.PI/2],['front',a-Math.PI/2]]){
  const ring=[];for(let i=0;i<=48;i++){const t=from+i*Math.PI/48;ring.push([x+ro*Math.cos(t),y+ro*Math.sin(t)]);}
  for(let i=48;i>=0;i--){const t=from+i*Math.PI/48;ring.push([x+ri*Math.cos(t),y+ri*Math.sin(t)]);}
  const n=name+'.'+half,shape=R.solid(A.extruded(ring,z,h,{name:n}));
  R.put({name:n,at:[x,y,z+h/2],shapes:[shape],svg:k.solidSvg(k.extrude(ring,z,h,P,{convex:false,bevel:.25}),{tone:'hi'})});
  parts.push({name:n,kind:'half-annular-prism',x,y,z,h,ri,ro,from,span:Math.PI});
 }
}
for(const[i,[x,y]]of k.corners(base,19).entries())slab('base.foot.'+i,{x:x-7,y:y-7,w:14,d:14,r:3},-18,7,{tone:'lo',ground:true});
slab('base.plate',base,-11,11,{tone:'lo',extra:k.lineSvg(k.planOutline(k.insetPlan(base,4),0,P),{tone:'lo'})});
slab('base.deck',{x:-140,y:-78,w:280,d:156,r:4},0,3,{tone:'lo',extra:k.lineSvg(k.planOutline({x:-135,y:-73,w:270,d:146,r:3},3,P),{tone:'faint'})});
for(const[i,[x,y]]of k.corners(base,10).entries())round('base.screw.'+i,x,y,1.6,0,1,{tone:'hi',extra:k.dotsSvg([k.iso([x,y,1],P)],{size:.45,tone:'lo'})});
slab('base.plaque',{x:-39,y:80,w:78,d:7,r:1},0,.8,{tone:'lo',extra:k.lineSvg(k.lineOnTop([-28,82],[27,82],.8,P)+k.lineOnTop([-28,84],[18,84],.8,P),{tone:'lo',free:true})});
for(const x of [-34,34])round('base.plaque-rivet.'+x,x,83.5,.9,.8,.5,{tone:'hi'});
for(const y of [-78,71]){const ticks=k.topTicks(-129,129,6,5,y,3.7,[1.8,3.4],P);slab('base.rule.'+y,{x:-132,y,w:264,d:5,r:.6},3,.7,{tone:'lo',extra:k.lineSvg(ticks.major,{tone:'mid'})+k.lineSvg(ticks.minor,{tone:'lo'})});}
const center=[-65,-10],ends=[{id:'r-minus',x:-116,y:-10},{id:'r-plus',x:-14,y:-10},{id:'t-minus',x:-65,y:-61},{id:'t-plus',x:-65,y:41}];
for(const{id,x,y}of ends){
 slab(id+'.plinth',{x:x-12,y:y-12,w:24,d:24,r:1.5},3,4,{tone:'hi'});
 round(id+'.collar',x,y,5.5,7,3,{tone:'mid'});
 round(id+'.post',x,y,2.8,10,15,{tone:'mid',extra:k.lineSvg(k.sideArc(x,y,2.8,17,P),{tone:'faint'})});
 slab(id+'.seat',{x:x-8,y:y-8,w:16,d:16,r:1},25,3,{tone:'mid'});
 slab(id+'.test-mass',{x:x-6,y:y-6,w:12,d:12,r:.6},28,12,{tone:'hi',extra:k.lineSvg(k.planOutline({x:x-4.2,y:y-4.2,w:8.4,d:8.4,r:.4},40,P),{tone:'faint'})});
 round(id+'.top-fastener',x,y,1.2,40,.8,{tone:'hi',extra:k.dotsSvg([k.iso([x,y,40.8],P)],{size:.4,tone:'lo'})});
}
round('hub.base',...center,7,3,4,{tone:'hi'});round('hub.post',...center,3.3,7,21);round('hub.body',...center,7,28,9,{tone:'hi'});round('hub.cap',...center,4.5,37,2,{tone:'hi',extra:k.lineSvg(k.knurl(...center,4.5,37,39,24,P),{tone:'lo'})});
// Half-baselines stop at the exact test-block and hub surfaces. Orthogonal x/y.
slab('baseline.r-minus',{x:-110,y:-11.5,w:38,d:3,r:0},32,3);
slab('baseline.r-plus',{x:-58,y:-11.5,w:38,d:3,r:0},32,3);
slab('baseline.t-minus',{x:-66.5,y:-55,w:3,d:38,r:0},32,3);
slab('baseline.t-plus',{x:-66.5,y:-3,w:3,d:38,r:0},32,3);
const gauges={},needleLayers=[];
for(const[id,cy]of [['r',-43],['t',43]]){
 const cx=87;
 slab('dial.'+id+'.plinth',{x:53,y:cy-22,w:68,d:44,r:2},3,4,{tone:'hi'});
 round('dial.'+id+'.foot',cx,cy,7,7,4,{tone:'mid'});
 round('dial.'+id+'.stem',cx,cy,3.8,11,14,{tone:'mid',extra:k.lineSvg(k.sideArc(cx,cy,3.8,18,P),{tone:'faint'})});
 round('dial.'+id+'.case',cx,cy,26,25,9,{tone:'mid',extra:k.lineSvg(k.sideArc(cx,cy,26,30,P),{tone:'lo'})});
 const z=35,rad=20,min=-1.05,max=.3,start=-3*Math.PI/4,sweep=3*Math.PI/2;
 const dialPoint=(a,r)=>[cx+r*Math.sin(a),cy-r*Math.cos(a)];
 // A full engraved circular scale roots every tick; no floating line ends.
 let marks=k.lineSvg(k.ring(cx,cy,rad,z,P,96),{tone:'lo'});
 for(let i=0;i<=27;i++){
  const a=start+sweep*i/27,inner=rad-(i%5===0||i===21?3.6:2.1);
  marks+=k.lineSvg(k.lineOnTop(dialPoint(a,inner),dialPoint(a,rad),z,P),{tone:i===21?'hi':i%5===0?'mid':'lo'});
 }
 marks+=k.dotsSvg([k.iso([cx,cy,z],P)],{size:1.2,tone:'hi'});
 round('dial.'+id+'.face',cx,cy,23,34,1,{tone:'lo',extra:marks});
 bezel('dial.'+id+'.bezel',cx,cy,34,3,23,26);
 // The crown attaches by a visible lug on the outer case wall.
 slab('dial.'+id+'.crown-lug',{x:cx+26,y:cy-3,w:5,d:6,r:.5},28,5);
 round('dial.'+id+'.crown',cx+28.5,cy,3,33,4,{tone:'mid',extra:k.lineSvg(k.knurl(cx+28.5,cy,3,33,37,20,P),{tone:'lo'})});
 for(const x of [58,116])round('dial.'+id+'.mount-screw.'+x,x,cy,1.2,7,.8,{tone:'hi'});
 const C=k.iso([cx,cy,35.08],P),U=k.iso([cx+1,cy,35.08],P).map((v,i)=>v-C[i]),V=k.iso([cx,cy+1,35.08],P).map((v,i)=>v-C[i]);
 gauges[id]={center:C,worldCenter:[cx,cy,35.08],worldPlaneBasis:{u:[1,0,0],v:[0,1,0]},basis:{u:U,v:V},radius:16,faceRadius:23,scaleRadius:rad,scale:{min,max,startAngle:start,sweep,angleConvention:'point = center + radius * (sin(angle)*worldX - cos(angle)*worldY); increasing clockwise in xy plane'},clipId:'tidal-dial-'+id};
 const clip=k.ring(cx,cy,21.5,35.08,P,96);
 needleLayers.push(`<defs><clipPath id="tidal-dial-${id}"><path d="${clip}"/></clipPath></defs><g data-tidal-needle-${id} clip-path="url(#tidal-dial-${id})"></g>`);
}
A.settle(R,P,{states:[0]});
const physical=R.items.slice().sort((a,b)=>a.key-b.key).map(item=>`<g data-tidal-part="${item.name}">${item.svg}</g>`).join('');
const svg=k.figureSvg({width:W,height:H,label:'两个固定正交短基线、四个独立支撑的试验质量及双刻度盘组成的潮汐梯度计算读出仪。',body:`<path class="iso-halo" d="${k.haloOf(base,-18,12,P)}"/>${physical}${needleLayers.join('')}`});
fs.writeFileSync(path.join(REPO,'dist/assets/tidal-gradiometer.svg'),svg);
const projection={P,width:W,height:H,parts:R.solids.length,items:R.items.length,gauges,baseline:{center:[...center,33.5],radial:{unit:[1,0,0],endpoints:[[-116,-10,34],[-14,-10,34]]},transverse:{unit:[0,1,0],endpoints:[[-65,-61,34],[-65,41,34]]},fixed:true,dotProduct:0},hooks:['data-tidal-part','data-tidal-needle-r','data-tidal-needle-t'],partsList:parts,limits:'Computational readout teaching rig only. The two physical baselines are fixed and orthogonal. Runtime must read dimensionless Plummer tidal eigenvalues lambda/(GM/a^3) from the same pure model as the chart. No sensing elasticity, dynamics, force calibration, finite-baseline response or measurement noise is simulated. Dial scales are identical; one lit ink tone is reserved for runtime needle readout.'};
fs.writeFileSync(path.join(REPO,'content/tidal-gradiometer-projection.json'),JSON.stringify(projection,null,2)+'\n');
for(const theme of ['dark','light']){
 const fig=k.plateHtml({fig:'Fig 12.1',title:'双轴潮汐梯度读出仪',hint:'正交固定基线 · 双盘同刻度',readout:'指针由计算模型驱动',body:`<div class="iso-stage">${svg}</div>`,caption:'四个独立支撑的试验块定义两个固定正交基线；两表盘读出同一球势模型的径向与横向无量纲潮汐梯度。装置为计算读出类比，未模拟传感器弹性、噪声或真实有限基线测量。'});
 fs.writeFileSync(path.join(QA,`tidal-preview-${theme}.html`),k.pageHtml({title:'双轴潮汐梯度读出仪',theme,body:fig}));
}
console.log(`Tidal gradiometer: ${R.solids.length} true solids / ${R.items.length} measured-depth items.`);
A.auditOrExit(R,P,{apart:false,frames:[0]});
