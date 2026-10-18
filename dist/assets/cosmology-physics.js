(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CosmologyPhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const C=299792.458, MPC_KM=3.0856775814913673e19, GYR_SECONDS=365.25*86400*1e9;
function model(H0=70,m=.3,r=.00009){if(!Number.isFinite(H0)||H0<=0||![m,r].every(Number.isFinite)||m<0||r<0||m+r>1+1e-12)throw new RangeError('Invalid flat cosmology');return {H0,m,r,l:Math.max(0,1-m-r)};}
function expansion(a){if(!(a>0))throw new RangeError('a must be positive');return {a,z:1/a-1,separation:100*a,wavelengthRatio:1/a};}
function components(a,p){if(!(a>0))throw new RangeError('a must be positive');const r=p.r/a**4,m=p.m/a**3,l=p.l,total=r+m+l;return {r:r/total,m:m/total,l:l/total,E:Math.sqrt(total),H:p.H0*Math.sqrt(total),q:(r+.5*m-l)/total};}
function integrate(f,a,b,tolerance=1e-9){if(a===b)return 0;if(a>b)return -integrate(f,b,a,tolerance);const c=(a+b)/2,fa=f(a),fb=f(b),fc=f(c),whole=(b-a)*(fa+4*fc+fb)/6;
 function step(a,b,fa,fb,fc,s,eps,depth){const c=(a+b)/2,d=(a+c)/2,e=(c+b)/2,fd=f(d),fe=f(e),left=(c-a)*(fa+4*fd+fc)/6,right=(b-c)*(fc+4*fe+fb)/6,delta=left+right-s;if(depth<=0||Math.abs(delta)<=15*eps)return left+right+delta/15;return step(a,c,fa,fc,fd,left,eps/2,depth-1)+step(c,b,fc,fb,fe,right,eps/2,depth-1);}
 return step(a,b,fa,fb,fc,whole,tolerance,22);
}
const hubbleTime=p=>MPC_KM/p.H0/GYR_SECONDS;
function age(a,p){if(!(a>0))return 0;if(p.m+p.r===0)return Infinity;return hubbleTime(p)*integrate(u=>u===0?0:2*u**3/Math.sqrt(p.r+p.m*u*u+p.l*u**8),0,Math.sqrt(a));}
function distances(z,p){if(!Number.isFinite(z)||z<0)throw new RangeError('z must be non-negative');const a=1/(1+z),dc=C/p.H0*integrate(u=>2*u/Math.sqrt(p.r+p.m*u*u+p.l*u**8),Math.sqrt(a),1),t=age(a,p),t0=age(1,p);return {z,a,dc,da:dc/(1+z),dl:dc*(1+z),age:t,lookback:hubbleTime(p)*integrate(u=>2*u**3/Math.sqrt(p.r+p.m*u*u+p.l*u**8),Math.sqrt(a),1),t0,mu:dc>0?5*Math.log10(dc*(1+z))+25:-Infinity,dim:1/(1+z)**4};}
function fluid(w,N){if(!Number.isFinite(w)||!Number.isFinite(N))throw new RangeError('Finite w and N required');return {a:Math.exp(N),density:Math.exp(-3*(1+w)*N),hubbleRadius:Math.exp((1+3*w)*N/2),accelerating:w< -1/3};}
return {C,MPC_KM,GYR_SECONDS,model,expansion,components,integrate,hubbleTime,age,distances,fluid};
});
