const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('../dist/assets/advanced-physics.js'),E=require('../dist/assets/extension-physics.js');
const reference=require('./fixtures/whole-book-v36.json');
const glossary=require('../dist/assets/glossary.js')(require('../dist/glossary.json'));
const katex=require('../dist/assets/katex/katex.min.js'),math=require('../dist/assets/inline-math.js')(katex,require('../content/math/inline-vocabulary.json'));
let checks=0,maxLogLError=0,maxSfrRelativeError=0;
function ok(value,message){A(value,message);checks++;}
for(const row of reference.rows){
 const actual=Math.log10(P.matching(row.alpha).lum(row.mass));
 const error=Math.abs(actual-Number(row.logL));maxLogLError=Math.max(maxLogLError,error);
 ok(error<6e-6,'finite normalized matching / independent gamma integral');
}
for(const row of reference.sfr){
 const r=P.evaluate('cosmicSFR',row),data=r.curves[0].data,expected=+row.total;
 if(expected){const err=Math.abs(r.values[0]/expected-1);maxSfrRelativeError=Math.max(maxSfrRelativeError,err);ok(err<2e-9,'SFR independent gamma integral');}
 else ok(r.values[0]===0&&r.values[1]==='无星形成','zero normalization has no unique peak');
 ok(data.filter(d=>d.x<row.cut).every(d=>d.y===0),'zero below the threshold');
 if(row.cut>8){const at=data.filter(d=>d.x===row.cut);ok(at.length===2&&at[0].y===0,'draw discontinuity at the exact threshold');}
 if(row.eff){
  const peak=r.values[1];ok(data.some(d=>d.x===peak&&d.y===Math.max(...data.map(d=>d.y))),'exact peak is drawn');
  // Differentiate a separately expressed physical-mass product, not the peak formula.
  const f=m=>(m/1e12)**(-.9)*Math.exp(-m/(1e14*Math.exp(-row.z)))*(m/1e12)*Math.exp(-m/10**12.5);
  const m=10**peak,h=1e-4,derivative=(Math.log(f(m*Math.exp(h)))-Math.log(f(m*Math.exp(-h))))/(2*h);
  ok(peak===row.cut?derivative<=1e-8:Math.abs(derivative)<1e-8,'peak stationary or constrained to lower boundary');
 }
}
for(const raw of ['X^(β−γ)','D^(3+α)','Δ^(γeff−1)','x^(-1/2)','ZA A','r_rms/b']){
 const parts=math.parts(raw);ok(parts.every(p=>p.tex),'complete mathematical expression '+raw);
 parts.forEach(p=>katex.renderToString(p.tex,{throwOnError:true,strict:'error'}));
}
ok(math.parts('ZA A')[0].tex.includes('Z_{\\mathrm A}'),'inflow metallicity is a subscript, not a product');
for(const [alias,chapter,contexts,id]of [
 ['n',3,['thermal-nucleosynthesis','thermal-symbol','thermal'],'c3-n-neutron'],
 ['ρ0',8,['wind-lab-model','feedback'],'v36-c8-rho-ambient'],
 ['m',15,['matching-lab-model','halo-light'],'v36-match-m'],
 ['m',15,['counts-lab'],'c15-counts-m'],
 ['v',15,['matching-lab-model'],'v36-match-v'],
 ['δ_R',4,['smoothing-lab-model'],'v36-c4-smoothed-delta']]){
 A.deepEqual(glossary.resolve(alias,{chapter,contexts}).map(e=>e.id),[id]);checks++;
}
const v=E.smoothing(0),raw=Array.from({length:401},(_,i)=>v.value(i/4,false)),limit=1.08*Math.max(.25,...raw.map(Math.abs));
ok(Math.max(...raw)>.25,'regression would reveal old clipped curve');
ok(raw.every(y=>Math.abs(y)<limit),'full raw curve inside new fixed domain');
const spec=require('../content/chapter-15.json');
ok(!spec.labs.find(l=>l.id==='matching').formulaTex.join('').includes('infty'),'finite matching contract');

