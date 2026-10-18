/* Original explanatory figures. Analytic models and deliberately labelled
   conceptual geometry; no observational data are manufactured here. */
(function () {
  'use strict';
  const H = window.BookFigureGeometry;
  const R = window.BookFigureRenderers = window.BookFigureRenderers || {};
  const tau = 2 * Math.PI;
  const point = (x,y,c='bf-point',r=3) => H.circle(x,y,r,c);
  const ellipse = (cx,cy,rx,ry,cls='bf-series') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="${cls}"/>`;
  const title = (p,t) => H.text(p.x+12,p.y+22,t,'bf-title');
  const seg = (a,b,c) => H.line(a[0],a[1],b[0],b[1],c);
  const curve = (f,n=120) => Array.from({length:n+1},(_,i)=>f(i/n));
  function integrate(f,a,b,n=800) {
    let s=f(a)+f(b);
    for(let i=1;i<n;i++) s+=(i%2?4:2)*f(a+(b-a)*i/n);
    return (b-a)*s/(3*n);
  }
  function growth(a,om=.3) {
    const q=(1-om)/om*a*a*a;
    return 5*a*Math.sqrt(1+q)*integrate(u=>u**4/(1+q*u**6)**1.5,0,1);
  }
  function frames(width,names,height=260,min=260) {
    const p=H.panels(width,names,height,min);
    return { ...p, svg:p.items.map((v,i)=>H.rect(v.x,v.y,v.w,v.h,'bf-panel',8)+title(v,names[i])).join('') };
  }
  R['1-diversity-0'] = function(width) {
    const names=['椭圆 E','透镜 S0','无棒旋涡 S','有棒旋涡 SB'];
    const f=frames(width,names,218,232); let s=f.svg;
    f.items.forEach((p,i)=>{
      const cx=p.x+p.w/2,cy=p.y+95,r=Math.min(65,p.w*.27);
      if(i===0) for(let j=6;j>=1;j--) s+=ellipse(cx,cy,r*j/6,r*.63*j/6,j%2?'bf-line':'bf-series');
      else {
        for(let j=4;j>=1;j--) s+=ellipse(cx,cy,r*j/4,r*.6*j/4,'bf-line');
        s+=ellipse(cx,cy,r*.22,r*.17,'bf-series');
        if(i===3) s+=H.line(cx-r*.46,cy,cx+r*.46,cy,'bf-series-2');
        if(i>=2) for(let arm=0;arm<2;arm++) {
          s+=H.polyline(curve(t=>{const q=t*4.2+arm*Math.PI,rr=r*(.23+.7*t);return[cx+rr*Math.cos(q),cy+.6*rr*Math.sin(q)];},100),'bf-series');
        }
      }
      const notes=[['无明显恒星盘','随机运动往往较重要'],['有盘与核球','无清楚旋臂'],['核球、盘、旋臂','盘内通常以转动为主'],['盘中含棒结构','棒与旋臂是不同结构']][i];
      s+=H.text(cx,p.y+175,notes[0],'bf-label','middle')+H.text(cx,p.y+195,notes[1],'bf-small bf-muted','middle');
    });
    return {height:f.height,svg:s,readout:'形态分类的四种示意外观。排列只比较结构，不表示年龄顺序或一条必经的演化路线；真实星系存在连续变化与其他形态。'};
  };
  R['1-clocks-1'] = function(width) {
    const f=frames(width,['恒星形成：什么时候出生','系统组装：什么时候汇集'],280,286);let s=f.svg;
    f.items.forEach((p,i)=>{
      const left=p.x+32,right=p.x+p.w-28,dx=right-left;
      s+=H.arrow(left,p.y+229,right,p.y+229,'bf-line')+H.text(left,p.y+253,'较早','bf-small')+H.text(right,p.y+253,'较晚','bf-small','end');
      if(i===0) {
        [75,125,175].forEach((yy,j)=>{
          s+=H.line(left,p.y+yy,right,p.y+yy,'bf-line');
          for(let k=0;k<3;k++)s+=point(left+dx*(.13+.055*k+.035*j),p.y+yy,'bf-point',3.5);
          s+=H.text(left,p.y+yy-14,['祖先 A','祖先 B','祖先 C'][j],'bf-small');
          s+=H.text(right,p.y+yy-10,'老恒星仍在','bf-small bf-muted','end');
        });
      } else {
        const meet=left+.69*dx, end=right, yc=p.y+125;
          [75,125,175].forEach((yy,j)=>{s+=H.polyline([[left,p.y+yy],[left+.43*dx,p.y+yy],[meet,yc]],['bf-series','bf-series-2','bf-series-3'][j]);});
        s+=H.line(meet,yc,end,yc,'bf-series')+point(meet,yc,'bf-point',6);
        s+=H.text(meet,p.y+64,'晚些汇集','bf-label','middle');
        s+=H.text(left,p.y+202,'各祖先已经含有老恒星','bf-small bf-muted');
      }
    });
    return{height:f.height,svg:s,readout:'双时间轴只示意事件先后，未赋予真实年代或合并率。恒星的出生时间可以早于它们最终进入同一星系的时间。'};
  };
  R['2-stars-3'] = function(width) {
    const p={x:0,y:0,w:width,h:335};const x=t=>48+(4.65-t)/1.4*(width-72),y=l=>40+(6-l)/10*245;
    let s=H.text(12,20,'赫罗图的定性区域','bf-title');
    s+=H.line(x(4.65),y(-4),x(3.25),y(-4),'bf-line')+H.line(x(4.65),y(-4),x(4.65),y(6),'bf-line');
    [30000,10000,4000,2000].forEach(t=>s+=H.text(x(Math.log10(t)),304,t.toLocaleString('en-US'),'bf-small','middle'));
    [-4,-2,0,2,4,6].forEach(l=>s+=H.text(40,y(l)+4,`10${({'-4':'⁻⁴','-2':'⁻²',0:'⁰',2:'²',4:'⁴',6:'⁶'})[l]}`,'bf-small','end'));
    s+=H.text(width/2,330,'表面温度 T / K（向右降低）','bf-label','middle')+H.text(12,39,'L / L☉','bf-small');
    // Broad regions intentionally show no fabricated individual stars or fitted locus.
    const region=(pts,cls)=>H.polyline([...pts,pts[0]].map(([t,l])=>[x(t),y(l)]),cls);
    s+=region([[4.55,5.6],[4.35,3.5],[3.62,-3.5],[3.48,-3.6],[4.14,3.2]],'bf-area');
    s+=region([[3.75,1.4],[3.3,1.7],[3.32,5.3],[3.75,5.3]],'bf-area-2');
    s+=region([[4.4,-1],[3.9,-4],[3.65,-4],[4.12,-1]],'bf-shape');
    s+=H.text(x(4.1),y(2.1),'主序','bf-label','middle')+H.text(x(3.52),y(3.5),'巨星','bf-label','middle')+H.text(x(4.12),y(-2.8),'白矮星','bf-label','middle');
    return{height:p.h,svg:s,readout:'定性区域图，不是恒星目录或等龄线计算。横轴温度向右降低，纵轴为对数光度；相似温度的主序星、巨星和白矮星可以有截然不同的半径与光度。'};
  };
  R['3-distance-4'] = function(width) {
    const f=frames(width,['几何：同一对共动位置','观测定义：用光与角大小'],310,300);let s=f.svg;
    const p=f.items[0],left=p.x+40,right=p.x+p.w-40;
    [89,191].forEach((yy,i)=>{
      s+=H.line(left,p.y+yy,right,p.y+yy,'bf-line');
      for(let j=0;j<=6;j++)s+=H.line(left+j*(right-left)/6,p.y+yy-8,left+j*(right-left)/6,p.y+yy+8,'bf-line');
      s+=point(left,p.y+yy,'bf-point-2')+point(right,p.y+yy);
      s+=H.text(left,p.y+yy-27,i?'接收：a₀=1':'发射：aₑ=1/2','bf-label');
    });
    s+=H.polyline([[right,p.y+89],[left,p.y+191]],'bf-series');
    s+=H.text(p.x+p.w/2,p.y+143,'光从源到观测者','bf-small','middle');
    s+=H.text(left,p.y+239,'χ 不变；物理间距为 aχ','bf-label');
    s+=H.text(left,p.y+266,'网格位置是共动坐标','bf-small bf-muted');
    const q=f.items[1];
    const lines=['角大小：Dₐ = ℓ / θ','通量：Dₗ² = L / (4πF)','平直背景：Dₐ = χ / (1+z)','Dₗ = (1+z)χ = (1+z)² Dₐ'];
    lines.forEach((t,i)=>s+=H.text(q.x+20,q.y+65+31*i,t,'bf-label'));
    const dc=integrate(z=>1/Math.sqrt(.3*(1+z)**3+.7),0,1),lb=integrate(z=>1/((1+z)*Math.sqrt(.3*(1+z)**3+.7)),0,1);
    s+=H.text(q.x+20,q.y+215,`z=1：χ=${dc.toFixed(3)}，Dₐ=${(dc/2).toFixed(3)}`,'bf-small');
    s+=H.text(q.x+20,q.y+242,`Dₗ=${(dc*2).toFixed(3)}，cΔt=${lb.toFixed(3)}`,'bf-small');
    s+=H.text(q.x+20,q.y+274,'上列数值统一以 c/H₀ 为单位','bf-small bf-muted');
    return{height:f.height,svg:s,readout:'例：平直 Ωm,0=0.3、ΩΛ,0=0.7，忽略辐射。Dₐ、Dₗ 分别由角大小与通量定义；左图是共动坐标关系，不把四种距离误画成同一时刻的四根尺。'};
  };
  R['3-distance-5'] = function(width) {
    const p={x:0,y:0,w:width,h:350},a=H.axes(p,{xmin:-2.05,xmax:2.05,ymin:0,ymax:2,xlabel:'共动坐标 χ',ylabel:'共形时间 η',xticks:[-2,-1,0,1,2],yticks:[0,.5,1,1.5,2]});
    let s=a.svg;
    const line=(f,cls)=>H.polyline(curve(t=>[a.x(f(.03+t*1.94)),a.y(.03+t*1.94)]),cls);
    s+=line(e=>e,'bf-series')+line(e=>-e,'bf-series');
    s+=line(e=>2-e,'bf-series-2')+line(e=>e-2,'bf-series-2');
    s+=line(e=>e*(2-e)/2,'bf-series-3')+line(e=>-e*(2-e)/2,'bf-series-3');
    s+=H.line(a.x(0),a.y(0),a.x(0),a.y(2),'bf-line')+H.line(a.x(-1.6),a.y(1),a.x(1.6),a.y(1),'bf-line');
    s+=point(a.x(0),a.y(1),'bf-point',5)+H.text(a.x(0)+9,a.y(1)-10,'今天','bf-small');
    // One incoming null ray through the observation event: χ = 1 − η.
    s+=H.polyline([[a.x(1),a.y(0)],[a.x(0),a.y(1)]],'bf-line');
    return{height:p.h,svg:s,legend:[['bf-series','粒子视界 χp=η'],['bf-series-2','事件视界 χe=2−η'],['bf-series-3','共动哈勃尺度 χH=η(2−η)/2']],readout:'解析运动学背景 a(η)=η/(2−η)，0<η<2，a₀=1 在 η₀=1；c=1。光在共形坐标中满足 dχ/dη=±1。今天 χp=χe=1，而 χH=0.5。此例用于区分定义，不是本书实验采用的 ΛCDM 膨胀史，曲线也不是宇宙实体边缘。'};
  };
  R['4-linear-6'] = function(width) {
    const f=frames(width,['有压力的理想流体','无碰撞粒子的自由流'],290,280);let s='';
    f.items.forEach((p,i)=>{
      const a=H.axes(p,{xmin:0,xmax:1,ymin:-1.2,ymax:1.2,xlabel:'位置 x / 波长',ylabel:'δ / δ₀',xticks:[0,.5,1],yticks:[-1,0,1]});
      s+=a.svg+title(p,i?'无碰撞：速度分散消相干':'流体：压力提供恢复力');
      s+=H.polyline(curve(t=>[a.x(t),a.y(Math.cos(tau*t))]),'bf-line');
      s+=H.polyline(curve(t=>[a.x(t),a.y((i?Math.exp(-2):-1)*Math.cos(tau*t))]),i?'bf-series-2':'bf-series');
    });
    return{height:f.height,svg:s,legend:[['bf-line','初始 δ(x,0)'],['bf-series','流体：相位反转'],['bf-series-2','自由流：振幅减小']],readout:'两个独立的静态背景解析极限，均忽略自引力和膨胀。流体 δ=δ₀cos(kx)cos(kcₛt)，取 kcₛt=π；无碰撞粒子有 Gaussian 速度分布，δ=δ₀cos(kx)exp[−(kσᵥt)²/2]，取 kσᵥt=2。自由流依靠弹道位移消相干，不依靠粒子接触碰撞。'};
  };
  function seedField(u,v){return (Math.cos(tau*u)+.7*Math.cos(tau*v+1)+.4*Math.cos(tau*(u+v)+.5))/2.1;}
  R['4-growth-7'] = function(width,state={}) {
    const om=state.matter===1?1:.3,times=[.2,.5,1],f=frames(width,times.map(a=>`a = ${a.toFixed(1)}  /  z = ${(1/a-1).toFixed(0)}`),352,260),fields=[];let s=f.svg;
    f.items.forEach((p,j)=>{
      const d=growth(times[j],om),size=Math.min(p.w-60,228),x=p.x+(p.w-size)/2,y=p.y+45;
      const raster=H.raster(x,y,size,size,192,192,(u,v)=>.08*d*seedField(u,1-v),-.1,.1,j,{mode:'diverging',label:`a=${times[j]}`,unit:'δ',probe:true,linked:true});fields.push(raster.field);s+=raster.svg;
      [0,.5,1].forEach(t=>{s+=H.line(x+t*size,y+size,x+t*size,y+size+4,'bf-axis')+H.text(x+t*size,y+size+19,String(t),'bf-small',t===0?'start':t===1?'end':'middle');});
      [0,.5,1].forEach(t=>{s+=H.text(x-7,y+(1-t)*size+4,String(t),'bf-small','end');});
      s+=H.rect(x,y,size,size,'bf-map-border')+H.text(x,y-9,'共动坐标 y/L','bf-small');
      s+=H.text(x+size,y+size+37,'x/L','bf-small','end');
      s+=H.text(p.x+14,p.y+319,`D₊ = ${d.toFixed(4)}`,'bf-data');
      s+=H.text(p.x+p.w-14,p.y+340,`|δ| ≤ ${(0.08*d).toFixed(4)}`,'bf-small','end');
    });
    const bw=Math.min(width-48,420),bx=(width-bw)/2;s+=H.colorbar(bx,f.height+24,bw,'−0.10','+0.10','密度反差 δ = (ρ − ρ̄) / ρ̄');s+=H.text(width/2,f.height+100,'欠密 ←      0：同一时刻平均密度      → 过密','bf-small','middle');
    return{height:f.height+114,svg:s,fields,readout:`平直无压物质＋Λ：Ωm,0=${om.toFixed(1)}，ΩΛ,0=${(1-om).toFixed(1)}；忽略辐射。三帧使用同一共动方形区域、同一相位和同一色标。δ=0.08D₊(a)s(x,y)，D₊/a→1，|s|≤1、平均s=0；切换背景时早期种子固定。不是实测密度场，也不显示非线性坍缩。`};
  };
  R['5-ellipsoid-8'] = function(width) {
    const stages=[[1,1,1],[1,.9,.18],[1,.15,.08]],f=frames(width,['三个方向都较长','先压缩一个方向：片','再压缩一个方向：丝'],260,265);let s=f.svg;
    f.items.forEach((p,j)=>{
      const [ax,ay,az]=stages[j],cx=p.x+p.w/2,cy=p.y+119,k=Math.min(67,p.w*.24);
      const project=(x,y,z)=>[cx+k*(x-.45*y),cy+k*(.3*y-.9*z)];
      [[0,1],[0,2],[1,2]].forEach((ab,i)=>{
        s+=H.polyline(curve(t=>{const v=[0,0,0];v[ab[0]]=Math.cos(t*tau)*stages[j][ab[0]];v[ab[1]]=Math.sin(t*tau)*stages[j][ab[1]];return project(...v);}),['bf-series','bf-series-2','bf-series-3'][i]);
      });
      for(let i=0;i<3;i++) {const v=[0,0,0];v[i]=1.1;s+=seg([cx,cy],project(...v),'bf-line');}
      s+=H.text(cx,p.y+223,`轴比 ${ax} : ${ay} : ${az}`,'bf-label','middle');
      s+=H.text(cx,p.y+246,'同一投影；比例仅作几何示例','bf-small bf-muted','middle');
    });
    return{height:f.height,svg:s,readout:'三个主平面中的椭圆由所列轴比精确投影。轴比是独立选定的几何状态，未积分椭球引力动力学；薄片与细丝只说明不同方向压缩的形态，不能据此声称已经形成稳定星系。'};
  };
  R['5-similarity-9'] = function(width) {
    const f=frames(width,['保留壳身份：半径随时间','同一时刻：径向次序改变'],310,290),q=[1,2,3],v=[-.1,-1.4,-3],cs=['bf-series','bf-series-2','bf-series-3'];let s='';
    const p=f.items[0],a=H.axes(p,{xmin:0,xmax:.75,ymin:0,ymax:3.3,xlabel:'时间 ωt',ylabel:'半径 r / r₀',xticks:[0,.25,.5,.75],yticks:[0,1,2,3]});s+=a.svg+title(p,'可解析的示踪壳轨迹');
    q.forEach((qq,i)=>s+=H.polyline(curve(t=>[a.x(t*.75),a.y(qq*Math.cos(t*.75)+v[i]*Math.sin(t*.75))]),cs[i]));
    s+=H.line(a.x(.7),a.y(0),a.x(.7),a.y(3.2),'bf-line');
    const z=f.items[1],cx=z.x+z.w/2,cy=z.y+143,k=Math.min(30,z.w*.1);
    s+=title(z,'ωt=0.70：同心但已有交叉');
    q.forEach((qq,i)=>{const rr=(qq*Math.cos(.7)+v[i]*Math.sin(.7))*k;s+=H.circle(cx,cy,rr,cs[i]);s+=H.text(z.x+20,z.y+234+i*22,`壳 ${i+1}：r=${(rr/k).toFixed(3)} r₀`,'bf-small');});
    s+=point(cx,cy,'bf-point',2);
    return{height:f.height,svg:s,legend:[['bf-series','初始壳 1'],['bf-series-2','初始壳 2'],['bf-series-3','初始壳 3']],readout:'演示模型：无自引力示踪壳在固定谐振势 Φ=ω²r²/2 内运动，rᵢ/r₀=qᵢcos(ωt)+uᵢsin(ωt)，q=(1,2,3)，u=(−0.1,−1.4,−3)。画面区间内半径均为正，轨迹相交后壳身份仍保持。它解释“壳交叉”，不充当自相似吸积解或 N 体历史。'};
  };
  R['6-lensing-10'] = function(width) {
    const f=frames(width,['薄透镜：光路拓扑','天空角位置：解析点像'],320,300);let s=f.svg;
    const G=4.30091e-9,c=299792.458,m=10**11.4,te=Math.sqrt(4*G*m/c**2*1000/(1000*1600))*206264.80624709636,beta=.3;
    const pos=(beta+Math.sqrt(beta*beta+4*te*te))/2,neg=(beta-Math.sqrt(beta*beta+4*te*te))/2;
    const p=f.items[0],x0=p.x+28,xl=p.x+p.w*.50,xs=p.x+p.w-28,y=p.y+140,k=39;
    s+=H.line(x0,y,xs,y,'bf-line')+H.line(xl,p.y+57,xl,p.y+237,'bf-line')+H.line(xs,p.y+57,xs,p.y+237,'bf-line');
    [pos,neg].forEach((t,i)=>s+=H.polyline([[x0,y],[xl,y-t*k],[xs,y-beta*k*1.7]],i?'bf-series-2':'bf-series'));
    s+=point(x0,y,'bf-point',4)+point(xl,y,'bf-point-3',5)+point(xs,y-beta*k*1.7,'bf-point-2',4);
    s+=H.text(x0,p.y+264,'观测者','bf-small')+H.text(xl,p.y+264,'透镜面','bf-small','middle')+H.text(xs,p.y+264,'源面','bf-small','end');
    s+=H.text(p.x+18,p.y+294,'间隔与偏折未按比例绘制','bf-small bf-muted');
    const z=f.items[1],cx=z.x+z.w/2,cy=z.y+145,scale=Math.min(51,(z.w-90)/(2*2.1));
    s+=H.line(z.x+24,cy,z.x+z.w-24,cy,'bf-line');
    s+=H.circle(cx,cy,te*scale,'bf-faint');
    [[pos,'θ₊', 'bf-point'],[neg,'θ₋','bf-point-2'],[beta,'β','bf-point-3']].forEach(([a,n,cl],i)=>{
      s+=point(cx+a*scale,cy,cl,4)+H.text(cx+a*scale,cy+(i===2?-22:25),n,'bf-label','middle');
    });
    s+=H.text(z.x+18,z.y+222,`θE=${te.toFixed(3)}″，β=0.300″`,'bf-label');
    s+=H.text(z.x+18,z.y+250,`θ₊=${pos.toFixed(3)}″，θ₋=${neg.toFixed(3)}″`,'bf-label');
    s+=H.text(z.x+18,z.y+280,'浅圆：角半径 θE 的参考圆','bf-small bf-muted');
    return{height:f.height,svg:s,readout:'沿用本章默认点质量 M=10¹¹·⁴ M☉ 与物理角径距离 dL=1000、dS=1600、dLS=1000 Mpc，源角 β=0.3″。点像由 θ±=[β±√(β²+4θE²)]/2 计算。平面间隔仅表示光路拓扑，dLS 不能用 dS−dL 替换；右图角坐标是精确点源参照，不是有限源表面亮度图。'};
  };
  R['6-galaxies-11'] = function(width) {
    const f=frames(width,['完整的合成分布','窗口与漏检后的目录','匹配窗口的随机参照'],280,265);let s=f.svg;
    const rng=H.rng(60216),truth=[],random=[];
    for(let i=0;i<700;i++){let x=rng(),y=rng();if(rng()<.5+.4*Math.cos(tau*x)*Math.cos(tau*y))truth.push({x,y,u:rng()});}
    const windowFn=(x,y)=>x>.08&&x<.95&&y>.08&&y<.92&&!(x>.43&&x<.57&&y>.33);
    const select=x=>1-.75*x;
    const observed=truth.filter(p=>windowFn(p.x,p.y)&&p.u<select(p.x));
    for(let i=0;i<700;i++){let x=rng(),y=rng();if(windowFn(x,y)&&rng()<select(x))random.push({x,y});}
    [truth,observed,random].forEach((arr,j)=>{
      const p=f.items[j],left=p.x+18,top=p.y+43,w=p.w-36,h=179;
      s+=H.rect(left,top,w,h,'bf-shape',0);
      arr.forEach(v=>s+=point(left+w*v.x,top+h*v.y,j===2?'bf-point-2':'bf-point',1.8));
      if(j>0) {
        const edges=[[0,0,.08,1],[.95,0,.05,1],[.08,0,.87,.08],[.08,.92,.87,.08],[.43,.33,.14,.59]];
        edges.forEach(([x,y,ww,hh])=>s+=H.rect(left+x*w,top+y*h,ww*w,hh*h,'bf-faint'));
      }
      s+=H.text(left,p.y+247,`${arr.length} 个合成点`,'bf-label');
      s+=H.text(left,p.y+269,j?'同一 W(x,y) 与 p(x)':'没有施加窗口和选择','bf-small bf-muted');
    });
    return{height:f.height,svg:s,readout:'可复现的合成二维场，非巡天数据。窗口 W 去掉边缘与一条遮挡带；保留概率 p(x)=1−0.75x 向右降低。观测目录和均匀随机参照使用完全相同的窗口与选择函数；随机点不复制真实的聚集。点数不同不影响它们作为选择函数参照的含义。'};
  };
  R['7-progenitors-12'] = function(width) {
    const w=width,h=342,x=q=>28+q*(w-75),y=[74,167,261];let s=H.text(12,22,'一棵质量守恒的示意树','bf-title');
    const leaves=[{x:.07,m:.25},{x:.25,m:.15},{x:.43,m:.2},{x:.61,m:.1},{x:.85,m:.3}],middle=[{x:.16,m:.4},{x:.52,m:.3},{x:.85,m:.3}];
    leaves.forEach((v,i)=>s+=H.line(x(v.x),y[0],x(middle[i<2?0:i<4?1:2].x),y[1],'bf-line'));
    middle.forEach(v=>s+=H.line(x(v.x),y[1],x(.5),y[2],'bf-line'));
    const node=(v,yy)=>point(x(v.x),yy,'bf-point',8+11*Math.sqrt(v.m))+H.text(x(v.x),yy-25,v.m.toFixed(2),'bf-small','middle');
    leaves.forEach(v=>s+=node(v,y[0]));middle.forEach(v=>s+=node(v,y[1]));s+=node({x:.5,m:1},y[2]);
    s+=H.arrow(w-25,60,w-25,274,'bf-line')+H.text(w-25,302,'时间','bf-small','middle');
    s+=H.text(12,313,'质量单位：终态质量 M₀','bf-small bf-muted');
    s+=H.text(12,335,'未计平滑吸积或质量损失','bf-small bf-muted');
    return{height:h,svg:s,readout:'逐节点守恒：0.25+0.15=0.40，0.20+0.10=0.30，最后 0.40+0.30+0.30=1.00。节点标签是 M/M₀；圆大小仅辅助辨认。此树由教学示例直接指定，不是从 EPS 的单时刻祖先边际分布唯一还原出的真实并合历史。'};
  };
  R['8-feedback-14'] = function(width) {
    const f=frames(width,['瞬时注能：绝热 Sedov 极限','持续风：热泡与辐射薄壳'],400,290);let s=f.svg;
    f.items.forEach((p,i)=>{
      const cx=p.x+p.w/2,cy=p.y+140,r=Math.min(82,p.w*.29);
      s+=H.circle(cx,cy,r,'bf-area');
      if(i){
        s+=H.circle(cx,cy,r*.82,'bf-area-2');
        s+=`<circle cx="${cx}" cy="${cy}" r="${r*.82}" class="bf-series-2" stroke-dasharray="5 4"/>`;
        s+=H.circle(cx,cy,r*.28,'bf-shape')+H.circle(cx,cy,r*.28,'bf-series-3');
        s+=point(cx,cy,'bf-point-3',4);
      }
      s+=H.circle(cx,cy,r,'bf-series');
      const lines=i?['中心：持续机械能注入','内圈：反向激波','内圈到虚线：受激波加热的风','虚线：接触面，不是激波','虚线到外圈：扫起的冷薄壳','外圈：向环境传播的激波']:['能量在初始时刻注入','外圈：向外传播的强激波','圈内：热的受激波气体','绝热极限：不加冷薄壳','忽略抛射物质量：不加接触面','外半径 R ∝ t²⁄⁵'];
      lines.forEach((t,j)=>s+=H.text(p.x+16,p.y+250+j*25,t,'bf-small'));
    });
    return{height:f.height,svg:s,readout:'两种不同边界条件的分层概念图。左：均匀介质、γ=5/3、点爆炸、无辐射损失的 Sedov–Taylor 极限。右：持续风、热内部近似绝热、外部扫掠层有效冷却，外半径 R∝t³⁄⁵。右图内部半径仅为排版示意，未计算反向激波位置、接触面半径或厚度；不要把它们读成统一的数值解或同一爆炸的两帧。'};
  };
  window.BookEarlyFigureModels={growth,seedField};
}());
