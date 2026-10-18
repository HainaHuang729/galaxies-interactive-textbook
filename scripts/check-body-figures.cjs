// Numerical and inventory checks for the shipped figure code, without a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const A=require('../dist/assets/advanced-physics.js');
const context={window:{AdvancedPhysics:A}};vm.createContext(context);
vm.runInContext(read('dist/assets/body-figure-geometry.js'),context);
const early=read('dist/assets/body-figures-early.js');
vm.runInContext(early.replace('}());','window.__growth=growth;window.__integrate=integrate;}());'),context);
vm.runInContext(read('dist/assets/body-figures-late.js'),context);
vm.runInContext(read('dist/assets/body-figures-physical.js'),context);
const W=context.window,records=JSON.parse(read('content/body-figures.json')).figures;
let checks=0;const near=(a,b,t=1e-10)=>{assert(Math.abs(a-b)<t,`${a} ≠ ${b}`);checks++;};
assert.equal(records.length,41);assert.equal(records.filter(r=>r.production==='code').length,30);
for(const chapter of Array.from({length:16},(_,i)=>i+1))assert(records.filter(r=>r.chapter===chapter).length>=2);
for(const r of records){const html=read('dist/'+r.page);assert.equal(html.split(`id="${r.id}"`).length-1,1);if(r.production==='code')for(const w of [260,288,358,768,1200]){const figure=W.BookFigureRenderers[r.renderer](w);assert(figure.height>0);assert(!/NaN|Infinity|undefined/.test(figure.svg));for(const f of figure.fields||[])assert(f.values.every(v=>Number.isFinite(v)&&v>=f.min&&v<=f.max));checks++;}}
// Matter-only analytic solution and independent flat-Lambda reference quadrature.
for(const a of [.01,.2,.5,1])near(W.__growth(a,1),a);
near(W.__growth(1),.7789810167708,1e-10);near(W.__growth(.5),.476585067771,1e-10);
near(W.__integrate(z=>1/Math.sqrt(.3*(1+z)**3+.7),0,1),.7714270664278);
const D=W.BookFigureLateDiagnostics;
assert(D.orbitData[0].minL<0&&D.orbitData[0].maxL>0&&D.orbitData[1].minL>0);assert(D.orbitData.every(v=>v.err<3e-4));checks+=2;
for(const [j,l,h] of [[0,9,12],[1,.2,1]])near(D.bins(D.joint,j,l,h,8).reduce((s,n)=>s+n,0),96);
near(D.simpson(z=>Math.cosh(z/.18)**-2/(2*.18),-2,2,1000),1,1e-8);
near(D.diskProjection(0,0,false),1);near(D.diskProjection(0,0,true),1);
for(const c of [0,.2,1.2,2])near(A.simpson(x=>A.forestDensity(x,c),0,100,8192)/100,1,1e-10);
// Exact periodic field: mean zero, periodic borders, no change in phase or shape.
const E=W.BookEarlyFigureModels;let mean=0,variance=0;for(let j=0;j<96;j++)for(let i=0;i<96;i++){const v=E.seedField(i/96,j/96);mean+=v;variance+=v*v;assert(Math.abs(v)<=1+1e-14);}
near(mean/(96*96),0);near(variance/(96*96),(1+.7**2+.4**2)/(2*2.1**2));
for(const [x,y]of [[.1,.3],[.8,.9]]){near(E.seedField(x,y),E.seedField(x+1,y));near(E.seedField(x,y),E.seedField(x,y+1));}
const model=W.BookPhysicalFigureModels;near(model.coldMass(0),1);near(model.coldMass(1.25),Math.exp(-1));
// The analytic disk and Gaussian bar each integrate to their assigned mass.
for(const f of [0,.25])near((1-f)*A.simpson(r=>r*Math.exp(-r),0,35,8192)+f,1,1e-10);
for(let x=0;x<=100;x+=.1){const delta=D.density(x),F=Math.exp(-.35*delta**1.65);assert(delta>0&&F>0&&F<=1);checks++;}
// Mean thin-shell echo delay is r/c and support is [0,2r/c].
near(D.simpson(mu=>(1-mu)/2,-1,1,1000),1);
for(const g of JSON.parse(read('content/observation-sources.json')).groups)for(const im of g.images){const file=path.join(root,'dist',im.path);if(im.distribution==='external_reference_only'&&!fs.existsSync(file))continue;const bytes=fs.readFileSync(file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),im.sha256);checks++;}
console.log(JSON.stringify({checks,figures:records.length,renderers:Object.keys(W.BookFigureRenderers).length,observationFiles:'original source hashes verified',orbitMaximumAbsoluteEnergyDrift:D.orbitData.map(v=>v.err)}));
