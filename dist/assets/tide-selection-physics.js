(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TideSelectionPhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const velocityToGyr=1.022712165045695,G=4.30091e-6*velocityToGyr**2,magScale=2.5/Math.LN10;
 const check=(v,name,min=0)=>{if(!Number.isFinite(v)||v<min)throw new RangeError(name);return v;};
 function tideAt(x,baseline=.1){check(x,'radius');check(baseline,'baseline');const den=1+x*x,radial=(2*x*x-1)/den**2.5,transverse=-1/den**1.5,force=u=>-u/(1+u*u)**1.5,h=baseline/2;
  return {x,radial,transverse,trace:radial+2*transverse,density:3/(4*Math.PI*den**2.5),probeRadial:baseline===0?radial:(force(x+h)-force(x-h))/baseline,probeTransverse:-1/(den+h*h)**1.5};
 }
 function tide({mass=11,scale=5,radius=.5,baseline=.1}={}){check(mass,'mass');check(scale,'scale',1e-8);const M=10**mass,A=G*M/scale**3,p=tideAt(radius,baseline);return {...p,M,A,scale,R:radius*scale,length:baseline*scale,lambdaR:A*p.radial,lambdaT:A*p.transverse,physicalTrace:A*p.trace,physicalDensity:M/scale**3*p.density,probeR:A*p.probeRadial,probeT:A*p.probeTransverse,critical:Math.SQRT1_2};}
 function enclosed(x){check(x,'radius');if(x<.02){let term=x*x/2,sum=term;for(let n=1;n<30;n++){term*= -x*(n+1)/(n*(n+2));sum+=term;if(Math.abs(term)<Math.abs(sum)*2e-16)break;}return sum;}return -Math.expm1(-x)-x*Math.exp(-x);}
 function isophote({magnitude=20,size=3,limit=26}={}){check(magnitude,'magnitude',-100);check(size,'size',1e-8);check(limit,'limit',-100);const central=magnitude+2.5*Math.log10(2*Math.PI*size**2),x=Math.max(0,(limit-central)/magScale),fraction=enclosed(x),radius=size*x,selectedMagnitude=fraction>0?magnitude-2.5*Math.log10(fraction):null;
  return {magnitude,size,limit,central,x,radius,fraction,missed:1-fraction,selectedMagnitude,detected:fraction>0,mu:r=>central+magScale*r,growth:enclosed,relativeIntensity:r=>Math.exp(-r)};
 }
 return {G,velocityToGyr,magScale,tideAt,tide,enclosed,isophote};
});
