(function(scope){
  'use strict';
  const G=4.30091e-6, KPC_PER_KMS_GYR=0.9777922217;
  function gasState(t,p){
    const a=1/p.cooling,b=(.6+p.loading)/p.depletion;
    const hot=Math.exp(-a*t);
    const cold=Math.abs(b-a)<1e-8?a*t*hot:a*Math.exp(-Math.min(a,b)*t)*(-Math.expm1(-Math.abs(b-a)*t))/Math.abs(b-a);
    const converted=Math.max(0,1-hot-cold);
    const stars=converted*.6/(.6+p.loading),outflow=converted*p.loading/(.6+p.loading);
    return {t,hot,cold,stars,outflow,sfr:cold*10/p.depletion};
  }
  function gasHistory(p){return Array.from({length:301},(_,i)=>gasState(i/50,p));}
  function clocks(p){
    const mass=10**p.mass;
    const dyn=Math.PI/2*Math.sqrt(p.radius**3/(G*mass))*KPC_PER_KMS_GYR;
    return {freefall:dyn/Math.sqrt(2),dynamical:dyn,cooling:10**p.cool,starformation:p.cold/p.sfr,hubble:KPC_PER_KMS_GYR/.07};
  }
  const api={gasState,gasHistory,clocks};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.GalaxyPhysics=api;
})(typeof window!=='undefined'?window:globalThis);