// Early chapters were previously absent from the main numerical runner.
// Check their defining equations with independently integrated ODEs or analytic limits.
const Cycle=require('../dist/assets/physics.js'),Cosmo=require('../dist/assets/cosmology-physics.js'),Growth=require('../dist/assets/perturbation-physics.js'),Obs=require('../dist/assets/observations-physics.js'),Collapse=require('../dist/assets/collapse-physics.js');
function near(a,b,rtol=1e-8,atol=1e-12){ok(Number.isFinite(a)&&Math.abs(a-b)<=atol+rtol*Math.abs(b),`${a} != ${b}`);}
function rk4(f,v,start,end,n){const h=(end-start)/n;v=v.slice();for(let i=0;i<n;i++){const t=start+i*h,k1=f(t,v),k2=f(t+h/2,v.map((x,j)=>x+h*k1[j]/2)),k3=f(t+h/2,v.map((x,j)=>x+h*k2[j]/2)),k4=f(t+h,v.map((x,j)=>x+h*k3[j]));v=v.map((x,j)=>x+h*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);}return v;}
for(const p of [{cooling:.1,depletion:.1,loading:5},{cooling:3,depletion:5,loading:0},{cooling:1,depletion:1.6,loading:1},{cooling:1,depletion:2,loading:1}]){
 const v=rk4((t,[hot,cold])=>[-hot/p.cooling,hot/p.cooling-(.6+p.loading)*cold/p.depletion,.6*cold/p.depletion,p.loading*cold/p.depletion],[1,0,0,0],0,6,24000),r=Cycle.gasState(6,p);
 for(const [i,key]of ['hot','cold','stars','outflow'].entries())near(r[key],v[i],2e-7,1e-30);near(v.reduce((a,b)=>a+b,0),1,0,5e-13);
}
for(const a of [.01,.2,1])for(const [m,r]of [[1,0],[0,1]]){
 const p=Cosmo.model(70,m,r),tH=Cosmo.hubbleTime(p);near(Cosmo.age(a,p),tH*(m?2*a**1.5/3:a*a/2),1e-10);
 const z=1/a-1;if(z<=99){const d=Cosmo.distances(z,p),dc=Cosmo.C/70*(m?2*(1-Math.sqrt(a)):1-a);near(d.dc,dc,1e-10);near(d.dl,(1+z)**2*d.da,1e-14);}
}
for(const omega of [.1,.3,1])for(const a of [.05,.371,1]){
 const start=Math.log(1e-5),end=Math.log(a),v=rk4((N,[D,V])=>{const q=omega/(omega+(1-omega)*Math.exp(3*N));return[V,-(2-1.5*q)*V+1.5*q*D];},[1e-5,1e-5],start,end,8000),r=Growth.growth(a,omega);
 near(r.raw,v[0],3e-10);near(r.f,v[1]/v[0],3e-10);
}
function quadrature(f,a,b,n=12000){const h=(b-a)/n;let sum=f(a)+f(b);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+i*h);return sum*h/3;}
for(const n of [1,4,8]){
 const density=s=>2*Math.PI*Math.exp(2*s)*Obs.surfaceDensity(Math.exp(s),n,1);
 near(quadrature(density,-30,20),1,1e-10);near(quadrature(density,-30,0),.5,1e-10);
 for(const q of [.2,1,6])near(Obs.enclosed(q,n),quadrature(density,-30,Math.log(q)),1e-9);
}
near(Collapse.spherical(Math.PI).densityRatio,9*Math.PI*Math.PI/16,1e-14);
near(Collapse.spherical(Math.PI).time,1,1e-14);near(Collapse.spherical(Math.PI).radius,1,1e-14);
near(Collapse.constants.collapseDeltaLinear,1.686470199841145,1e-14);

const report={checks,independentMatchingCases:reference.rows.length,independentSfrCases:reference.sfr.length,maxLogLErrorDex:maxLogLError,maxSfrRelativeError,scope:'Independent early-chapter ODE/analytic/quadrature checks, finite toy distributions and declared model domains; no claim of observational calibration.'};
fs.writeFileSync(path.join(__dirname,'../docs/whole-book-numerics-v36.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
