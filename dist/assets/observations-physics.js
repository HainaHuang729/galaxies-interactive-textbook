(function(scope){
 'use strict';
 const C=299792.458,ARCSEC=206264.806247;
 function photometry(M,d,re){const modulus=5*Math.log10(d)+25,theta=ARCSEC*re/(d*1000),m=M+modulus;return {m,modulus,theta,fluxRatio:(20/d)**2,meanMu:m+2.5*Math.log10(2*Math.PI*theta*theta)};}
 const lines=[{name:'Hβ',lambda:486.268,area:1,color:'#7abdc4'},{name:'[O III]',lambda:500.824,area:1.5,color:'#b5cebb'},{name:'Hα',lambda:656.461,area:2.8,color:'#e4c389'}];
 function spectralLine(line,z,sigma,resolving=1000){const center=line.lambda*(1+z),instrument=C/(2.354820045*resolving),width=center/C*Math.hypot(sigma,instrument);return {...line,center,width,fwhm:width*2.354820045};}
 function spectrumAt(lambda,z,sigma){let f=.16;for(const line of lines){const l=spectralLine(line,z,sigma);f+=l.area/(Math.sqrt(2*Math.PI)*l.width)*Math.exp(-.5*((lambda-l.center)/l.width)**2);}return f;}
 // Integer 2n permits a stable finite-sum regularized incomplete gamma.
 function gammaCDF(k,x){if(x<=0)return 0;let term=1,sum=1;for(let i=1;i<k;i++){term*=x/i;sum+=term;}return Math.max(0,Math.min(1,1-Math.exp(-x)*sum));}
 const betaCache=new Map();function beta(n){if(betaCache.has(n))return betaCache.get(n);let lo=0,hi=4*n+20;for(let i=0;i<65;i++){const mid=(lo+hi)/2;if(gammaCDF(2*n,mid)<.5)lo=mid;else hi=mid;}const b=(lo+hi)/2;betaCache.set(n,b);return b;}
 function enclosed(q,n){return gammaCDF(2*n,beta(n)*Math.max(0,q)**(1/n));}
 function profileRatio(q,n){return Math.exp(-beta(n)*(Math.max(0,q)**(1/n)-1));}
 function surfaceDensity(r,n,re){let gamma=1;for(let i=1;i<2*n;i++)gamma*=i;const b=beta(n),norm=b**(2*n)/(2*Math.PI*n*gamma*re*re);return norm*Math.exp(-b*(Math.max(0,r)/re)**(1/n));}
 function limitMagnitude(d,m){return m-5*Math.log10(d)-25;}
 function maximumDistance(M,m){return 10**((m-M-25)/5);}
 function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed+.5)/4294967296;};}
 function makeSurvey(){const random=seeded(29062010),rows=[];for(let i=0;i<1400;i++){const M=-23+9*random(),distance=100*Math.cbrt(.001+.999*random());rows.push({id:i,M,distance,m:photometry(M,distance,3).m});}return rows;}
 function selectSurvey(rows,mlim,mode,dlim){const Mlim=limitMagnitude(dlim,mlim);return rows.map(g=>({...g,detected:g.m<=mlim,selected:g.m<=mlim&&(mode==='flux'||(g.distance<=dlim&&g.M<=Mlim))}));}
 const api={C,ARCSEC,photometry,lines,spectralLine,spectrumAt,gammaCDF,beta,enclosed,profileRatio,surfaceDensity,limitMagnitude,maximumDistance,makeSurvey,selectSurvey};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.ObservationPhysics=api;
})(typeof window!=='undefined'?window:globalThis);
