(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CollapsePhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Chapter 5: original teaching calculations following Mo, van den Bosch & White (2010).
// spherical(theta): EdS pressureless top-hat, before its formal zero-radius singularity.
//   theta [radians]; radius=r/r_turnaround; time=t/t_turnaround; densityRatio=rho/rho_bar.
// plummerOrbit(f): one test particle in a fixed Plummer potential, G=M=b=1,
//   length unit b, velocity unit sqrt(GM/b), time unit sqrt(b^3/GM).
//   r(0)=2, vr(0)=0, vt(0)=f*vc(2). No particle self-gravity or relaxation.
// jeans(gamma,beta,sigmaR): steady spherical scale-free tracer, rho~r^-gamma,
//   constant beta and sigmaR; velocities have the same units as sigmaR (UI: km/s).
// relaxation(N,crossingMyr): order-of-magnitude equal-mass two-body relaxation;
//   natural logarithm and coefficient 10 from MBW Eq.5.98, time output in Myr.
// phaseMixing(time,slope): integrable action-angle teaching Hamiltonian
//   H(J)=J-slope*(J-1)^2/2, Jdot=0, thetaDot=1-slope*(J-1).
//   Arbitrary canonical units. x=sqrt(2J)cos(theta), p=-sqrt(2J)sin(theta)
//   are phase-space coordinates, not galaxy positions. Fine-grained area is conserved.
const TAU=2*Math.PI;
const finite=(value,name)=>{if(!Number.isFinite(value))throw new RangeError(name+' must be finite');};
const constants=Object.freeze({
  turnaroundTheta:Math.PI,collapseTheta:TAU,
  turnaroundDensityRatio:9*Math.PI**2/16,
  turnaroundDeltaLinear:3/5*(3*Math.PI/4)**(2/3),
  collapseDeltaLinear:3/5*(3*Math.PI/2)**(2/3),
  // These are a separate virial/energy estimate, not the endpoint of spherical().
  // Assumptions: EdS, isolated uniform sphere, conserved energy, negligible surface term.
  virialRadiusRatio:.5,virialDensityRatio:18*Math.PI**2
});
function spherical(theta){
  finite(theta,'theta');
  if(theta<=0||theta>=TAU)throw new RangeError('Require 0<theta<2*pi');
  const y=theta*theta;
  const elapsed=theta<.1?theta*y*(1/6-y/120+y*y/5040-y*y*y/362880):theta-Math.sin(theta);
  const span=2*Math.sin(theta/2)**2;
  const densityRatio=4.5*elapsed**2/span**3;
  return {theta,radius:span/2,time:elapsed/Math.PI,
    deltaLinear:.6*(.75*elapsed)**(2/3),deltaNonlinear:densityRatio-1,densityRatio,
    phase:Math.abs(theta-Math.PI)<1e-12?'turnaround':theta<Math.PI?'expanding':'contracting'};
}
function plummerOrbit(f,{duration=60,dt=.005,sampleEvery=10}={}){
  finite(f,'f');finite(duration,'duration');finite(dt,'dt');
  if(f<=0||duration<=0||duration>200||dt<=0||dt>.05||!Number.isInteger(sampleEvery)||sampleEvery<1)throw new RangeError('Invalid orbit parameters');
  const steps=Math.ceil(duration/dt);
  if(steps>500000)throw new RangeError('Orbit requires too many integration steps');
  const h=duration/steps,circularSpeed=Math.sqrt(4/5**1.5),escapeFactor=Math.sqrt(2.5);
  let x=2,y=0,vx=0,vy=f*circularSpeed;
  const initialEnergy=.5*vy*vy-1/Math.sqrt(5),initialAngularMomentum=2*vy;
  let maxRelativeEnergyError=0,maxRelativeAngularMomentumError=0;
  const energyScale=Math.max(Math.abs(initialEnergy),1/Math.sqrt(5)*1e-12);
  const points=[];
  function record(t){const r=Math.hypot(x,y),energy=.5*(vx*vx+vy*vy)-1/Math.sqrt(1+r*r),angularMomentum=x*vy-y*vx;
    points.push({t,x,y,vx,vy,r,energy,angularMomentum});
  }
  record(0);
  // Kick-drift-kick leapfrog. Every step uses a central force; no drag is added.
  let factor=(1+x*x+y*y)**(-1.5),ax=-x*factor,ay=-y*factor;
  for(let i=1;i<=steps;i++){
    vx+=.5*h*ax;vy+=.5*h*ay;
    x+=h*vx;y+=h*vy;
    factor=(1+x*x+y*y)**(-1.5);ax=-x*factor;ay=-y*factor;
    vx+=.5*h*ax;vy+=.5*h*ay;
    const energy=.5*(vx*vx+vy*vy)-1/Math.sqrt(1+x*x+y*y),angularMomentum=x*vy-y*vx;
    maxRelativeEnergyError=Math.max(maxRelativeEnergyError,Math.abs(energy-initialEnergy)/energyScale);
    maxRelativeAngularMomentumError=Math.max(maxRelativeAngularMomentumError,Math.abs(angularMomentum-initialAngularMomentum)/Math.abs(initialAngularMomentum));
    if(i%sampleEvery===0||i===steps)record(i*h);
  }
  return {f,duration,dt:h,points,initialEnergy,initialAngularMomentum,
    maxRelativeEnergyError,maxRelativeAngularMomentumError,circularSpeed,escapeFactor};
}
function jeans(gamma,beta,sigmaR=150){
  finite(gamma,'gamma');finite(beta,'beta');finite(sigmaR,'sigmaR');
  if(gamma<=0||beta>=1||sigmaR<=0||gamma-2*beta<=0)throw new RangeError('Require gamma>0, beta<1, sigmaR>0 and gamma>2*beta');
  const vcSquared=(gamma-2*beta)*sigmaR*sigmaR;
  // sigmaTangential is ONE tangential component; sigmaTheta=sigmaPhi.
  return {gamma,beta,sigmaR,vcSquared,vc:Math.sqrt(vcSquared),sigmaTangential:sigmaR*Math.sqrt(1-beta)};
}
function relaxation(N,crossingMyr=50){
  finite(N,'N');finite(crossingMyr,'crossingMyr');
  if(N<=1||crossingMyr<=0)throw new RangeError('Require N>1 and crossingMyr>0');
  const ratio=N/(10*Math.log(N));
  return {N,crossingMyr,ratio,timeMyr:ratio*crossingMyr};
}
function phaseMixing(time,slope,{radialCount=32,angularCount=24,actionMin=.8,actionMax=1.2,angleHalfWidth=.18}={}){
  finite(time,'time');finite(slope,'slope');finite(actionMin,'actionMin');finite(actionMax,'actionMax');finite(angleHalfWidth,'angleHalfWidth');
  if(!Number.isInteger(radialCount)||radialCount<2||!Number.isInteger(angularCount)||angularCount<2||radialCount*angularCount>200000||actionMin<=0||actionMax<=actionMin||angleHalfWidth<=0||angleHalfWidth>=Math.PI||slope<0||slope>2)throw new RangeError('Invalid phase-mixing parameters');
  const points=[],actionWidth=actionMax-actionMin;
  // Equal-area midpoint samples of a rectangle in (theta,J), not a random realization.
  for(let i=0;i<radialCount;i++){
    const J=actionMin+(i+.5)*actionWidth/radialCount,omega=1-slope*(J-1),radius=Math.sqrt(2*J);
    for(let j=0;j<angularCount;j++){
      const thetaInitial=-angleHalfWidth+(j+.5)*2*angleHalfWidth/angularCount,theta=thetaInitial+omega*time;
      points.push({J,thetaInitial,theta,x:radius*Math.cos(theta),p:-radius*Math.sin(theta),omega});
    }
  }
  const shear=actionWidth*slope*Math.abs(time);
  return {time,slope,points,shear,angleSpread:2*angleHalfWidth+shear,area:actionWidth*2*angleHalfWidth};
}
return {spherical,plummerOrbit,jeans,relaxation,phaseMixing,constants};
});
