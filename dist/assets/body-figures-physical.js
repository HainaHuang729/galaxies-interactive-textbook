// Geometry, density and mass-budget figures replacing unsupported raster scenes.
// Every apparent structure below is specified explicitly, rather than generated.
(function(){
 'use strict';const H=window.BookFigureGeometry,R=window.BookFigureRenderers,T=2*Math.PI;
 const text=H.text,ell=(x,y,a,b,c='bf-series')=>`<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" class="${c}"/>`;
 const sample=(n,fn)=>Array.from({length:n+1},(_,i)=>fn(i/n));
 function panels(w,names,h,min=280){const p=H.panels(w,names,h,min);p.svg=p.items.map((a,i)=>H.rect(a.x,a.y,a.w,a.h,'bf-panel',8)+text(a.x+14,a.y+24,names[i],'bf-title')).join('');return p;}
 R['7-structure-13']=function(width){
  const p=panels(width,['球形等密度面','三轴等密度面'],390),axes=[[1,1,1],[1.4,1,1/1.4]];let s=p.svg;
  p.items.forEach((a,i)=>{const [ax,ay,az]=axes[i],k=Math.min(42,(a.w-60)/5),cx=a.x+a.w/2,cy=a.y+121;
   const project=(x,y,z)=>[cx+k*(x-y)/Math.sqrt(2),cy+k*((x+y)/Math.sqrt(6)-Math.sqrt(2/3)*z)];
   [.5,1,1.5].forEach((m,j)=>[[0,1],[0,2],[1,2]].forEach((ab)=>{s+=H.polyline(sample(144,t=>{const v=[0,0,0];v[ab[0]]=m*axes[i][ab[0]]*Math.cos(T*t);v[ab[1]]=m*axes[i][ab[1]]*Math.sin(T*t);return project(...v);}),j===1?'bf-series':'bf-line');}));
   s+=text(cx,a.y+213,'正交投影；等密度面的主平面轮廓','bf-small','middle');
   const yy=a.y+278,kk=Math.min(36,(a.w-58)/4.4);
   [.5,1,1.5].forEach((m,j)=>s+=ell(cx,yy,kk*m*ax,kk*m*ay,j===1?'bf-series':'bf-line'));
   s+=text(cx,a.y+343,`z=0 截面；a:b:c = ${ax.toFixed(2)}:1:${az.toFixed(2)}`,'bf-small','middle');
   s+=text(cx,a.y+369,'相同 m 对应相同密度；abc=1','bf-small','middle');
  });
  return{height:p.height,svg:s,readout:'指定椭球坐标 m²=(x/a)²+(y/b)²+(z/c)²，沿用 ρ(m)∝[m(1+m)²]⁻¹ 的 NFW 形状。两例 abc=1，所以相同 m 内的体积相同。显示 m=0.5、1、1.5 三个等密度面的主平面轮廓；它们不是实体外壳，也不是星光或暗物质观测图。此图只比较形状，未构造子晕或求解自洽势。'};
 };
 R['9-individual-16']=function(width){
  const p=panels(width,['包层：供给盘的气体','盘：向内吸积与双极外流','局部放大：年轻恒星'],330);let s=p.svg;
  p.items.forEach((a,i)=>{const cx=a.x+a.w/2,cy=a.y+150,k=Math.min(76,(a.w-70)/2);
   if(i===0){[.55,.8,1].forEach(r=>s+=ell(cx,cy,k*r,k*.85*r,'bf-line'));s+=ell(cx,cy,k*.24,k*.06,'bf-series');s+=H.circle(cx,cy,1.4,'bf-point');for(const sign of [-1,1])s+=H.arrow(cx+sign*k*.78,cy-28,cx+sign*k*.31,cy-8,'bf-series-2');s+=text(cx,a.y+270,'包层轮廓为分布示意，非固体壳','bf-small','middle');}
   else if(i===1){s+=ell(cx,cy,k,k*.21,'bf-series')+ell(cx,cy,k*.43,k*.09,'bf-line')+H.circle(cx,cy,2,'bf-point');for(const sign of [-1,1]){s+=H.arrow(cx,cy+sign*16,cx,cy+sign*80,'bf-series-2');s+=H.arrow(cx+sign*k*.78,cy+20,cx+sign*k*.30,cy+8,'bf-series');}s+=text(cx,a.y+46,'外流轴垂直于盘面','bf-small','middle')+text(cx,a.y+270,'中心恒星在此尺度下不分辨','bf-small','middle');}
   else{s+=H.circle(cx,cy,32,'bf-area')+H.circle(cx,cy,32,'bf-series');s+=text(cx,cy+4,'恒星','bf-label','middle');for(const sign of [-1,1])s+=H.arrow(cx+sign*80,cy,cx+sign*37,cy,'bf-series');s+=text(cx,a.y+270,'盘的内侧为更热的气体','bf-small','middle');}
   s+=text(cx,a.y+306,'独立比例；不用于量取半径','bf-small','middle');
  });
  return{height:p.height,svg:s,readout:'三个视野依次放大，没有共用长度尺。包层、转动盘和中心年轻恒星是不同尺度的结构；盘中气体向内输运，同时部分物质沿极向外流。箭头表示方向，不给出流率、磁场解或喷流发射位置。外流涉及物质输运与磁场等过程，本图只说明空间方向和尺度关系。'};
 };
 function barDensity(x,y,f=.25){const a=1.2,b=.28;return(1-f)*Math.exp(-Math.hypot(x,y))/(2*Math.PI)+f*Math.exp(-.5*((x/a)**2+(y/b)**2))/(2*Math.PI*a*b);}
 R['11-instability-20']=function(width){
  const p=panels(width,['轴对称盘：fbar=0','有棒盘：fbar=0.25'],354,290),fields=[];let s=p.svg;
  p.items.forEach((a,i)=>{const k=Math.min(a.w-70,230),x=a.x+(a.w-k)/2,y=a.y+49,r=H.raster(x,y,k,k,192,192,(u,v)=>Math.log10(barDensity(8*u-4,4-8*v,i?.25:0)),-4,0,i,{mode:'sequential',label:i?'有棒模型':'轴对称模型'});fields.push(r.field);s+=r.svg+H.rect(x,y,k,k,'bf-map-border');[-4,0,4].forEach(t=>{s+=text(x+(t+4)/8*k,y+k+20,String(t),'bf-small',t===-4?'start':t===4?'end':'middle');});s+=text(x,y-10,'y/Rd','bf-small')+text(x+k,y+k+39,'x/Rd','bf-small','end')+text(a.x+14,a.y+338,'总质量相同；横纵坐标等比例','bf-small');});
  const w=Math.min(width-48,420),x=(width-w)/2;s+=H.colorbar(x,p.height+22,w,'−4','0','log₁₀[Σ / (M / Rd²)]','sequential');
  return{height:p.height+88,svg:s,fields,readout:'二维构造：Σ=(1−fbar)e⁻ᴿ/(2π)+fbar exp[−(x²/a²+y²/b²)/2]/(2πab)，Rd=1，a=1.2、b=0.28。两项各自积分归一为1，所以改变 fbar 仍保持总质量 M=1；图只截取 ±4Rd 的窗口。颜色编码模型的对数面密度。此图展示棒的形态，不计算全球棒不稳定、共振或角动量交换。'};
 };
 function coldMass(t){return Math.exp(-.8*t);}
 R['12-clusters-22']=function(width){
  const p=panels(width,['潮汐：不同位置受力不同','冲压：来流作用于气体','断供：已有冷气逐渐消耗'],324,290);let s=p.svg;
  const a=p.items[0],ax=H.axes({...a,h:288},{xmin:-1,xmax:1,ymin:-.5,ymax:.7,xlabel:'位置 x / r',ylabel:'Δa / (GM/D²)',xticks:[-1,0,1],yticks:[-.4,0,.6]});
  s+=ax.svg+H.polyline(sample(100,t=>{const x=2*t-1;return[ax.x(x),ax.y(1/(1-x/5)**2-1)];}),'bf-series')+text(a.x+14,a.y+307,'扰动者位于 +x；D=5r','bf-small');
  const b=p.items[1],cx=b.x+b.w*.43,cy=b.y+147,k=Math.min(55,b.w*.18);
  s+=ell(cx,cy,k,k*.43,'bf-series')+H.circle(cx,cy,5,'bf-point');
  for(const y of [-24,0,24])s+=H.arrow(b.x+18,cy+y,b.x+50,cy+y,'bf-series-2');
  s+=H.polyline([[cx+10,cy-8],[cx+k+28,cy-15],[b.x+b.w-20,cy-31]],'bf-series-2')+H.polyline([[cx+14,cy+9],[cx+k+28,cy+16],[b.x+b.w-20,cy+27]],'bf-series-2');
  s+=text(b.x+14,b.y+57,'星系参考系：团内气体向右流','bf-small')+text(b.x+14,b.y+228,'椭圆：恒星主体','bf-small')+text(b.x+14,b.y+250,'流线：盘气体与尾迹','bf-small')+text(b.x+14,b.y+277,'\\(P_{\\rm ram}=\\rho_{\\rm ICM}v_{\\rm rel}^2\\)','bf-label')+text(b.x+14,b.y+307,'气体尾迹轮廓为机制示意','bf-small');
  const c=p.items[2],ca=H.axes({...c,h:288},{xmin:0,xmax:5,ymin:0,ymax:1.1,xlabel:'断供后时间 t / Gyr',ylabel:'\\(M_g(t)/M_{g,0}\\)',xticks:[0,2.5,5],yticks:[0,.5,1]});
  s+=ca.svg+H.line(ca.x(0),ca.y(1),ca.x(5),ca.y(1),'bf-reference')+H.polyline(sample(140,t=>[ca.x(5*t),ca.y(coldMass(5*t))]),'bf-series')+text(c.x+14,c.y+307,'回流 R=0.4；η=1；tdep=2 Gyr','bf-small');
  return{height:p.height,svg:s,legend:[['bf-series','潮汐差分 / 断供后的冷气体'],['bf-series-2','冲压中的气体来流与尾迹'],['bf-reference','持续补给使冷气体恒定的参照']],readout:'潮汐曲线为外部点质量的精确轴向差分 GM[(D−x)⁻²−D⁻²]，不代表完整遭遇模拟。冲压图区分气体与恒星，未计算剥离形状。断供图求解 dMg/dt=−(1−R+η)Mg/tdep：\\(M_g/M_{g,0}=\\exp[-0.8\\,t/\\mathrm{Gyr}]\\)，SFR/SFR₀ 相同；虚线的补给率为 A=(1−R+η)SFR。断供不会瞬间清空冷气体。'};
 };
 window.BookPhysicalFigureModels={barDensity,coldMass};
}());
