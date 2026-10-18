(function () {
  'use strict';
  const H = window.BookFigureGeometry, R = window.BookFigureRenderers = window.BookFigureRenderers || {};
  const T = Math.PI * 2;
  const tx = (x,y,s,c='bf-label',a='start') => H.text(x,y,s,c,a);
  const seg = (a,b,c='bf-line') => H.line(a[0],a[1],b[0],b[1],c);
  const curve = (points,c='bf-series') => H.polyline(points,c);
  const dot = (x,y,r=3,c='bf-point') => H.circle(x,y,r,c);
  function panels(width,titles,height=260,min=290) {
    const p=H.panels(width,titles,height,min);
    p.svg=p.items.map((a,i)=>H.rect(a.x,a.y,a.w,a.h,'bf-shape',9)+tx(a.x+12,a.y+23,titles[i],'bf-title')).join('');
    return p;
  }
  function axes(p,o) { return H.axes(p,o); }
  function result(p,svg,readout,legend) { return {height:p.height,svg:p.svg+svg,readout,legend}; }
  function ellipse(cx,cy,rx,ry,cls='bf-line') {return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="${cls}"/>`;}
  function lineLabel(x,y,w,label,cls='bf-series') {return H.line(x,y,x+22,y,cls)+tx(x+30,y+4,label,'bf-small');}
  function lin(a,b,n,fn) {return Array.from({length:n},(_,i)=>fn(a+(b-a)*i/(n-1),i));}
  function simpson(f,a,b,n=160) {let s=f(a)+f(b);const h=(b-a)/n;for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}

  R['9-molecules-17']=function(width) {
    const p=panels(width,['尘埃遮蔽：宽带衰减','H₂自遮蔽：谱线吸收'],250), out=[];
    p.items.forEach((a,i)=>{
      const x=a.x+28,y=a.y+63,w=a.w-56;
      for(let j=0;j<6;j++)out.push(H.rect(x+j*w/6,y,w/6,92,'bf-area',0).replace('class="bf-area"',`class="bf-area" opacity="${.18+j*.14}"`));
      for(let j=0;j<3;j++) {
        const yy=y+22+j*24, end=x+w*(i?.30+j*.13:.36+j*.03);
        out.push(H.arrow(x-8,yy,end,yy,i?'bf-series-2':'bf-series'));
        if(i)out.push(dot(end,yy,3,'bf-point-2'));
      }
      out.push(tx(x,y+119,'外部紫外光 → 累积柱密度增加','bf-small'));
      out.push(tx(x,y+143,i?'H₂在离散吸收线中吸收解离光子':'尘埃吸收与散射削弱入射辐射','bf-small'));
      out.push(tx(x,y+165,i?'线重叠、速度结构会改变自遮蔽':'同时影响分子形成与辐射输运','bf-small'));
    });
    return result(p,out.join(''),'概念剖面：同一云中两种遮蔽共同作用。方块表示递增柱密度，非固定厚度化学层；未解化学网络，不标唯一转变密度。');
  };

  R['10-tracks-18']=function(width) {
    const p=panels(width,['赫罗图：区域与转折的概念','一颗恒星：沿时间演化','同龄星群：比较不同质量'],310),out=[];
    p.items.forEach((a,i)=>{
      const x=a.x+24,w=a.w-48;
      if(!i){
        const left=x+17,right=x+w-13,top=a.y+62,bottom=a.y+251;
        out.push(H.arrow(left,bottom,right,bottom,'bf-line'),H.arrow(left,bottom,left,top,'bf-line'));
        out.push(tx(left,a.y+49,'光度 ↑','bf-small'),tx((left+right)/2,a.y+280,'表面温度：高 → 低','bf-small','middle'));
        const xx=u=>left+(right-left)*u,yy=u=>bottom-(bottom-top)*u;
        out.push(curve([[xx(.14),yy(.87)],[xx(.80),yy(.16)]],'bf-series'));
        out.push(tx(xx(.51),yy(.35),'主序','bf-small','middle'));
        out.push(ellipse(xx(.77),yy(.82),(right-left)*.16,21,'bf-faint'),tx(xx(.77),yy(.82)+4,'巨星区','bf-small','middle'));
        out.push(ellipse(xx(.20),yy(.14),(right-left)*.17,18,'bf-faint'),tx(xx(.20),yy(.14)+4,'白矮星','bf-small','middle'));
        const young=[xx(.28),yy(.72)],old=[xx(.49),yy(.49)];
        out.push(dot(...young,4,'bf-point-2'),dot(...old,4,'bf-point-3'));
        out.push(tx(young[0]+8,young[1]-10,'较年轻转折','bf-small'));
        out.push(tx(old[0]+8,old[1]+3,'较老转折','bf-small'));
        out.push(H.arrow(young[0]-12,young[1]+3,old[0]-12,old[1]-3,'bf-line'));
        out.push(tx(x,a.y+300,'位置只表达定性关系，无数值等龄线','bf-small'));
      }else if(i===1){
        const ys=[63,111,159,207],labs=['前主序收缩','主序：核心氢燃烧','后主序：膨胀、失质量','遗迹：白矮星等分支'];
        ys.forEach((v,j)=>{out.push(H.rect(x,a.y+v,w,32,'bf-shape',5),tx(x+12,a.y+v+21,labs[j]));if(j<3)out.push(H.arrow(x+w/2,a.y+v+33,x+w/2,a.y+ys[j+1]-5));});
      }else{
        out.push(tx(x,a.y+64,'同一年龄，不同初始质量','bf-small'));
        const masses=[.7,1,2,5],ages=[.1,10];
        const life=m=>(2500+670*m**2.5+m**4.5)/(.033*m**1.5+.35*m**4.5)/1000;
        ages.forEach((age,j)=>{out.push(tx(x,a.y+100+j*65,age+' Gyr','bf-small'));masses.forEach((m,k)=>{const xx=x+68+k*(w-78)/3,yy=a.y+109+j*65,on=life(m)>age;out.push(dot(xx,yy,on?6:4,on?'bf-point':'bf-point-2'));out.push(tx(xx,yy+21,on?'主序':'已离开','bf-small','middle'));if(!j)out.push(tx(xx,a.y+81,m+' M☉','bf-small','middle'));});});
        out.push(tx(x,a.y+237,'转折质量随年龄增大而下降','bf-small'));
        out.push(tx(x,a.y+256,'“已离开”不表示光度归零','bf-small'));
      }
    });
    return result(p,out.join(''),'赫罗图仅标明温度向右降低、光度向上增加，以及主序、巨星、白矮星的定性区域。转折随年龄增加向低质量、低温和低光度的主序位置移动；箭头连接不同年龄的转折，不是一颗恒星的轨迹。没有调用真实等龄线或演化轨迹库。末图仅用本章式10.72寿命拟合判断是否仍在主序；未计算后主序持续时间或谱。');
  };

  R['10-chemistry-19']=function(width) {
    const p=panels(width,['封闭箱','井混合外流箱','原初流入、恒气体箱'],420),out=[];
    p.items.forEach((a,i)=>{
      const x=a.x+24,w=a.w-48,c=x+w/2;
      out.push(H.rect(x,a.y+99,w,47,'bf-shape',6),tx(c,a.y+119,'气体 Mg；金属 ZMg','bf-label','middle'));
      out.push(H.rect(x+20,a.y+190,w-40,36,'bf-shape',5),tx(c,a.y+213,'新形成恒星：流量节点','bf-small','middle'));
      out.push(H.rect(x,a.y+290,w,39,'bf-shape',6),tx(c,a.y+315,'永久锁定恒星质量 M★','bf-label','middle'));
      out.push(H.arrow(c-20,a.y+147,c-20,a.y+187),tx(c-25,a.y+170,'Ψ','bf-small','end'));
      out.push(H.arrow(c,a.y+228,c,a.y+287),tx(c-7,a.y+261,'(1−R)Ψ','bf-small','end'));
      const rx=x+w-8;
      out.push(curve([[x+w-20,a.y+207],[rx,a.y+207],[rx,a.y+147]],'bf-series-2'),H.arrow(rx,a.y+171,rx,a.y+147,'bf-series-2'));
      out.push(tx(rx-7,a.y+172,'RΨ','bf-small','end'));
      if(i===1)out.push(H.arrow(c,a.y+99,c,a.y+51,'bf-series-3'),tx(c,a.y+43,'外流 W=λΨ；丰度 Z','bf-small','middle'));
      if(i===2)out.push(H.arrow(c,a.y+49,c,a.y+98,'bf-series-2'),tx(c,a.y+43,'原初流入 A；ZA=0','bf-small','middle'));
      out.push(tx(x,a.y+354,'dM★/dt = (1−R)Ψ','bf-small'));
      out.push(tx(x,a.y+377,i===0?'dMg/dt = −(1−R)Ψ':i===1?'dMg/dt = −(1−R)Ψ−W':'A = (1−R)Ψ；dMg/dt = 0','bf-small'));
      out.push(tx(x,a.y+400,'新金属注入：y(1−R)Ψ','bf-small'));
    });
    return result(p,out.join(''),'Ψ为形成率，R为即时回流率，y按永久锁定质量定义。共同金属账：d(ZMg)/dt=−Z(1−R)Ψ+y(1−R)Ψ+ZA A−ZW；封闭箱 A=W=0。井混合外流带走的金属为 ZW，不把回流 RΨ 误当成新产额。');
  };

  const diskLOS=x=>simpson(y=>Math.exp(-Math.hypot(x,y)),-8,8,256);
  const diskLOSCentre=diskLOS(0);
  function diskProjection(x,z,edgeOn=false){return edgeOn?diskLOS(x)/diskLOSCentre/Math.cosh(z/.18)**2:Math.exp(-Math.hypot(x,z));}
  R['11-exponential-21']=function(width) {
    const p=panels(width,['正面：径向指数表面密度','侧面：同一三维密度投影'],356),out=[],fields=[];
    p.items.forEach((a,i)=>{
      // A unit of Rd has the same pixel length on both spatial axes.
      // The side view spans x=±4Rd and z=±1Rd, so its frame is 4:1.
      const size=Math.min(a.w-70,228),bw=size,bh=i?size/4:size;
      const box={x:a.x+(a.w-bw)/2,y:a.y+50+(size-bh)/2,w:bw,h:bh};
      const raster=H.raster(box.x,box.y,box.w,box.h,192,i?64:192,(u,v)=>Math.sqrt(diskProjection(-4+8*u,(i?2:8)*(v-.5),!!i)),0,1,i,{mode:'sequential'});fields.push(raster.field);out.push(raster.svg,H.rect(box.x,box.y,box.w,box.h,'bf-map-border',0));
      [-4,0,4].forEach(t=>out.push(tx(box.x+(t+4)/8*box.w,box.y+box.h+19,String(t),'bf-small',t===-4?'start':t===4?'end':'middle')));
      out.push(tx(box.x,box.y-10,i?'z/Rd = ±1':'y/Rd = ±4','bf-small'),tx(box.x+box.w,box.y+box.h+38,'x/Rd','bf-small','end'));
      out.push(tx(a.x+14,a.y+320,i?'沿 y 积分；h/Rd = 0.18':'沿 z 积分；Σ(R) ∝ exp(−R/Rd)','bf-small'));
      out.push(tx(a.x+14,a.y+343,'两视图使用相同的每 Rd 像素长度','bf-small'));
    });
    const cw=Math.min(width-48,420);out.push(H.colorbar((width-cw)/2,p.height+22,cw,'0','1','√[投影密度 / 中心投影密度]','sequential'));
    return {...result(p,out.join(''),'同一质量密度 ρ(R,z)=Σ₀ exp(−R/Rd) sech²(z/h)/(2h)。两图分别除以各自中心投影密度，并用相同平方根映射显示；两视图每 Rd 像素长度相同，横纵不拉伸。正面范围±4Rd，侧面横向±4Rd、纵向±1Rd；侧面沿视线积分截断至 |y|=8Rd，不是含尘埃的光度图。'),height:p.height+88,fields};
  };

  R['12-dynamical-friction-23']=function(width) {
    const p=panels(width,['运动卫星与背景的引力响应'],290),a=p.items[0],out=[],w=a.w-48,x=a.x+24,y=a.y+142,c=x+w*.62;
    const rand=H.rng(1283);
    for(let j=0;j<90;j++)out.push(dot(x+rand()*w,a.y+67+rand()*130,1.6,'bf-point-2'));
    for(let j=0;j<70;j++){const u=rand(),xx=c-20-u*Math.min(w*.45,170),yy=y+(rand()-.5)*(20+u*75);out.push(dot(xx,yy,2,'bf-point'));}
    out.push(dot(c,y,9,'bf-point-3'),H.arrow(c,y-28,c+Math.min(75,w*.2),y-28,'bf-series-2'),tx(c,y-43,'速度 v →','bf-small'));
    out.push(H.arrow(c-6,y+35,c-Math.min(85,w*.24),y+35,'bf-series'),tx(c,y+65,'平均响应力：反向于运动','bf-small','middle'));
    out.push(tx(x,a.y+247,'背景与卫星交换能量、动量','bf-small'));
    out.push(tx(x,a.y+270,'引力尾迹，不是气体迎风剥离','bf-small'));
    return result(p,out.join(''),'引力尾迹概念示意，未自洽求解背景分布函数。Chandrasekhar局部近似把平均加速度写成 −C(v)v；C(v)>0。无碰撞指粒子间接触碰撞可忽略，并不排除长期引力相互作用。');
  };

  function orbit(initial,steps=20000,dt=.003) {
    const q=[1,.9,.8],rc=.2,acc=r=>{const d=rc*rc+r.reduce((s,v,j)=>s+v*v/(q[j]*q[j]),0);return r.map((v,j)=>-v/(q[j]*q[j]*d));};
    const energy=(r,v)=>.5*v.reduce((s,v)=>s+v*v,0)+.5*Math.log(rc*rc+r.reduce((s,v,j)=>s+v*v/(q[j]*q[j]),0));
    const r=initial.slice(0,3),v=initial.slice(3),e0=energy(r,v),pts=[];let err=0,minL=Infinity,maxL=-Infinity;
    for(let i=0;i<=steps;i++) {if(i%7===0)pts.push([r[0],r[1]]);const aa=acc(r);for(let j=0;j<3;j++){v[j]+=.5*dt*aa[j];r[j]+=dt*v[j];}const bb=acc(r);for(let j=0;j<3;j++)v[j]+=.5*dt*bb[j];err=Math.max(err,Math.abs(energy(r,v)-e0));const l=r[0]*v[1]-r[1]*v[0];minL=Math.min(minL,l);maxL=Math.max(maxL,l);}
    return {pts,err,minL,maxL};
  }
  const orbitData=[orbit([1,.35,.15,0,0,0]),orbit([1,0,.1,0,.95,.04])];
  R['13-structure-24']=function(width) {
    const p=panels(width,['箱轨道：没有单一环绕方向','短轴管轨道：保持环绕方向'],292),out=[];
    p.items.forEach((a,i)=>{const ax=axes(a,{xmin:-1.25,xmax:1.25,ymin:-1.25,ymax:1.25,equalAspect:true,xlabel:'x（模型长度）',ylabel:'y',xticks:[-1,0,1],yticks:[-1,0,1]});out.push(ax.svg,curve(orbitData[i].pts.map(v=>[ax.x(v[0]),ax.y(v[1])]),i?'bf-series-2':'bf-series'),dot(ax.x(0),ax.y(0),2,'bf-point-3'));});
    return result(p,out.join(''),'同一固定三轴对数势 Φ=½ln[0.2²+x²+y²/0.9²+z²/0.8²]，绘出 x–y 投影；无量纲单位。速度Verlet积分 Δt=0.003、时长60。箱轨道Lz变号；管轨道Lz保持正。没有把单条轨道当作整个星系的自洽模型。',`最大绝对能量漂移：箱 ${orbitData[0].err.toExponential(1)}；管 ${orbitData[1].err.toExponential(1)}（模型能量单位）。`);
  };

  R['13-plane-25']=function(width) {
    const p=panels(width,['三维关系：一组指定的基本平面','二维投影：同一组合成点'],295),out=[],sample=[];
    for(let j=0;j<5;j++)for(let k=0;k<5;k++){const s=-.24+.12*j,i=-.45+.225*k;sample.push({s,i,r:1.25*s-.8125*i});}
    const a=p.items[0],cx=a.x+a.w*.5,cy=a.y+160,sx=(a.w-65)*.65,sy=100;
    const proj=v=>[cx+sx*(v.s+.43*v.i),cy+sy*(.42*v.i-v.r)];
    for(let j=0;j<5;j++){out.push(curve(sample.slice(j*5,j*5+5).map(proj),'bf-faint'));out.push(curve(sample.filter((v,k)=>k%5===j).map(proj),'bf-faint'));}
    const origin=[a.x+28,a.y+205];out.push(H.arrow(...origin,origin[0]+34,origin[1],'bf-axis'),tx(origin[0]+39,origin[1]+4,'s','bf-small'),H.arrow(...origin,origin[0]+17,origin[1]+18,'bf-axis'),tx(origin[0]+20,origin[1]+29,'i','bf-small'),H.arrow(...origin,origin[0],origin[1]-35,'bf-axis'),tx(origin[0]-5,origin[1]-40,'r','bf-small'));
    sample.forEach(v=>{const q=proj(v);out.push(dot(q[0],q[1],3));});
    out.push(tx(a.x+20,a.y+255,'r = 1.25 s − 0.8125 i','bf-small'),tx(a.x+20,a.y+276,'斜投影；坐标均为对数比值','bf-small'));
    const b=p.items[1],ax=axes(b,{xmin:-.3,xmax:.3,ymin:-.75,ymax:.75,xlabel:'s = log₁₀(σ/200)',ylabel:'r',xticks:[-.2,0,.2],yticks:[-.5,0,.5]});out.push(ax.svg);sample.forEach(v=>out.push(dot(ax.x(v.s),ax.y(v.r),3)));
    return result(p,out.join(''),'与本章δ=0.3例一致：r=log₁₀(Re/5kpc)，s=log₁₀(σ/200km s⁻¹)，i=log₁₀(Ie/300L☉pc⁻²)。25个网格样本严格位于指定平面，零内禀散布，均为合成点。二维投影的散开来自未显示的Ie维度，不是测量误差。');
  };

  R['14-engine-26']=function(width) {
    const p=panels(width,['不同结构，产生不同观测信号'],340),a=p.items[0],out=[],x=a.x+24,w=a.w-48;
    const rows=[['吸积盘','连续谱：热辐射与高能处理'],['广线区 BLR','快速运动气体：宽发射线'],['尘埃环 / 遮蔽结构','再处理辐射：红外与视角遮蔽'],['窄线区 NLR','更远的电离气体：窄发射线']];
    rows.forEach((r,j)=>{const yy=a.y+49+j*60;out.push(H.rect(x,yy,w,49,'bf-shape',6),dot(x+14,yy+16,4,j%2?'bf-point-2':'bf-point'),tx(x+27,yy+19,r[0]),tx(x+12,yy+39,r[1],'bf-small'));if(j<3)out.push(H.arrow(x+w*.83,yy+50,x+w*.83,yy+59,'bf-line'));});
    out.push(tx(x,a.y+317,'中心 → 外围；分层关系图，绝非等比例','bf-small'));
    return result(p,out.join(''),'范围随黑洞质量、光度、气体状态改变，不能把各区固定在同一个半径。广线区位于吸积盘外、通常在尘埃升华区以内；几何有多样性。喷流并非所有AGN都有，本图未把喷流作为必需部件。');
  };

  R['14-engine-27']=function(width) {
    const p=panels(width,['薄球壳：近侧与远侧的路径差','等到达延迟：观察方向的投影'],286),out=[];
    p.items.forEach((a,j)=>{
      if(!j){const cx=a.x+a.w*.42,cy=a.y+137,rr=Math.min(64,a.w*.2),right=a.x+a.w-25;
        out.push(ellipse(cx,cy,rr,rr,'bf-line'),dot(cx,cy,5),tx(cx,cy+23,'中心','bf-small','middle'));
        [-1,1].forEach((sign,k)=>{const xx=cx+sign*rr;out.push(dot(xx,cy,4,k?'bf-point-2':'bf-point-3'),H.arrow(cx,cy-4,xx,cy-4,k?'bf-series-2':'bf-series-3'));out.push(H.arrow(xx,cy+(k?18:-18),right,cy+(k?18:-18),k?'bf-series-2':'bf-series-3'));});
        out.push(tx(right,a.y+51,'观察者在右侧远处','bf-small','end'),tx(cx-rr+12,a.y+235,'远侧 τ=2r/c','bf-small','middle'),tx(cx+rr,a.y+257,'近侧 τ=0','bf-small','middle'));
      }else{const ax=axes(a,{xmin:-1,xmax:1,ymin:0,ymax:2,xlabel:'cos θ（向观察者为正）',ylabel:'cτ/r',xticks:[-1,0,1],yticks:[0,1,2]});out.push(ax.svg,curve([[-1,2],[1,0]].map(v=>[ax.x(v[0]),ax.y(v[1])])));}
    });
    return result(p,out.join(''),'与现有实验一致，采用各向同性响应的理想薄球壳（不是圆环），观察者远在 +x 方向。相对直接闪光，额外路程为 r−x=r(1−cosθ)，τ=r(1−cosθ)/c；响应均匀分布在0–2r/c，平均r/c。图不按实际距离比例，无红移时间膨胀。');
  };

  function jointSample(){const rand=H.rng(1515);return Array.from({length:96},()=>{const m=9+3*rand(),c=.35+.17*(m-9)+.25*(rand()-.5);return [m,c];});}
  const joint=jointSample();
  function bins(data,index,lo,hi,n){const v=Array(n).fill(0);data.forEach(d=>v[Math.max(0,Math.min(n-1,Math.floor((d[index]-lo)/(hi-lo)*n))) ]++);return v;}
  R['15-distribution-28']=function(width) {
    const p=panels(width,['联合分布：同一批96个合成点','质量的边缘分布','颜色的边缘分布'],280),out=[];
    p.items.forEach((a,j)=>{if(!j){const ax=axes(a,{xmin:9,xmax:12,ymin:.2,ymax:1,xlabel:'log₁₀(M★/M☉)',ylabel:'示意颜色',xticks:[9,10,11,12],yticks:[.2,.6,1]});out.push(ax.svg);joint.forEach(v=>out.push(dot(ax.x(v[0]),ax.y(v[1]),2.7)));}else{
      const idx=j-1,lo=idx?.2:9,hi=idx?1:12,bb=bins(joint,idx,lo,hi,8),max=Math.ceil(Math.max(...bb)/5)*5;
      const ax=axes(a,{xmin:lo,xmax:hi,ymin:0,ymax:max,xlabel:idx?'示意颜色':'log₁₀(M★/M☉)',ylabel:'个数',xticks:idx?[.2,.6,1]:[9,10,11,12],yticks:[0,max/2,max]});out.push(ax.svg);bb.forEach((v,k)=>{const xx=ax.x(lo+k*(hi-lo)/8),ww=(ax.x(hi)-ax.x(lo))/8;out.push(H.rect(xx+1,ax.y(v),ww-2,ax.y(0)-ax.y(v),'bf-area-2'));});}
    });
    return result(p,out.join(''),'全部面板来自同一批96个固定种子的合成样本；两张边缘直方图的计数都严格合计96。颜色只是教学变量，没有指定滤光片或标为实测。重新排列颜色与质量的配对可以保持两条边缘分布，同时改变联合关系。');
  };

  R['15-clustering-29']=function(width) {
    const p=panels(width,['样本A：每座晕都有2个成员','样本B：一半空、一半4个成员'],300),out=[];
    p.items.forEach((a,j)=>{
      const occ=j?[0,0,4,4]:[2,2,2,2];
      occ.forEach((n,k)=>{const cx=a.x+a.w*(k%2?.72:.28),cy=a.y+93+Math.floor(k/2)*98,rr=Math.min(35,a.w*.12);out.push(ellipse(cx,cy,rr,rr,'bf-line'));const pts=Array.from({length:n},(_,i)=>[cx+rr*.57*Math.cos(T*i/n),cy+rr*.57*Math.sin(T*i/n)]);for(let u=0;u<n;u++)for(let v=u+1;v<n;v++)out.push(seg(pts[u],pts[v],'bf-faint'));pts.forEach(v=>out.push(dot(v[0],v[1],4,j?'bf-point-2':'bf-point')));out.push(tx(cx,cy+rr+17,`N=${n}；对数 ${n*(n-1)/2}`,'bf-small','middle'));});
      out.push(tx(a.x+18,a.y+279,j?'〈N〉=2；〈N(N−1)〉=6':'〈N〉=2；〈N(N−1)〉=2','bf-small'));
    });
    return result(p,out.join(''),'每组都有4座晕、8个星系。A的不重复同晕对数为4，B为12；线连接每一对。〈N(N−1)〉统计有序对，是每晕不重复对数均值的两倍。这里只比较具体占据计数，未加入质量分布、内部径向分布或晕偏倚。');
  };

  function density(x,c=1.2) {return window.AdvancedPhysics.forestDensity(x,c);}
  R['16-lyman-forest-30']=function(width) {
    const p=panels(width,['同一视线：合成密度起伏','对应透射：F=exp(−AΔᑫ)'],280),out=[],q=2-.7*(1.5-1),A=.35;
    p.items.forEach((a,j)=>{const ax=axes(a,{xmin:0,xmax:100,ymin:0,ymax:j?1:4,xlabel:'合成视线坐标（任意长度）',ylabel:j?'透射 F':'Δ=ρ/ρ̄（模型）',xticks:[0,25,50,75,100],yticks:j?[0,.5,1]:[0,2,4]});out.push(ax.svg,curve(lin(0,100,301,x=>[ax.x(x),ax.y(j?Math.exp(-A*density(x)**q):density(x))]),j?'bf-series-2':'bf-series'));[21,55,82].forEach(x=>{out.push(H.line(ax.x(x),ax.y(0),ax.x(x),ax.y(j?1:4),'bf-faint'));});});
    return result(p,out.join(''),'直接调用森林实验的同一个密度函数，contrast=1.2，A=0.35，γ=1.5，q=1.65。原始正密度除以0–100视线窗口的积分均值，保证该窗口⟨Δ⟩=1；ρ̄指窗口平均密度。相同横坐标连接密度与吸收。没有热展宽、速度畸变或屏蔽，因此不能从每道谷唯一反演真实气团位置。');
  };

  R['16-limit-systems-31']=function(width) {
    const p=panels(width,['柱密度与系统的包含关系'],345),a=p.items[0],out=[],l=a.x+29,r=a.x+a.w-29,y=a.y+94,xx=n=>l+(n-12)/(22-12)*(r-l);
    out.push(H.arrow(l,y,r,y,'bf-line'));
    [12,15,17.2,20.3,22].forEach(n=>out.push(H.line(xx(n),y-4,xx(n),y+5),tx(xx(n),y+24,n.toFixed(1),'bf-small','middle')));
    out.push(tx((l+r)/2,a.y+145,'log₁₀[NHI / cm⁻²]','bf-small','middle'));
    out.push(H.rect(xx(17.2),a.y+169,xx(22)-xx(17.2),54,'bf-area',4),tx(xx(17.2)+5,a.y+190,'广义 LLS','bf-label'));
    out.push(H.rect(xx(Math.log10(2e20)),a.y+197,xx(22)-xx(Math.log10(2e20)),26,'bf-area-2',3));
    out.push(tx(xx(Math.log10(2e20))-8,a.y+213,'DLA →','bf-small','end'));
    out.push(tx(l,a.y+251,'LLS：Lyman边缘 τ₉₁₂ ≳ 1','bf-small'));
    out.push(tx(l,a.y+274,'NHI ≳ 1/σ₉₁₂ ≈ 1.6×10¹⁷ cm⁻²','bf-small'));
    out.push(tx(l,a.y+298,'DLA：惯例 NHI ≥ 2×10²⁰ cm⁻²','bf-small'));
    out.push(tx(l,a.y+322,'这些高柱密度系统也有 Lyα 线吸收','bf-small'));
    return result(p,out.join(''),'广义LLS按912Å边缘光深约为1定义；DLA包含在更高柱密度一端，不是互斥第三组。低柱密度森林与部分LLS的细分阈值可依目录约定不同。边缘是束缚—自由吸收，Lyα 1215.67Å是束缚—束缚线吸收。图不计算阻尼翼；阈值依据本章§16.7–16.8及现有Lyman极限实验。');
  };
  window.BookFigureLateDiagnostics={orbitData,joint,density,bins,simpson,diskProjection,diskLOS,diskLOSCentre};
}());
