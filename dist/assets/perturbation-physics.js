(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PerturbationPhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TAU=2*Math.PI;
const finite=(value,name)=>{if(!Number.isFinite(value))throw new RangeError(name+' must be finite');};
function integral(f,a,b,tolerance=1e-11){
  const c=(a+b)/2,fa=f(a),fb=f(b),fc=f(c),whole=(b-a)*(fa+4*fc+fb)/6;
  function refine(a,b,fa,fb,fc,s,eps,depth){const c=(a+b)/2,d=(a+c)/2,e=(c+b)/2,fd=f(d),fe=f(e),left=(c-a)*(fa+4*fd+fc)/6,right=(b-c)*(fc+4*fe+fb)/6,delta=left+right-s;
    if(depth===0||Math.abs(delta)<=15*eps)return left+right+delta/15;
    return refine(a,c,fa,fc,fd,left,eps/2,depth-1)+refine(c,b,fc,fb,fe,right,eps/2,depth-1);
  }
  return refine(a,b,fa,fb,fc,whole,tolerance,22);
}
// MBW Eq.4.72: pressureless, subhorizon growing mode; flat matter + Lambda, no radiation.
// The a'=a*u^2 substitution regularizes the lower integration endpoint.
function growingMode(a,omegaM){
  const ratio=(1-omegaM)/omegaM*a**3;
  if(omegaM===1)return {raw:a,f:1};
  const i=integral(u=>u**4/(1+ratio*u**6)**1.5,0,1);
  return {raw:5*a*Math.sqrt(1+ratio)*i,f:-1.5/(1+ratio)+1/(2*(1+ratio)**1.5*i)};
}
function growth(a,omegaM=.3){
  finite(a,'a');finite(omegaM,'omegaM');
  if(a<=0||omegaM<=0||omegaM>1)throw new RangeError('Require a>0 and 0<omegaM<=1');
  const omegaLambda=1-omegaM,E=Math.sqrt(omegaM/a**3+omegaLambda),omegaAtA=omegaM/(omegaM+omegaLambda*a**3),value=growingMode(a,omegaM),normalization=growingMode(1,omegaM).raw,normalized=value.raw/normalization;
  return {a,omegaM,omegaLambda,omegaAtA,E,raw:value.raw,normalized,normalizedD1:normalized,suppression:value.raw/a,f:value.f};
}
// MBW Eqs.4.29–4.30. Static background, tau=sqrt(4*pi*G*rho)*t.
// Both branches have delta(0)=delta0 and derivative(0)=0.
function jeans(lambdaRatio,tau,delta0=.01){
  finite(lambdaRatio,'lambdaRatio');finite(tau,'tau');finite(delta0,'delta0');
  if(lambdaRatio<=0||tau<0)throw new RangeError('Require lambdaRatio>0 and tau>=0');
  const omega2=1/lambdaRatio**2-1;
  if(Math.abs(omega2)<1e-12)return {delta:delta0,derivative:0,omega2,regime:'marginal'};
  if(omega2>0){const w=Math.sqrt(omega2);return {delta:delta0*Math.cos(w*tau),derivative:-delta0*w*Math.sin(w*tau),omega2,regime:'oscillating'};}
  const rate=Math.sqrt(-omega2);return {delta:delta0*Math.cosh(rate*tau),derivative:delta0*rate*Math.sinh(rate*tau),omega2,regime:'growing'};
}
// A chosen finite Fourier realization in a unit periodic box, not an observed data set.
function modeField(x,y,modes,growthFactor=1){
  finite(x,'x');finite(y,'y');finite(growthFactor,'growthFactor');
  if(!Array.isArray(modes))throw new TypeError('modes must be an array');
  let sum=0;
  for(const mode of modes){const {kx,ky,amplitude,phase=0}=mode;
    if(!Number.isInteger(kx)||!Number.isInteger(ky)||(kx===0&&ky===0))throw new RangeError('Mode wavevectors must be nonzero integer pairs');
    finite(amplitude,'amplitude');finite(phase,'phase');
    sum+=amplitude*Math.cos(TAU*(kx*x+ky*y)+phase);
  }
  return growthFactor*sum;
}
// A plane-symmetric specialization of MBW Eqs.4.101–4.102, before first shell crossing.
function zeldovich(q,strength,waves=1){
  finite(q,'q');finite(strength,'strength');
  if(strength<0||strength>=1||!Number.isInteger(waves)||waves<1)throw new RangeError('Require 0<=strength<1 and a positive integer wave count');
  const k=TAU*waves,linearDelta=strength*Math.cos(k*q),jacobian=1-linearDelta,density=1/jacobian;
  return {q,x:q-strength*Math.sin(k*q)/k,jacobian,density,delta:density-1,linearDelta};
}
// BBKS low-baryon CDM fit, MBW Eq.4.245. k in h/Mpc; gamma=Omega_m*h.
// Does not include baryon acoustic oscillations, massive-neutrino effects, or nonlinear evolution.
function transfer(k,gamma=.21){
  finite(k,'k');finite(gamma,'gamma');
  if(k<0||gamma<=0)throw new RangeError('Require k>=0 and gamma>0');
  if(k===0)return 1;
  const q=k/gamma;
  return Math.log1p(2.34*q)/(2.34*q)*(1+3.89*q+(16.1*q)**2+(5.46*q)**3+(6.71*q)**4)**(-.25);
}
// Corrected spherical top-hat window: author errata changes Eq.4.272 denominator to x^3.
function topHat(x){
  finite(x,'x');
  if(Math.abs(x)<.02){const y=x*x;return 1-y/10+y*y/280-y*y*y/15120;}
  return 3*(Math.sin(x)-x*Math.cos(x))/x**3;
}
return {growth,jeans,modeField,zeldovich,transfer,topHat};
});
