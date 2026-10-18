(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./gas-physics.js'):root.GasPhysics);if(typeof module==='object'&&module.exports)module.exports=api;else root.FeedbackDiagnostics=api;})(globalThis,function(G){'use strict';
 function evaluate({kind,energy=1e51,luminosity=1e38,nH=.1,time=20,temperature=1e4,ejectaMass=5}){
  if(!['blast','wind'].includes(kind)||![energy,luminosity,nH,time,temperature,ejectaMass].every(x=>Number.isFinite(x)&&x>0))throw new RangeError('Positive physical inputs required');
  const state=kind==='blast'?G.blast(energy,nH,time):G.wind(luminosity,nH,time),soundSpeed=Math.sqrt(G.gamma*G.k*temperature/(G.mu*G.mp)),mach=state.v/soundSpeed,warnings=[];
  if(mach<=1)warnings.push('模型速度不超过环境声速，不能把这条外推曲线解释为传播中的强激波。');else if(mach<3)warnings.push('马赫数低于3：强激波近似较弱，忽略外部压力的自相似结果仅作外推。');
  let sweptToEjecta=null,radiativeReferenceYr=null,ageToRadiative=null;
  if(kind==='blast'){
   sweptToEjecta=state.swept/(ejectaMass*G.Msun);
   radiativeReferenceYr=4.3e4*nH**(-5/9)*(energy/1e51)**(2/9);ageToRadiative=time*1000/radiativeReferenceYr;
   if(sweptToEjecta<1)warnings.push('扫掠质量小于抛射质量，能量守恒Sedov阶段尚不成立；早期自由膨胀需要另一模型。');else if(sweptToEjecta<10)warnings.push('扫掠质量尚未远大于抛射质量，可能仍处于进入Sedov阶段的过渡。');
   if(ageToRadiative>=1)warnings.push('年龄超过原书含氦、金属冷却估计的辐射参考时间；纯氢绝热曲线没有计算这些损失，不能据此声称仍然绝热。');
  }
  return {state,soundSpeed,mach,sweptToEjecta,radiativeReferenceYr,ageToRadiative,warnings};
 }
 return {evaluate};
});
