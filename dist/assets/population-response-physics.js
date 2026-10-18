(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PopulationResponsePhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const minMass=.1,maxMass=100,threshold=20;
 function check(x,name,min=0){if(!Number.isFinite(x)||x<min)throw new RangeError(name);return x;}
 function J(q,a,b){if(!(a>0&&b>=a))throw new RangeError('mass interval');return q===0?Math.log(b/a):Math.exp(q*Math.log(a))*Math.expm1(q*Math.log(b/a))/q;}
 function distribution(alpha=2.35){check(alpha,'slope',1);const q=1-alpha,norm=J(q,minMass,maxMass),massNorm=J(q+1,minMass,maxMass),cdf=m=>m<=minMass?0:m>=maxMass?1:J(q,minMass,m)/norm;
  const quantile=u=>{check(u,'quantile');if(u>1)throw new RangeError('quantile');if(u===0)return minMass;if(u===1)return maxMass;return minMass*Math.exp(q===0?u*Math.log(maxMass/minMass):Math.log1p(u*Math.expm1(q*Math.log(maxMass/minMass)))/q);};
  return {alpha,norm,massNorm,cdf,quantile,pdf:m=>m<minMass||m>maxMass?0:m**(-alpha)/norm,mean:massNorm/norm,tailNumber:J(q,threshold,maxMass)/norm,tailMass:J(q+1,threshold,maxMass)/massNorm};
 }
 function sampler({slope=2.35,count=200,seed=42,quantile=.5}={}){check(count,'count',1);check(seed,'seed');if(!Number.isInteger(count)||!Number.isInteger(seed))throw new RangeError('integer sampling parameters');const d=distribution(slope),selected=d.quantile(quantile),edges=Array.from({length:9},(_,i)=>minMass*(maxMass/minMass)**(i/8)),bin=m=>Math.min(7,Math.max(0,Math.floor(Math.log(m/minMass)/Math.log(maxMass/minMass)*8))),numbers=Array(8).fill(0),masses=Array(8).fill(0),samples=[];let state=(seed>>>0)^0x9e3779b9,totalMass=0,tailCount=0;
  for(let i=0;i<count;i++){state^=state<<13;state^=state>>>17;state^=state<<5;state>>>=0;const u=(state+.5)/4294967296,m=d.quantile(u),b=bin(m);samples.push(m);numbers[b]++;masses[b]+=m;totalMass+=m;if(m>threshold)tailCount++;}
  const bins=numbers.map((n,i)=>({lo:edges[i],hi:edges[i+1],center:Math.sqrt(edges[i]*edges[i+1]),count:n,mass:masses[i],sampleNumberFraction:n/count,sampleMassFraction:masses[i]/totalMass,expectedCount:count*J(1-slope,edges[i],edges[i+1])/d.norm,expectedMassFraction:J(2-slope,edges[i],edges[i+1])/d.massNorm}));
  return {...d,count,seed,selected,selectedBin:bin(selected),bins,samples,totalMass,tailCount,probabilityAny:-Math.expm1(count*Math.log1p(-d.tailNumber)),expectedTail:count*d.tailNumber,expectedMass:count*d.mean};
 }
 function responseAt(t,D,tau){check(D,'duration',1e-12);check(tau,'response time',1e-12);check(t,'time',-1e6);if(t<=0)return {excess:0,integral:0};const during=-Math.expm1(-Math.min(t,D)/tau),excess=during*Math.exp(-Math.max(0,t-D)/tau);let integral;
  if(t<=D){const x=t/tau;integral=x<.01?tau*x*x*(.5-x/6+x*x/24-x**3/120+x**4/720):t-tau*during;}else integral=D-tau*excess;
  return {excess,integral};
 }
 function response({amplitude=9,duration=20,short=5,long=100,time=10}={}){check(amplitude,'amplitude');check(time,'time',-1e6);const a=responseAt(time,duration,short),b=responseAt(time,duration,long),formed=amplitude*Math.min(duration,Math.max(0,time))*1e6,instant=1+(time>=0&&time<duration?amplitude:0),shortRate=1+amplitude*a.excess,longRate=1+amplitude*b.excess;
  return {amplitude,duration,short,long,time,instant,shortRate,longRate,ratio:shortRate/longRate,formed,shortIntegral:amplitude*a.integral*1e6,longIntegral:amplitude*b.integral*1e6,shortLag:short*amplitude*a.excess*1e6,longLag:long*amplitude*b.excess*1e6};
 }
 return {minMass,maxMass,threshold,J,distribution,sampler,responseAt,response};
});
