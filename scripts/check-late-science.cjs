// Independent transfer limits and metadata/model contracts for chapters 12–16.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../dist/assets/advanced-physics.js');let checks=0;
function near(a,b,rel=1e-9,abs=1e-12){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=abs+rel*Math.abs(b),`${a} != ${b}`);checks++;}
// Equation 16.83 is a transfer solution, bounded by the source/background temperatures.
// Independently propagate the slab with RK4 rather than reusing its exponential solution.
function transfer(Tin,Ts,tau){let T=Tin;const n=4096,h=tau/n;for(let i=0;i<n;i++){const k1=Ts-T,k2=Ts-(T+h*k1/2),k3=Ts-(T+h*k2/2),k4=Ts-(T+h*k3);T+=h*(k1+2*k2+2*k3+k4)/6;}return T;}
for(const z of [6,10,25])for(const T of [2,20,300])for(const y of [0,2,20])for(const x of [0,.25,1]){
 const r=A.evaluate('spin21',{z,T,y,x}),Ts=r.values[0],cmb=2.7255*(1+z),tau=.028*Math.sqrt((1+z)/10)*x*(1+z)/Ts;
 near(r.values[1],1000*(transfer(cmb,Ts,tau)-cmb)/(1+z),1e-8,1e-9);
 assert.ok(r.values[1]>=-1000*cmb/(1+z));checks++;
 if(y===0||x===0)near(r.values[1],0,1e-8,1e-10);
 for(const d of r.curves[0].data)assert.ok(d.y>=-1000*cmb/(1+z));checks++;
}
const cold=A.evaluate('spin21',{z:25,T:2,y:20,x:1}),Ts=cold.values[0],thin=28*Math.sqrt(2.6)*(1-2.7255*26/Ts);
assert.ok(Math.abs(cold.values[1]/thin)<.9);checks++;
const hot=A.evaluate('spin21',{z:6,T:300,y:20,x:.001}),hotThin=.028*Math.sqrt(.7)*.001*(1-2.7255*7/hot.values[0])*1000;
near(hot.values[1],hotThin,1e-6);
// The synthetic density uses the actual finite window, not a lognormal variance guess.
for(const contrast of [0,.25,1,2])near(A.simpson(s=>A.forestDensity(s,contrast),0,100,16384)/100,1,1e-10);
// The displayed formula and source notes must describe the live upgraded model.
const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/chapter-16.json'),'utf8'));
const lab=id=>spec.labs.find(l=>l.id===id);
assert.ok(lab('forest').formulaTex.some(v=>v.includes('int_0^{100}')));checks++;
assert.ok(!lab('forest').formula.includes('0.17'));checks++;
assert.ok(lab('absorption-line').formula.includes('H(a,v/b)'));checks++;
assert.ok(lab('spin-21').formulaTex.some(v=>v.includes('1-e^{-\\tau_{21}}')));checks++;
// Extreme SF histories must remain normalized on their actual nonuniform plotting grid.
function area(data){return data.slice(1).reduce((s,d,i)=>s+(d.x-data[i].x)*(d.y+data[i].y)/2,0);}
for(const age of [1,8,12])for(const sf of [.2,1,8])for(const light of [.1,.2,1,3]){
 const r=A.evaluate('sfh',{age,sf,light});for(const c of r.curves)near(area(c.data),1,8e-5);
 // Independent fine Simpson integration of the original mass times response kernel.
 const norm=A.simpson(a=>Math.exp(-(age-a)/sf),0,age,32768),raw=a=>Math.exp(-(age-a)/sf-a/light)/norm,L=A.simpson(raw,0,age,32768);
 near(r.values[0],A.simpson(a=>a*Math.exp(-(age-a)/sf)/norm,0,age,32768),1e-9);
 near(r.values[1],A.simpson(a=>a*raw(a),0,age,32768)/L,1e-9);
 near(r.values[2],L,1e-9,1e-35);
 assert.ok(r.values[1]<=r.values[0]+1e-12);checks++;
}
const equal=A.evaluate('sfh',{age:12,sf:.2,light:.2});near(equal.values[1],6);
// Every fluid curve contains the minimum and both stability boundaries when Q<1.
for(const kappa of [20,40,100])for(const cs of [5,10,25])for(const Sigma of [10,50,200]){
 const r=A.evaluate('toomre',{kappa,cs,Sigma}),Q=r.values[0],data=r.curves[0].data;
 assert.ok(r.point.x<=r.xDomain[1]);checks++;
 near(Math.min(...data.map(d=>d.y)),1-1/(Q*Q));
 if(Q<1){const zeros=data.filter(d=>d.y===0);assert.ok(zeros.length>=2);checks++;near(zeros[0].x*zeros.at(-1).x,1);assert.ok(data.at(-1).y>0);checks++;}
}
console.log(`${checks} total science checks including independent SFH integrals and Toomre domains passed.`);
