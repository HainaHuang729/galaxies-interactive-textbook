(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./precision-physics.js'));else root.ProbePhysics=factory(root.PrecisionPhysics);})(typeof globalThis!=='undefined'?globalThis:this,function(Precision){'use strict';
const TAU=2*Math.PI,G=4.30091e-9,c=299792.458,arcsec=206264.80624709636;
function rng(seed=1){let n=seed>>>0,spare=null;const uniform=()=>{n=(n+0x6d2b79f5)>>>0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return (((t^(t>>>14))>>>0)+.5)/4294967296;};return {uniform,normal(){if(spare!==null){const x=spare;spare=null;return x;}const r=Math.sqrt(-2*Math.log(uniform())),a=TAU*uniform();spare=r*Math.sin(a);return r*Math.cos(a);}};}

function catalog({count=600,fraction=.6,width=4,seed=1,box=100}={}){if(!Number.isInteger(count)||count<2||count>2000||fraction<0||fraction>1||width<=0||box<=0)throw new RangeError('Invalid catalogue');const random=rng(seed),centers=[[.2,.2],[.5,.2],[.8,.2],[.3,.5],[.7,.5],[.2,.8],[.5,.8],[.8,.8]],points=[];const wrap=x=>((x%box)+box)%box;for(let i=0;i<count;i++){const uniformX=random.uniform()*box,uniformY=random.uniform()*box,choose=random.uniform(),j=Math.floor(random.uniform()*centers.length),gx=random.normal(),gy=random.normal(),cluster=choose<fraction;points.push({x:cluster?wrap(centers[j][0]*box+width*gx):uniformX,y:cluster?wrap(centers[j][1]*box+width*gy):uniformY,cluster});}return points;}
// 2D periodic minimum-image separations. Analytic RR valid only for bin edges <=box/2.
function pairs(points,{box=100,max=30,bins=15}={}){if(points.length<2||max<=0||max>box/2||!Number.isInteger(bins)||bins<1)throw new RangeError('Invalid pair bins');const counts=Array(bins).fill(0),total=points.length*(points.length-1)/2,step=max/bins;for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){const dx=Math.abs(points[i].x-points[j].x),dy=Math.abs(points[i].y-points[j].y),r=Math.hypot(Math.min(dx,box-dx),Math.min(dy,box-dy));if(r<max)counts[Math.floor(r/step)]++;}return counts.map((dd,i)=>{const lo=i*step,hi=(i+1)*step,rr=total*Math.PI*(hi*hi-lo*lo)/(box*box);return {lo,hi,r:(lo+hi)/2,dd,rr,xi:dd/rr-1,total};});}
function velocityCloud(count=300,seed=31){const r=rng(seed);return Array.from({length:count},()=>({x:3*r.normal(),z:3*r.normal(),epsilon:r.normal()}));}
// Low-z plane-parallel mapping at a=1, H0=70 km/s/Mpc; coordinates relative to a distant centre.
function redshift(points,infall=0,sigma=0,mix=1,H0=70){return points.map(p=>{const v=-infall*H0*p.z+sigma*p.epsilon;return {...p,v,zObserved:p.z+mix*v/H0};});}
// Thin point lens, physical angular-diameter distances in Mpc, mass in Msun, angles in arcsec.
function pointLens(mass,beta,dL=1000,dS=1600,dLS=1000){if(mass<=0||dL<=0||dS<=0||dLS<=0||!Number.isFinite(beta))throw new RangeError('Invalid lens');const thetaE=Math.sqrt(4*G*mass/c**2*dLS/(dL*dS))*arcsec,q=Math.sqrt(beta*beta+4*thetaE*thetaE),u=Math.abs(beta)/thetaE;return {thetaE,thetaPlus:(beta+q)/2,thetaMinus:(beta-q)/2,totalMagnification:u===0?Infinity:(u*u+2)/(u*Math.sqrt(u*u+4))};}
function sourcePosition(x,y,thetaE){const r2=x*x+y*y;if(r2===0)return {x:Infinity,y:Infinity};const a=1-thetaE*thetaE/r2;return {x:x*a,y:y*a};}
// Area-averaged surface brightness of one square image pixel. Inverse lensing can
// compress the secondary image below a display texel even when the source is
// resolved. Subdivide according to a bound on the local lens-map derivative;
// this is an image measurement, separate from the complete source-plane flux.
function lensPixelIntensity(x,y,thetaE,beta,sigma,pixelSize,samplesPerSigma=4){
 if(![x,y,thetaE,beta,sigma,pixelSize,samplesPerSigma].every(Number.isFinite)||thetaE<0||sigma<=0||pixelSize<=0||samplesPerSigma<=0)throw new RangeError('Invalid lens pixel');
 const radius=Math.hypot(x,y),halfDiagonal=pixelSize/Math.SQRT2,rlo=Math.max(0,radius-halfDiagonal),rhi=radius+halfDiagonal,e2=thetaE*thetaE;
 // Outside this radial annulus the entire pixel is at least 8 sigma from the
 // source. The omitted Gaussian intensity is below exp(-32).
 const minSourceRadius=rhi<thetaE?e2/rhi-rhi:rlo>thetaE?rlo-e2/rlo:0;
 if(minSourceRadius>Math.abs(beta)+8*sigma)return 0;
 const derivative=1+e2/(rlo>0?rlo:pixelSize/8)**2;
 if(rlo>0){const b=thetaE===0?{x,y}:sourcePosition(x,y,thetaE);if(Math.hypot(b.x-beta,b.y)>derivative*halfDiagonal+8*sigma)return 0;}
 const count=Math.min(128,Math.max(1,Math.ceil(samplesPerSigma*pixelSize*derivative/sigma)));
 let sum=0;
 for(let j=0;j<count;j++)for(let i=0;i<count;i++){
  const px=x+pixelSize*((i+.5)/count-.5),py=y+pixelSize*((j+.5)/count-.5),r2=px*px+py*py;
  if(r2===0&&e2>0)continue;
  const factor=e2===0?1:1-e2/r2,bx=px*factor-beta,by=py*factor;
  sum+=Math.exp(-(bx*bx+by*by)/(2*sigma*sigma));
 }
 return sum/(count*count);
}
// g is reduced shear, phi is the major-axis orientation in radians, local positive-parity regime.
function weakLens(kappa=0,g=.2,phi=0){if(kappa<0||kappa>.4||g<0||g>.4||!Number.isFinite(phi))throw new RangeError('Invalid local lens');const gamma=g*(1-kappa),major=1/(1-kappa-gamma),minor=1/(1-kappa+gamma),gamma1=gamma*Math.cos(2*phi),gamma2=gamma*Math.sin(2*phi);return {kappa,g,gamma,gamma1,gamma2,major,minor,axisRatio:major/minor,magnification:major*minor,phi,A:[[1-kappa-gamma1,-gamma2],[-gamma2,1-kappa+gamma1]]};}
// Ideal full-sky Gaussian CMB: (2ell+1)*Chat/Cl follows chi-square(2ell+1).
function cmbSpectrum(seed=1,maxEll=100){const r=rng(seed),points=[];for(let ell=2;ell<=maxEll;ell++){let sum=0;for(let j=0;j<2*ell+1;j++)sum+=r.normal()**2;points.push({ell,ratio:sum/(2*ell+1),fractionalSigma:Math.sqrt(2/(2*ell+1)),modes:2*ell+1});}return points;}
return {rng,catalog,pairs,velocityCloud,redshift,pointLens,finiteMagnification:Precision.finiteSource,sourcePosition,lensPixelIntensity,weakLens,cmbSpectrum,constants:{G,c,arcsec}};
});
