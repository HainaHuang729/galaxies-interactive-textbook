// Independent limit/scaling checks and regressions for chart/readout consistency.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),A=require('../dist/assets/advanced-physics.js'),D=require('../dist/assets/feedback-diagnostics-physics.js'),C=require('../dist/assets/cosmology-physics.js');let checks=0;
const ok=(v,msg)=>{assert.ok(v,msg);checks++;},near=(a,b,t=2e-12)=>ok(Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1e-15,Math.abs(b)),`${a} != ${b}`);
const atPoint=(name,p)=>{const r=A.evaluate(name,p);if(r.point){const curve=r.curves[name==='ram'?1:0];ok(curve.data.some(d=>d.x===r.point.x&&d.y===r.point.y),name+' selected analytical point is a drawing node');}return r;};
// All allowed parameter corners, plus a non-grid midpoint, for authored late chapters.
let states=0;
for(let chapter=9;chapter<=16;chapter++){const spec=require('../content/chapter-'+chapter+'.json');for(const lab of spec.labs){for(let mask=0;mask<2**lab.params.length;mask++){const p=Object.fromEntries(lab.params.map((v,i)=>[v.key,mask&(1<<i)?v.max:v.min]));atPoint(lab.model,p);states++;}atPoint(lab.model,Object.fromEntries(lab.params.map(p=>[p.key,p.min+(p.max-p.min)*.371])));states++;}}
const closed=A.evaluate('closed',{mu:1,yield:.02});ok(typeof closed.values[1]==='string','no stars means no stellar mean');
const disk=atPoint('expDisk',{mass:10,Rd:1,r:18});near(disk.point.y,1-19*Math.exp(-18));ok(disk.curves[0].data.at(-1).x>=18,'outer disk not clipped');
for(const mu of [.02,.371,1-1e-9]){const r=atPoint('closed',{mu,yield:.02});near(r.values[0],.02*Math.log(1/mu));if(mu<.999)near(r.values[1],.02*(1+mu*Math.log(mu)/(1-mu)));}
const friction=atPoint('friction',{mass:10,R:80,tau:.99});near(friction.values[1],8);near(friction.values[2],4.30091e-6*1e10/(200**2*8));ok(friction.validation?.level==='caution','current heavy satellite warning');ok(typeof A.evaluate('friction',{mass:10,R:80,tau:1}).values[2]==='string','origin mass ratio undefined');
const heat=atPoint('heatEnd',{h:.99});near(heat.values[0],100);ok(heat.curves[0].data.every(p=>p.x<1&&p.y>0),'no negative-radius branch');ok(!A.evaluate('heatEnd',{h:1}).point,'no bound marker past pole');
const tide=atPoint('tidalShock',{mass:12,b:20,V:450,r:3});near(tide.values[3],4.30091e-6*1e12/(20*450**2));ok(tide.validation.message.includes('引力聚焦'),'focused orbit warning');
const bubble=atPoint('ionBubble',{Q:54,n:-4,C:2,off:.1,time:.1});ok(bubble.curves[0].data.some(d=>d.x===.1),'switch-off drawing node');
const causal=atPoint('causalFront',{Q:52,n:-3,C:5,time:.1});near(causal.values[0],.00591204205443,3e-12);ok(causal.values[1]<=1,'front speed bound');
const thin=A.evaluate('thinDisk',{mass:8,mdot:1,rin:3});near(Math.max(...thin.curves[0].data.map(d=>d.y)),thin.values[0]);
const jet=A.evaluate('superluminal',{beta:.99,angle:15});near(Math.max(...jet.curves[0].data.map(d=>d.y)),.99/Math.sqrt(1-.99**2));
// Pure-Lambda lookback is finite even though age since a=0 is infinite.
const pure=C.model(70,0,0),v=C.distances(1,pure);near(v.lookback,9.682198880450364,2e-11);
const feedback=[];
for(const kind of ['blast','wind'])for(const nH of [.001,1])for(const time of [1,100])for(const temperature of [1e3,1e6]){
 const args={kind,nH,time,temperature,energy:1e50,luminosity:1e36,ejectaMass:5},r=D.evaluate(args),sound=Math.sqrt((5/3)*1.380649e-16*temperature/(.5*1.67262192369e-24));near(r.soundSpeed,sound);near(r.mach,r.state.v/sound);const other=D.evaluate({...args,temperature:temperature*2,ejectaMass:10});near(other.state.R,r.state.R);near(other.state.v,r.state.v);if(kind==='blast'){near(other.sweptToEjecta,r.sweptToEjecta/2);near(r.radiativeReferenceYr,4.3e4*nH**(-5/9)*.1**(2/9));}feedback.push({kind,nH,time,temperature,mach:r.mach,warnings:r.warnings});
}
const late=D.evaluate({kind:'blast',energy:1e50,nH:1,time:100,temperature:1e4});near(late.state.v/1e5,82.911714231096568,1e-11);ok(late.ageToRadiative>1&&late.warnings.some(s=>s.includes('辐射')),'late Sedov reference warning');
const weak=D.evaluate({kind:'wind',luminosity:1e36,nH:1,time:10,temperature:1e4});ok(weak.mach<1&&weak.warnings.some(s=>s.includes('声速')),'weak wind shock warning');
assert.throws(()=>D.evaluate({kind:'blast',time:0}));checks++;
const report={checks,authoredModelStates:states,feedback,scope:'Numerical consistency and explicitly stated approximation diagnostics, not validation of full physical realism.'};fs.writeFileSync(path.join(__dirname,'../docs/calculation-regressions-v28.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks,authoredModelStates:states}));
