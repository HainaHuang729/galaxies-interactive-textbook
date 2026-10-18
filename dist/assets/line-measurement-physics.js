/* Original, explicitly limited observation models. Velocities are km/s; lengths kpc. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LineMeasurementPhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const c=299792.458,K=2*Math.sqrt(2*Math.log(2)),sqrt2pi=Math.sqrt(2*Math.PI);
 function finite(x,name,lo=0){if(!Number.isFinite(x)||x<lo)throw new RangeError(name);return x;}
 const gaussian=(v,s)=>Math.exp(-.5*(v/s)**2)/(sqrt2pi*s);
 // Integrate a standard Gaussian using its convergent power series for |x|<8.
 // Symmetry and analytic tails avoid cancellation in the plotted support.
 function cdf(x){if(x<=-9)return 0;if(x>=9)return 1;let term=x,sum=x;for(let n=1;n<240;n++){term*=x*x/(2*n+1);sum+=term;if(Math.abs(term)<Math.abs(sum)*2e-16)break;}return Math.max(0,Math.min(1,.5+sum*Math.exp(-x*x/2)/sqrt2pi));}
 function survival(x){if(x<2)return cdf(-x);let q=0;for(let n=220;n>=1;n--)q=n/(x+q);return Math.exp(-x*x/2)/sqrt2pi/(x+q);}
 function interval(lo,hi){return lo>=0?survival(lo)-survival(hi):hi<=0?survival(-hi)-survival(-lo):cdf(hi)-cdf(lo);}
 function spectral({stars=150,template=20,resolution=3000,calibration=1}={}){
  finite(stars,'stars');finite(template,'template',10);finite(resolution,'resolution',1);finite(calibration,'calibration',.01);
  const instrument=c/(K*resolution),before=Math.hypot(stars,template),observed=Math.hypot(before,instrument),estimated=calibration*instrument,radicand=stars**2+instrument**2*(1-calibration**2);
  const recovered=radicand<0?null:Math.sqrt(radicand),equivalentWidth=20;
  return {stars,template,resolution,instrument,before,observed,estimated,radicand,recovered,equivalentWidth,depth:equivalentWidth/(sqrt2pi*observed),fwhm:K*observed,profile:v=>equivalentWidth*gaussian(v,observed),intrinsic:v=>equivalentWidth*gaussian(v,before),lsf:v=>gaussian(v,instrument)};
 }
 function beam({dispersion=30,gradient=80,seeing=1,aperture=1}={}){
  finite(dispersion,'dispersion',1);finite(Math.abs(gradient),'gradient');finite(seeing,'seeing');finite(aperture,'aperture');
  const psfSigma=seeing/K,beamSigma=Math.abs(gradient)*psfSigma,apertureSigma=Math.abs(gradient)*aperture/Math.sqrt(12),core=Math.hypot(dispersion,beamSigma),halfWidth=Math.abs(gradient)*aperture/2,sigma=Math.hypot(core,apertureSigma);
  function profile(v){if(halfWidth===0)return gaussian(v,core);if(halfWidth<core*1e-3){const h=halfWidth/core,z=v/core;return gaussian(v,core)*(1+h*h*(z*z-1)/6+h**4*(z**4-6*z*z+3)/120);}return Math.max(0,interval((v-halfWidth)/core,(v+halfWidth)/core)/(2*halfWidth));}
  return {dispersion,gradient,seeing,aperture,psfSigma,beamSigma,apertureSigma,core,halfWidth,sigma,variance:dispersion**2+beamSigma**2+apertureSigma**2,profile,matched:v=>gaussian(v,sigma),intrinsic:v=>gaussian(v,dispersion),nonGaussian:halfWidth>0};
 }
 return {c,K,gaussian,cdf,spectral,beam};
});
