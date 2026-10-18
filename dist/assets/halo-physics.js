(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HaloPhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const G=4.30091e-6,H0=.07,dc=1.686,crit=3*H0*H0/(8*Math.PI*G),TAU=2*Math.PI;
function g(x){if(x<1e-4)return x*x*(.5+x*(-2/3+x*(.75-.8*x)));return Math.log1p(x)-x/(1+x);}
function halo(M,c){const R=Math.cbrt(3*M/(4*Math.PI*200*crit)),rs=R/c,rhos=M/(4*Math.PI*rs**3*g(c));return {M,c,R,rs,rhos,V:Math.sqrt(G*M/R)};}
function mass(h,r){return r<=0?0:h.M*g(r/h.rs)/g(h.c);}
function density(h,r){const x=r/h.rs;return x>0?h.rhos/(x*(1+x)**2):Infinity;}
function velocity(h,r){return r>0?Math.sqrt(G*mass(h,r)/r):0;}
function invertG(target,hi){let lo=0;for(let i=0;i<64;i++){const m=(lo+hi)/2;if(g(m)<target)lo=m;else hi=m;}return (lo+hi)/2;}
function convert(h,omega){let lo=h.c,hi=h.c*10;const target=omega*g(h.c)/h.c**3;for(let i=0;i<80;i++){const m=(lo+hi)/2;if(g(m)/m**3>target)lo=m;else hi=m;}const c=(lo+hi)/2,R=h.rs*c,M=mass(h,R);return {c,R,M};}
function erfc(x){if(x<0)return 2-erfc(-x);const t=1/(1+.5*x);return t*Math.exp(-x*x-1.26551223+t*(1.00002368+t*(.37409196+t*(.09678418+t*(-.18628806+t*(.27886807+t*(-1.13520398+t*(1.48851587+t*(-.82215223+t*.17087277)))))))));}
function ps(M,D,alpha){const nu=(M/1e13)**alpha/D,f=Math.sqrt(2/Math.PI)*nu*Math.exp(-nu*nu/2),fraction=alpha*f,rhobar=.3*crit*1e9;return {nu,f,fraction,above:erfc(nu/Math.SQRT2),number:rhobar/M*fraction,Mstar:1e13*D**(1/alpha)};}
function firstDensity(S,B){return S>0?B/Math.sqrt(TAU)*S**(-1.5)*Math.exp(-B*B/(2*S)):0;}
function firstCDF(S,B){return S>0?erfc(B/Math.sqrt(2*S)):0;}
function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function normal(random){return Math.sqrt(-2*Math.log(Math.max(1e-15,random())))*Math.cos(TAU*random());}
function walks(seed,count=12,steps=256,Smax=16){const r=rng(seed);return Array.from({length:count},()=>{let y=0;return Array.from({length:steps+1},(_,i)=>{if(i)y+=Math.sqrt(Smax/steps)*normal(r);return {S:i*Smax/steps,y};});});}
function crossing(path,B,end=Infinity){return path.find(p=>p.S<=end&&p.y>=B)||null;}
const amps=[.36,.24,.17,.12,.09,.06],phases=[.2,1.6,4.1,.8,3.3,5.2],modes=[1,2,3,5,8,13];
function peakField(R,threshold){const N=512,data=Array.from({length:N},(_,i)=>{const x=i*100/N;let raw=0,y=0;for(let j=0;j<modes.length;j++){const k=TAU*modes[j]/100,v=amps[j]*Math.cos(k*x+phases[j]);raw+=v;y+=v*Math.exp(-.5*(k*R)**2);}return {x,raw,y};});const peaks=data.filter((p,i)=>p.y>data[(i+N-1)%N].y&&p.y>=data[(i+1)%N].y);return {data,peaks,selected:peaks.filter(p=>p.y>=threshold)};}
function bias(nu){return 1+(nu*nu-1)/dc;}
function conditional(dS,dw){return {pdf:firstDensity(dS,dw),cdf:firstCDF(dS,dw),mode:dw*dw/3};}
function pairCatalog(width){const centers=[[24,32],[55,70],[82,32]],r=rng(1492);return centers.flatMap(([cx,cy],id)=>Array.from({length:30},()=>{const angle=TAU*r(),rad=width*Math.sqrt(r());return {x:cx+rad*Math.cos(angle),y:cy+rad*Math.sin(angle),id};}));}
function pairCounts(points,bin,bw=4){const lo=bin*bw,hi=lo+bw;let one=0,two=0;const links=[];for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){const a=points[i],b=points[j],r=Math.hypot(a.x-b.x,a.y-b.y);if(r>=lo&&r<hi){a.id===b.id?one++:two++;links.push([i,j,a.id===b.id]);}}return {lo,hi,one,two,total:one+two,links};}
return {G,H0,dc,crit,g,halo,mass,density,velocity,invertG,convert,erfc,ps,firstDensity,firstCDF,rng,normal,walks,crossing,peakField,bias,conditional,pairCatalog,pairCounts};
});
