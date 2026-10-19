// Geometry, density and mass-budget figures replacing unsupported raster scenes.
// Every apparent structure below is specified explicitly, rather than generated.
(function(){
 'use strict';const H=window.BookFigureGeometry,R=window.BookFigureRenderers,T=2*Math.PI;
 const text=H.text,ell=(x,y,a,b,c='bf-series')=>`<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" class="${c}"/>`;
 const sample=(n,fn)=>Array.from({length:n+1},(_,i)=>fn(i/n));
 function panels(w,names,h,min=280){const p=H.panels(w,names,h,min);p.svg=p.items.map((a,i)=>H.rect(a.x,a.y,a.w,a.h,'bf-panel',8)+text(a.x+14,a.y+24,names[i],'bf-title')).join('');return p;}
 R['7-structure-13']=function(width,state={}){
  const level=[.5,1,1.5].includes(state.strLevel)?state.strLevel:1;
  const p=panels(width,['球形等密度面','三轴等密度面'],400),axes=[[1,1,1],[1.4,1,1/1.4]];let s=p.svg;
  p.items.forEach((a,i)=>{const [ax,ay,az]=axes[i],k=Math.min(46,(a.w-60)/5),cx=a.x+a.w/2,cy=a.y+128;
   const project=(x,y,z)=>[cx+k*(x-y)/Math.SQRT2,cy+k*((x+y)/Math.sqrt(6)-Math.sqrt(2/3)*z)];
   const L=level;
   [[0,1],[0,2],[1,2]].forEach((ab,j)=>{s+=H.polyline(sample(160,t=>{const v=[0,0,0];v[ab[0]]=L*axes[i][ab[0]]*Math.cos(T*t);v[ab[1]]=L*axes[i][ab[1]]*Math.sin(T*t);return project(...v);}),['bf-series','bf-series-2','bf-series-3'][j]);});
   // Three-axis triad in the panel corner (direction only).
   const ox=a.x+40,oy=a.y+a.h-118,dir=(x,y,z)=>{const q=project(x,y,z),o=project(0,0,0),dx=q[0]-o[0],dy=q[1]-o[1],l=Math.hypot(dx,dy)||1;return [dx/l,dy/l];};
   [[[1,0,0],'a'],[[0,1,0],'b'],[[0,0,1],'c']].forEach(([v,name])=>{const [dx,dy]=dir(...v);s+=H.arrow(ox,oy,ox+dx*26,oy+dy*26,'bf-axis')+text(ox+dx*33,oy+dy*33+3,name,'bf-callout','middle');});
   s+=text(cx,a.y+246,'三个主平面的等密度面轮廓（只画当前 m）','bf-small bf-muted','middle');
   const yy=a.y+312,kk=Math.min(34,(a.w-58)/4.4);
   [.5,1,1.5].forEach(m=>s+=ell(cx,yy,kk*m*ax,kk*m*ay,m===level?'bf-series':'bf-wire'));
   s+=text(cx,a.y+362,`z=0 截面：三条 m 同时画出，粗线为当前 m=${level}`,'bf-small','middle');
   s+=text(cx,a.y+386,`a:b:c = ${ax.toFixed(2)}:1:${az.toFixed(2)}；abc=1，相同 m 对应相同密度`,'bf-small bf-muted','middle');
  });
  const readout=`指定椭球坐标 m²=(x/a)²+(y/b)²+(z/c)²，沿用 ρ(m)∝[m(1+m)²]⁻¹ 的 NFW 形状。两例 abc=1，所以相同 m 内的体积相同。上半格只画当前 m=${level} 的三个主平面轮廓（实线 ab、虚线 ac、点线 bc），避免多层叠画；下半格同时画出 m=0.5、1、1.5 的 z=0 截面，粗线对应当前层。它们不是实体外壳，也不是星光或暗物质观测图；此图只比较形状，未构造子晕或求解自洽势。`;
  const controls=`<div class="bf-controls" data-no-math>
    <div class="bf-tabs" role="group" aria-label="选择等密度面">${[[.5,'m = 0.5'],[1,'m = 1'],[1.5,'m = 1.5']].map(([m,label])=>`<button type="button" data-str-level="${m}" data-sync="str-${m}" aria-pressed="${m===level}">${label}</button>`).join('')}<button type="button" data-str-reset>恢复 m=1</button></div>
    <p>切换一层：上半格与下半格的粗线联动，另一层不再叠在同一处。</p>
  </div>`;
  return{height:p.height,svg:s,controls,readout,bind(host){
    state.strLevel=level;
    const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
    const patch=()=>{const w=Math.floor(host.clientWidth)||width,next=R['7-structure-13'](w,state);H.patchSvg(host,next,w);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;};
    host.onclick=event=>{
      const b=event.target.closest('[data-str-level]');
      if(b){state.strLevel=+b.dataset.strLevel;patch();return;}
      if(event.target.closest('[data-str-reset]')){state.strLevel=1;patch();}
    };
  }};
 };
 R['9-individual-16']=function(width){
  const p=panels(width,['视野 A：包层（供给盘）','视野 B：盘（吸积与外流）','视野 C：局部放大（年轻恒星）'],340),out=[];
  p.items.forEach((a,i)=>{const cx=a.x+a.w/2,cy=a.y+158,k=Math.min(78,(a.w-70)/2);
   out.push(text(a.x+16,a.y+44,['A','B','C'][i],'bf-label'));
   if(i===0){
     [.55,.8,1].forEach(r=>out.push(ell(cx,cy,k*r,k*.85*r,'bf-line')));
     out.push(ell(cx,cy,k*.24,k*.06,'bf-series')+H.circle(cx,cy,1.4,'bf-point'));
     for(const sign of [-1,1])out.push(H.arrow(cx+sign*k*.78,cy-28,cx+sign*k*.31,cy-8,'bf-series'));
     out.push(`<rect x="${(cx-k*.30).toFixed(1)}" y="${(cy-k*.10).toFixed(1)}" width="${(k*.60).toFixed(1)}" height="${(k*.20).toFixed(1)}" rx="2" fill="none" stroke="var(--accent)" stroke-dasharray="4 3"/>`);
     out.push(H.arrow(cx+k*.34,cy,cx+k*.92,cy,'bf-series-2')+text(cx+k*.34,cy-8,'取景 → B','bf-small'));
     out.push(text(cx,a.y+276,'包层轮廓为分布示意，非固体壳','bf-small','middle'));
   }else if(i===1){
     out.push(ell(cx,cy,k,k*.21,'bf-series')+ell(cx,cy,k*.43,k*.09,'bf-line')+H.circle(cx,cy,2,'bf-point'));
     for(const sign of [-1,1]){out.push(H.arrow(cx,cy+sign*16,cx,cy+sign*80,'bf-series-2'));out.push(H.arrow(cx+sign*k*.78,cy+20,cx+sign*k*.30,cy+8,'bf-series'));}
     out.push(`<rect x="${(cx-k*.20).toFixed(1)}" y="${(cy-k*.10).toFixed(1)}" width="${(k*.40).toFixed(1)}" height="${(k*.20).toFixed(1)}" rx="2" fill="none" stroke="var(--accent)" stroke-dasharray="4 3"/>`);
     out.push(H.arrow(cx+k*.24,cy-k*.02,cx+k*.92,cy-k*.02,'bf-series-2')+text(cx+k*.24,cy-k*.10,'取景 → C','bf-small'));
     out.push(text(cx,a.y+46,'外流轴垂直于盘面','bf-small','middle')+text(cx,a.y+276,'中心恒星在此尺度下不分辨','bf-small','middle'));
   }else{
     out.push(H.circle(cx,cy,34,'bf-area')+H.circle(cx,cy,34,'bf-series'));
     out.push(text(cx,cy+4,'恒星','bf-label','middle'));
     for(const sign of [-1,1])out.push(H.arrow(cx+sign*84,cy,cx+sign*39,cy,'bf-series'));
     out.push(text(cx,a.y+276,'盘的内侧为更热的气体','bf-small','middle'));
   }
   out.push(text(cx,a.y+306,'独立比例；箭头只表示取景关系，不标定倍率','bf-small bf-muted','middle'));
  });
  return{height:p.height,svg:out.join(''),legend:[['bf-series','向内吸积'],['bf-series-2','盘面外流 / 取景连接']],readout:'三个视野 A→B→C 依次取景放大：A 的框是盘所在的区域，B 的框是中心恒星所在的区域。三格没有共用长度尺，箭头只表示“这里再放大看”，不给出倍率，也不用于量取半径。包层、转动盘和中心年轻恒星是不同尺度的结构；盘中气体向内输运，同时部分物质沿极向外流。箭头表示方向，不给出流率、磁场解或喷流发射位置。'};
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
  const p=panels(width,['潮汐：不同位置受力不同','冲压：来流作用于气体','断供：已有冷气逐渐消耗'],344,290);let s=p.svg;
  const a=p.items[0],ax=H.axes({...a,h:300},{xmin:-1,xmax:1,ymin:-.5,ymax:.7,xlabel:'位置 x / r',ylabel:'Δa / (GM/D²)',xticks:[-1,0,1],yticks:[-.4,0,.6]});
  s+=ax.svg+H.polyline(sample(100,t=>{const x=2*t-1;return[ax.x(x),ax.y(1/(1-x/5)**2-1)];}),'bf-series')+text(a.x+14,a.y+312,'扰动者位于 +x，D=5r','bf-small')+text(a.x+14,a.y+334,'曲线是同一时刻不同位置的受力差','bf-small bf-muted');
  const b=p.items[1],cx=b.x+b.w*.46,cy=b.y+158,k=Math.min(58,b.w*.19),gl=b.x+22,gr=b.x+b.w-22;
  s+=ell(cx,cy,k,k*.42,'bf-soft-edge')+`<ellipse cx="${cx}" cy="${cy}" rx="${k}" ry="${(k*.42).toFixed(1)}" fill="none" class="bf-series"/>`;
  s+=H.circle(cx,cy,4,'bf-point');
  for(const dy of [-26,0,26])s+=H.arrow(gl,cy+dy,cx-k-8,cy+dy,'bf-series-2');
  s+=text(gl,cy-46,'来流：团内气体向右吹过星系','bf-small');
  s+=H.polyline([[cx-k-6,cy-14],[cx-k*.4,cy-18],[cx+k*.9,cy-26],[gr,cy-40]],'bf-series-2');
  s+=H.polyline([[cx-k-6,cy+16],[cx-k*.3,cy+20],[cx+k*.9,cy+28],[gr,cy+42]],'bf-series-2');
  s+=text(gr,cy-48,'尾迹：盘气体被剥离后向下游延伸','bf-small','end');
  s+=text(cx,cy+5,'恒星','bf-small','middle');
  s+=text(cx,b.y+254,'椭圆 = 恒星主体（未被冲压剥离）','bf-small','middle');
  s+=text(cx,b.y+278,'蓝箭头 = 团内气体来流；蓝曲线 = 盘气体与尾迹','bf-small bf-muted','middle');
  s+=text(cx,b.y+302,'P_ram = ρ_ICM v_rel²（示意，未计算剥离形状）','bf-small bf-muted','middle');
  const c=p.items[2],ca=H.axes({...c,h:300},{xmin:0,xmax:5,ymin:0,ymax:1.1,xlabel:'断供后时间 t / Gyr',ylabel:'M_g(t) / M_g,0',xticks:[0,2.5,5],yticks:[0,.5,1]});
  s+=ca.svg+H.line(ca.x(0),ca.y(1),ca.x(5),ca.y(1),'bf-reference')+H.polyline(sample(140,t=>[ca.x(5*t),ca.y(coldMass(5*t))]),'bf-series');
  s+=text(c.x+14,c.y+320,'指数衰减；虚线 = 持续补给时冷气体保持恒定','bf-small');
  s+=text(c.x+14,c.y+340,'回流 R=0.4；η=1；耗气时标 tdep=2 Gyr','bf-small bf-muted');
  return{height:p.height,svg:s,legend:[['bf-series','潮汐差分 / 断供后的冷气体'],['bf-series-2','冲压中的气体来流与尾迹'],['bf-reference','持续补给使冷气体恒定的参照']],readout:'潮汐曲线为外部点质量的精确轴向差分 GM[(D−x)⁻²−D⁻²]，横轴是位置、不是时间，也不代表完整遭遇模拟。冲压图区分两件事：椭圆是恒星主体（不会被气体冲压剥离），蓝箭头是从左向右吹过的团内气体，蓝曲线是被剥离的盘气体与下游尾迹；它只说明机制，未计算剥离形状或尾迹长度。断供图求解 dMg/dt = −(1−R+η)Mg/tdep，即 Mg/Mg,0 = exp(−0.8 t/Gyr)；虚线是持续补给时冷气体保持恒定的参照，断供不会瞬间清空冷气体。'};
 };
 window.BookPhysicalFigureModels={barDensity,coldMass};
}());
