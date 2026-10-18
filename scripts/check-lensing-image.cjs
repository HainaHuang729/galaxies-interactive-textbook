'use strict';
const assert=require('node:assert/strict');
const P=require('../dist/assets/probe-physics.js');
// The independent reference integrates on the source plane with the point-lens
// magnification. The tested path instead integrates inverse rays over image
// pixels, including the parity-reversed image and the finite display window.
function imageFlux(thetaE,beta,sigma,size=240,sampling=4){
 const limit=4.3,step=2*limit/size;
 let sum=0;
 // Reflection symmetry about y=0 halves the work without changing pixel edges.
 for(let y=0;y<size/2;y++)for(let x=0;x<size;x++){
  const value=P.lensPixelIntensity(-limit+(x+.5)*step,-limit+(y+.5)*step,thetaE,beta,sigma,step,sampling);
  assert.ok(Number.isFinite(value)&&value>=0&&value<=1,'Pixel brightness must be finite and in [0,1]');
  sum+=2*value;
 }
 return sum*step*step/(2*Math.PI*sigma*sigma);
}
let maxRelativeFluxError=0,maxResolutionChange=0;
const cases=[];
for(const mass of [1e10,10**11.4,1e12])for(const beta of [0,.3,1,1.8])for(const sigma of [.04,.09,.3])cases.push({mass,beta,sigma});
for(const {mass,beta,sigma} of cases){
 const thetaE=P.pointLens(mass,beta).thetaE,total=P.finiteMagnification(thetaE,beta,sigma),coarse=imageFlux(thetaE,beta,sigma),fine=imageFlux(thetaE,beta,sigma,480);
 const error=Math.abs(coarse/total-1),change=Math.abs(coarse/fine-1);
 assert.ok(error<.001,`Finite-FOV image flux disagrees at M=${mass}, beta=${beta}, sigma=${sigma}: ${error}`);
 assert.ok(change<.001,`Pixel subdivision did not converge: ${change}`);
 maxRelativeFluxError=Math.max(maxRelativeFluxError,error);maxResolutionChange=Math.max(maxResolutionChange,change);
}
// The same area-averaging convention is used for the unlensed panel.
for(const beta of [0,.3,1.8])for(const sigma of [.04,.3])assert.ok(Math.abs(imageFlux(0,beta,sigma)-1)<.0001);
const thetaE=P.pointLens(1e10,.3).thetaE;
assert.ok(Math.abs(imageFlux(thetaE,.3,.04)-imageFlux(thetaE,-.3,.04))<1e-12,'Reflection must preserve total flux');
assert.equal(P.lensPixelIntensity(0,0,1,0,.04,.04),0,'The central pixel is far from the finite Einstein ring');
// These UI endpoints place essentially all lensed light within +/-4.3 arcsec.
// A deliberately much smaller window would need a separate aperture-loss term;
// imageFlux must never replace the complete finiteMagnification readout.
console.log(JSON.stringify({cases:cases.length,maxRelativeFluxError,maxResolutionChange,reference:'Independent complete-source integral; 240/480 finite-image convergence'}));
