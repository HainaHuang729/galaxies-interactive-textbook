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

  // Teaching optical-depth model for the two shielding mechanisms. It is a
  // declared analytic toy model, not a chemical network or an observed spectrum.
  const MOL_LINES=[.0955,.0992,.1028,.1065,.1101,.1138,.1174],MOL_SIGMA=.0007;
  const molDustTau=(lam,tau0)=>tau0*.15/lam;
  const molH2Tau=(lam,tau0)=>tau0*MOL_LINES.reduce((s,l)=>s+Math.exp(-((lam-l)**2)/(2*MOL_SIGMA**2)),0);
  R['9-molecules-17']=function(width,state={}) {
    const tau0=Number.isFinite(state.molTau)?Math.max(0,Math.min(4,state.molTau)):2;
    const lam=Number.isFinite(state.molLambda)?Math.max(.09,Math.min(.30,state.molLambda)):.2;
    const p=panels(width,['尘埃：宽带的平滑衰减','H₂：离散谱线吸收'],440,330),out=[];
    const L0=.09,L1=.30;
    const sample=n=>lin(L0,L1,n,(v)=>v);
    p.items.forEach((a,i)=>{
      const ax=axes({...a,h:a.h-40},{xmin:L0,xmax:L1,ymin:0,ymax:1,xlabel:'波长 λ / μm（紫外·教学波段）',ylabel:'透射率 F / F₀',xticks:[.1,.15,.2,.25,.3],yticks:[0,.5,1]});
      out.push(ax.svg);
      const tau=i?molH2Tau:molDustTau,cls=i?'bf-series-2':'bf-series';
      const curve=sample(i?2000:500).map(l=>[ax.x(l),ax.y(Math.exp(-tau(l,tau0)))]);
      const area=`M${ax.x(L0).toFixed(1)},${ax.y(1).toFixed(1)}L`+curve.map(q=>`${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L')+`L${ax.x(L1).toFixed(1)},${ax.y(1).toFixed(1)}Z`;
      out.push(`<path d="${area}" fill="${i?'var(--cyan)':'var(--gold)'}" fill-opacity=".12" stroke="none"/>`);
      out.push(H.line(ax.x(L0),ax.y(1),ax.x(L1),ax.y(1),'bf-guide-dash'));
      out.push(H.polyline(curve,cls));
      out.push(tx(ax.x(.215),ax.y(1)+15,'入射 F₀（归一化）','bf-small bf-muted','middle'));
      const tauNow=tau(lam,tau0),fNow=Math.exp(-tauNow),mx=ax.x(lam);
      out.push(H.line(mx,ax.y(0),mx,ax.y(1),'bf-guide-dash'));
      out.push(`<circle cx="${mx.toFixed(2)}" cy="${ax.y(fNow).toFixed(2)}" r="4.4" class="${i?'bf-point-2':'bf-point'}" data-mol-marker="${i}" data-lambda="${lam}" data-tau="${tauNow.toFixed(6)}" data-f="${fNow.toFixed(6)}"/>`);
      const rightSide=mx>ax.plot.x+ax.plot.w*.55,anchor=rightSide?'end':'start',lx=mx+(rightSide?-7:7);
      const yy=i?ax.y(.84):ax.y(.60);
      out.push(tx(lx,yy,`λ=${lam.toFixed(3)} μm：τ=${tauNow.toFixed(2)}`,'bf-callout',anchor));
      out.push(tx(lx,yy+15,`F=${fNow.toFixed(3)}`,'bf-small bf-muted',anchor));
      out.push(tx(a.x+18,a.y+a.h-54,i?'线心吸收强、线间几乎透明':'整段波段被平滑削弱','bf-small bf-muted'));
      out.push(tx(a.x+18,a.y+a.h-34,i?'等效“马赛克”式自遮蔽':'短波端衰减更强（τ ∝ λ⁻¹）','bf-small bf-muted'));
      out.push(tx(a.x+18,a.y+a.h-14,i?`教学谱线：${MOL_LINES.length} 条示意线`:'教学光深：τ_d = τ₀×0.15μm/λ','bf-small bf-muted'));
    });
    const tauD=molDustTau(lam,tau0),tauH=molH2Tau(lam,tau0);
    const readout=`教学光深模型（不是化学网络、也不是观测谱）：尘埃 τ_d = τ₀ × (0.15 μm/λ)，对整段紫外波段平滑削弱；H₂ 只在离散谱线内有吸收（线心 τ≈τ₀，线间 τ=0）。当前 τ₀=${tau0.toFixed(2)}、λ=${lam.toFixed(3)} μm：尘埃 τ=${tauD.toFixed(2)}、F=${Math.exp(-tauD).toFixed(3)}；H₂ τ=${tauH.toFixed(3)}、F=${Math.exp(-tauH).toFixed(3)}。把波长移到谱线之间（例如 0.20 μm），H₂ 几乎透明而尘埃仍然衰减——这正是宽带遮蔽与谱线自遮蔽的区别。谱线位置与宽度是教学示意，不能反演真实柱密度。`;
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-box">
        <div class="bf-slider"><span>光深尺度 τ₀ <output data-sync="mol-tau">${tau0.toFixed(2)}</output></span><input type="range" data-mol-tau data-sync="mol-tau-range" min="0" max="4" step="0.05" value="${tau0}" aria-label="光深尺度"></div>
        <div class="bf-slider"><span>所选波长 λ <output data-sync="mol-lambda">${lam.toFixed(3)} μm</output></span><input type="range" data-mol-lambda data-sync="mol-lambda-range" min="0.09" max="0.3" step="0.001" value="${lam}" aria-label="所选波长（微米）"></div>
        <div class="bf-tabs" style="margin-top:12px"><button type="button" data-mol-preset="0.2">线间 0.200 μm</button><button type="button" data-mol-preset="0.1028">谱线 0.103 μm</button><button type="button" data-mol-reset>恢复默认</button></div>
        <p>同一云中两种机制可以同时存在。拖动波长比只看箭头长短更直接：H₂ 只挡住谱线附近的窄带，尘埃削弱整段光谱。</p>
      </div>
    </div>`;
    return {...result(p,out.join(''),readout),controls,bind(host){
      state.molTau=tau0;state.molLambda=lam;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const patch=()=>{const w=Math.floor(host.clientWidth)||width,next=R['9-molecules-17'](w,state);H.patchSvg(host,next,w);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;};
      host.oninput=event=>{
        if(event.target.matches('[data-mol-tau]')){state.molTau=+event.target.value;patch();}
        else if(event.target.matches('[data-mol-lambda]')){state.molLambda=+event.target.value;patch();}
      };
      host.onclick=event=>{
        const preset=event.target.closest('[data-mol-preset]');
        if(preset){state.molLambda=+preset.dataset.molPreset;patch();return;}
        if(event.target.closest('[data-mol-reset]')){state.molTau=2;state.molLambda=.2;patch();}
      };
    }};
  };

  // Chapter 10 reuses the chapter-2 H–R grammar and the book's main-sequence
  // lifetime fit (eq. 10.72). No evolutionary track or isochrone library is used.
  const trkFigure=(()=>{
    const SUN_LOG=Math.log10(5772),SUN_T=5772;
    const MASS_TABLE=[[.7,3.62],[1,3.76],[2,3.90],[5,4.10]];
    const MASSES=MASS_TABLE.map(([m])=>m);
    const life=m=>(2500+670*Math.pow(m,2.5)+Math.pow(m,4.5))/(.033*Math.pow(m,1.5)+.35*Math.pow(m,4.5))/1000;
    const msLogL=lt=>6.35*(lt-SUN_LOG);
    function logTofMass(m){
      const t=MASS_TABLE;
      if(m<=t[0][0])return t[0][1];
      if(m>=t[t.length-1][0])return t[t.length-1][1];
      for(let i=1;i<t.length;i++)if(m<=t[i][0]){
        const f=(Math.log10(m)-Math.log10(t[i-1][0]))/(Math.log10(t[i][0])-Math.log10(t[i-1][0]));
        return t[i-1][1]+f*(t[i][1]-t[i-1][1]);
      }
      return t[t.length-1][1];
    }
    function turnoffMass(age){
      let lo=.35,hi=12;
      if(life(hi)>age)return hi;
      for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(life(mid)>age)lo=mid;else hi=mid;}
      return (lo+hi)/2;
    }
    return {SUN_T,SUN_LOG,MASS_TABLE,MASSES,life,msLogL,logTofMass,turnoffMass};
  })();
  window.BookTrackFigureModel=trkFigure;
  R['10-tracks-18']=function(width,state={}) {
    const age=Number.isFinite(state.trkAge)?Math.max(.2,Math.min(12,state.trkAge)):4;
    const selMass=trkFigure.MASSES.includes(state.trkMass)?state.trkMass:2;
    const p=panels(width,['同龄星群：谁还留在主序','单颗恒星：主序阶段与年龄','转折质量随年龄'],392,330),out=[];
    const a=p.items[0],L=a.x+54,RX=a.x+a.w-14,T=a.y+66,Bm=a.y+a.h-120;
    const lTmin=Math.log10(2500),lTmax=Math.log10(40000);
    const X=lt=>L+(lTmax-lt)/(lTmax-lTmin)*(RX-L),Y=l=>Bm-(l+6)/12*(Bm-T);
    const to=trkFigure.turnoffMass(age),toLogT=trkFigure.logTofMass(to),toLogL=trkFigure.msLogL(toLogT);
    out.push(H.rect(L,T,RX-L,Bm-T,'hr-plot',3));
    const SUP={'-6':'⁻⁶','-4':'⁻⁴','-2':'⁻²','0':'⁰','2':'²','4':'⁴','6':'⁶'};
    for(const lt of [Math.log10(30000),Math.log10(10000),Math.log10(5000),Math.log10(3500),Math.log10(2500)]){
      out.push(H.line(X(lt),T,X(lt),Bm,'hr-grid')+H.line(X(lt),Bm,X(lt),Bm+4,'hr-axis-line')+H.text(X(lt),Bm+18,Math.round(10**lt).toLocaleString('en-US'),'hr-tick','middle'));
    }
    for(const l of [-6,-4,-2,0,2,4,6]){out.push(H.line(L,Y(l),RX,Y(l),'hr-grid')+H.line(L-4,Y(l),L,Y(l),'hr-axis-line')+H.text(L-8,Y(l)+3.6,l===0?'1':`10${SUP[String(l)]}`,'hr-tick','end'));}
    out.push(H.line(L,T,L,Bm,'hr-axis-line')+H.line(L,Bm,RX,Bm,'hr-axis-line'));
    out.push(H.text(L-6,T-8,'光度 L / L☉','hr-axis-title'));
    out.push(H.text(RX,Bm+40,'表面温度 T / K（向右降低）','hr-axis-title','end'));
    out.push(curve(lin(3.40,4.60,80,lt=>[X(lt),Y(trkFigure.msLogL(lt))]),'bf-series'));
    out.push(H.text(X(4.50)-4,Y(trkFigure.msLogL(4.50))-9,'主序','hr-type-label','end'));
    trkFigure.MASS_TABLE.forEach(([m,lt])=>{
      const on=trkFigure.life(m)>age,px=X(lt),py=Y(trkFigure.msLogL(lt));
      out.push(`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="5.4" class="${on?'bf-point':'bf-point-2'}" fill-opacity="${on?1:.18}" stroke="var(--gold)" stroke-width="1.6" data-trk-mass="${m}" data-trk-on="${on}"/>`);
      out.push(H.text(px,py-11,`${m} M☉`,'hr-iso-label','middle'));
    });
    out.push(H.line(X(toLogT),Y(toLogL),X(toLogT),Bm-4,'bf-guide-dash'));
    out.push(`<path d="M${X(toLogT).toFixed(2)},${(Y(toLogL)-7).toFixed(2)}l-5,9l10,0z" fill="var(--accent)" data-trk-turnoff data-mass="${to}" data-logt="${toLogT}"/>`);
    out.push(H.text(X(toLogT),Bm-12,`转折 ≈${to.toFixed(2)} M☉`,'hr-comparison-title','middle'));
    out.push(H.text(a.x+14,a.y+a.h-62,'实心=仍在主序，空心=已离开','bf-small bf-muted'));
    out.push(H.text(a.x+14,a.y+a.h-40,'质量位置来自教学映射表，不构成等龄线','bf-small bf-muted'));
    out.push(H.text(a.x+14,a.y+a.h-18,'温度方向与 L/L☉ 对数轴同第 2 章','bf-small bf-muted'));
    // B — main-sequence stage bar for the selected mass.
    const b=p.items[1],bx0=b.x+56,bx1=b.x+b.w-18,msLife=trkFigure.life(selMass),tmax=Math.max(msLife*1.35,age*1.1,.6);
    const XB=v=>bx0+v/tmax*(bx1-bx0),yBar=b.y+170;
    out.push(H.line(bx0,yBar,bx1,yBar,'bf-axis'));
    for(const f of [0,.25,.5,.75,1])out.push(H.line(XB(f*tmax),yBar,XB(f*tmax),yBar+5,'bf-axis')+H.text(XB(f*tmax),yBar+20,(f*tmax).toFixed(2),'bf-small','middle'));
    out.push(H.text(bx1,yBar+40,'年龄 / Gyr（零点取主序开始）','bf-small','end'));
    out.push(H.rect(bx0,yBar-18,Math.max(3,XB(msLife)-bx0),18,'bf-bar-a',3));
    out.push(H.rect(XB(msLife),yBar-18,bx1-XB(msLife),18,'bf-soft',3));
    out.push(H.text(bx0,yBar-28,'主序（已计算）','bf-label'));
    out.push(H.text(bx1,yBar-28,'后主序 + 遗迹（时长未计算）','bf-small bf-muted','end'));
    const ageX=Math.max(bx0,Math.min(bx1,XB(age)));
    out.push(H.line(ageX,b.y+108,ageX,yBar+4,'bf-guide-dash')+`<circle cx="${ageX.toFixed(2)}" cy="${yBar+4}" r="4.6" class="bf-point-3" data-trk-age-marker/>`);
    out.push(H.text(ageX+(ageX>b.x+b.w*.6?-6:6),b.y+102,`年龄 ${age.toFixed(2)} Gyr`,'bf-small',ageX>b.x+b.w*.6?'end':'start'));
    const status=age<msLife?'仍在主序':'已离开主序';
    out.push(H.text(bx0,b.y+250,`所选 ${selMass} M☉：主序时长 ${msLife.toFixed(2)} Gyr`,'bf-label'));
    out.push(H.text(bx0,b.y+274,`当前年龄 ${age.toFixed(2)} Gyr → ${status}`,'bf-label'));
    out.push(H.text(bx0,b.y+300,'灰色段只表示“主序之后”，未算时长','bf-small bf-muted'));
    out.push(H.text(bx0,b.y+322,'不画后主序轨迹，也不画等龄线','bf-small bf-muted'));
    // C — turnoff mass against age, from the same fit.
    const c=p.items[2],cx=axes({...c,h:c.h-64},{xmin:.2,xmax:12,ymin:.6,ymax:3.5,xticks:[.2,3,6,9,12],yticks:[.6,1,1.5,2,2.5,3,3.5],xlabel:'年龄 / Gyr',ylabel:'转折质量 / M☉'});
    out.push(cx.svg);
    out.push(curve(lin(.2,12,110,ag=>[cx.x(ag),cx.y(trkFigure.turnoffMass(ag))]),'bf-series'));
    out.push(`<circle cx="${cx.x(age).toFixed(2)}" cy="${cx.y(to).toFixed(2)}" r="5" class="bf-point-3" data-trk-turnoff-dot/>`);
    out.push(H.text(c.x+14,c.y+c.h-38,'由同一主序寿命拟合反解；不是观测等龄线','bf-small bf-muted'));
    out.push(H.text(c.x+14,c.y+c.h-16,`年龄 ${age.toFixed(2)} Gyr → ${to.toFixed(2)} M☉`,'bf-small'));
    const readout=`年龄 ${age.toFixed(2)} Gyr：由第 10 章主序寿命拟合反解，转折质量 ≈${to.toFixed(2)} M☉——比它重的星已离开主序，比它轻的仍在主序。所选 ${selMass} M☉ 的主序时长 ${msLife.toFixed(2)} Gyr，所以当前${status}。赫罗图沿用第 2 章的温度递减方向、L/L☉ 对数轴、颜色与太阳锚点；质量在主序上的位置由教学映射表放置，只用于显示谁还在主序上，不是等龄线或演化轨迹。没有调用演化轨迹库，后主序时长与轨迹均未计算。`;
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-box">
        <div class="bf-slider"><span>星群年龄 <output data-sync="trk-age">${age.toFixed(2)} Gyr</output></span><input type="range" data-trk-age data-sync="trk-age-range" min="0.2" max="12" step="0.05" value="${age}" aria-label="星群年龄（Gyr）"></div>
        <div class="bf-tabs" style="margin-top:12px" role="group" aria-label="选择单颗恒星的质量">${trkFigure.MASSES.map(m=>`<button type="button" data-trk-mass-sel="${m}" data-sync="trk-m-${m}" aria-pressed="${m===selMass}">${m} M☉</button>`).join('')}<button type="button" data-trk-reset>恢复默认</button></div>
        <p>拖动年龄：转折点沿主序移动，右侧曲线给出同一拟合下的转折质量；质量按钮只改中间那一格的单星阶段。</p>
      </div>
    </div>`;
    return {...result(p,out.join(''),readout),controls,bind(host){
      state.trkAge=age;state.trkMass=selMass;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const patch=()=>{const w=Math.floor(host.clientWidth)||width,next=R['10-tracks-18'](w,state);H.patchSvg(host,next,w);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;};
      host.oninput=event=>{if(event.target.matches('[data-trk-age]')){state.trkAge=+event.target.value;patch();}};
      host.onclick=event=>{
        const m=event.target.closest('[data-trk-mass-sel]');
        if(m){state.trkMass=+m.dataset.trkMassSel;patch();return;}
        if(event.target.closest('[data-trk-reset]')){state.trkAge=4;state.trkMass=2;patch();}
      };
    }};
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

  R['12-dynamical-friction-23']=function(width,state={}) {
    const paths=state.friPaths!==false;
    const p=panels(width,['运动卫星与引力尾迹（概念示意）'],380),a=p.items[0],out=[],w=a.w-60,x=a.x+30,y=a.y+180,c=x+w*.64;
    const rand=H.rng(1283);
    out.push(tx(x,a.y+50,'小点=背景粒子；虚线=示意偏折路径','bf-small bf-muted'));
    for(let j=0;j<84;j++)out.push(dot(x+rand()*w,a.y+80+rand()*180,1.7,'bf-point-2'));
    const far=Math.min(w*.44,190);
    out.push(`<path d="M${(c-10).toFixed(1)},${(y-10).toFixed(1)}L${(c-far).toFixed(1)},${(y-74).toFixed(1)}L${(c-far).toFixed(1)},${(y+74).toFixed(1)}Z" fill="var(--cyan)" fill-opacity=".10" stroke="var(--cyan)" stroke-opacity=".45" stroke-dasharray="4 4" stroke-width="1"/>`);
    for(let j=0;j<64;j++){const u=rand(),xx=c-12-u*far,yy=y+(rand()-.5)*(18+u*118);out.push(dot(xx,yy,2,'bf-point'));}
    out.push(tx(c-far-4,y-80,'尾迹：被卫星引力拉出的过密区','bf-small bf-muted','start'));
    if(paths)for(const dy of [-56,0,56]){
      out.push(`<path d="M${Math.min(c+150,x+w-14).toFixed(1)},${(y+dy).toFixed(1)}Q${(c+40).toFixed(1)},${(y+dy*.25).toFixed(1)} ${(c-30).toFixed(1)},${(y+dy*.55).toFixed(1)}T${Math.max(c-130,x+14).toFixed(1)},${(y+dy*.92).toFixed(1)}" fill="none" stroke="var(--accent)" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="3 4"/>`);
    }
    if(paths)out.push(tx(x,a.y+72,'虚线：示意偏折路径（非积分轨道）','bf-small bf-muted'));
    out.push(`<circle cx="${c}" cy="${y}" r="10" fill="var(--gold)" stroke="var(--panel)" stroke-width="2" data-fri-sat/>`);
    out.push(tx(c,y-18,'卫星','bf-callout','middle'));
    out.push(H.arrow(c+14,y-34,c+Math.min(90,w*.22),y-34,'bf-series-3')+tx(c+16,y-42,'v','bf-callout','start'));
    out.push(H.arrow(c-8,y+30,c-Math.min(95,w*.24),y+30,'bf-series')+tx(c-10,y+46,'F：与 v 反向','bf-callout','end'));
    out.push(tx(x,a.y+300,'尾迹对卫星的平均力与运动反向','bf-small bf-muted'));
    out.push(tx(x,a.y+322,'这是无碰撞的引力响应','bf-small bf-muted'));
    out.push(tx(x,a.y+344,'不是气体迎风造成的冲压剥离','bf-small bf-muted'));
    const readout=`引力尾迹概念示意，未自洽求解背景分布函数。卫星（大圆点）向右运动（速度箭头 v），把背景粒子（小点）拉向后方形成过密尾迹（虚线边界）；尾迹对卫星的平均响应力（F 箭头）与运动方向相反。Chandrasekhar 局部近似把平均加速度写成 −C(v)v，C(v)>0。无碰撞指粒子间接触碰撞可忽略，并不排除长期引力相互作用；本图没有气体，也没有迎风剥离。虚线只是示意粒子被拉向尾迹的路径，不是积分轨道。`;
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-box"><div class="bf-row"><label class="bf-toggle"><input type="checkbox" data-fri-paths data-sync="fri-paths" ${paths?'checked':''}> 显示粒子偏折路径（示意）</label></div>
      <p>符号分工：小点=背景粒子，深色点=尾迹中的过密粒子，速度箭头 v，响应力箭头 F。</p></div>
    </div>`;
    return {...result(p,out.join(''),readout),controls,bind(host){
      state.friPaths=paths;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const patch=()=>{const w2=Math.floor(host.clientWidth)||width,next=R['12-dynamical-friction-23'](w2,state);H.patchSvg(host,next,w2);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;};
      host.oninput=event=>{if(event.target.matches('[data-fri-paths]')){state.friPaths=event.target.checked;patch();}};
    }};
  };

  function orbit(initial,steps=20000,dt=.003) {
    const q=[1,.9,.8],rc=.2,acc=r=>{const d=rc*rc+r.reduce((s,v,j)=>s+v*v/(q[j]*q[j]),0);return r.map((v,j)=>-v/(q[j]*q[j]*d));};
    const energy=(r,v)=>.5*v.reduce((s,v)=>s+v*v,0)+.5*Math.log(rc*rc+r.reduce((s,v,j)=>s+v*v/(q[j]*q[j]),0));
    const r=initial.slice(0,3),v=initial.slice(3),e0=energy(r,v),pts=[],samples=[];let err=0,minL=Infinity,maxL=-Infinity;
    for(let i=0;i<=steps;i++) {if(i%7===0){pts.push([r[0],r[1]]);samples.push({t:i*dt,x:r[0],y:r[1],lz:r[0]*v[1]-r[1]*v[0]});}const aa=acc(r);for(let j=0;j<3;j++){v[j]+=.5*dt*aa[j];r[j]+=dt*v[j];}const bb=acc(r);for(let j=0;j<3;j++)v[j]+=.5*dt*bb[j];err=Math.max(err,Math.abs(energy(r,v)-e0));const l=r[0]*v[1]-r[1]*v[0];minL=Math.min(minL,l);maxL=Math.max(maxL,l);}
    return {pts,err,minL,maxL,samples};
  }
  const orbitData=[orbit([1,.35,.15,0,0,0]),orbit([1,0,.1,0,.95,.04])];
  R['13-structure-24']=function(width,state={}) {
    const frac=Number.isFinite(state.orbFrac)?Math.max(0,Math.min(1,state.orbFrac)):1;
    const p=panels(width,['箱轨道：没有单一环绕方向','短轴管轨道：保持环绕方向'],330),out=[];
    p.items.forEach((a,i)=>{
      const ax=axes(a,{xmin:-1.25,xmax:1.25,ymin:-1.25,ymax:1.25,equalAspect:true,xlabel:'x（模型长度）',ylabel:'y',xticks:[-1,0,1],yticks:[-1,0,1]});
      out.push(ax.svg);
      const S=orbitData[i].samples,k=Math.round(frac*(S.length-1)),head=S.slice(0,Math.max(1,k+1)),pts=head.map(v=>[ax.x(v.x),ax.y(v.y)]);
      out.push(curve(orbitData[i].pts.map(v=>[ax.x(v[0]),ax.y(v[1])]),'bf-wire'));
      out.push(curve(pts,i?'bf-series-2':'bf-series'));
      const last=S[k],prev=S[Math.max(0,k-6)];
      const dx=last.x-prev.x,dy=last.y-prev.y,L=Math.hypot(dx,dy)||1;
      if(k>0)out.push(hypotArrow(ax.x(last.x),ax.y(last.y),dx/L,dy/L));
      out.push(`<circle cx="${ax.x(last.x).toFixed(2)}" cy="${ax.y(last.y).toFixed(2)}" r="4.6" class="bf-point-3" data-orb-dot="${i}" data-lz="${last.lz.toFixed(6)}" data-t="${last.t.toFixed(3)}"/>`);
      out.push(tx(a.x+14,a.y+a.h-26,`当前 t=${last.t.toFixed(1)}，Lz=${last.lz>=0?'+':''}${last.lz.toFixed(3)}（模型单位）`,'bf-small'));
      out.push(tx(a.x+14,a.y+a.h-8,`整段 Lz 范围 ${orbitData[i].minL.toFixed(2)} … ${orbitData[i].maxL.toFixed(2)}`,'bf-small bf-muted'));
    });
    const s0=orbitData[0].samples[Math.max(0,Math.round(frac*(orbitData[0].samples.length-1)))];
    const readout=`同一固定三轴对数势 Φ=½ln[0.2²+x²+y²/0.9²+z²/0.8²]，绘出 x–y 投影；无量纲单位。速度 Verlet 积分 Δt=0.003、总时长 60，滑块只截取同一段积分的前一部分，不重新积分。箱轨道的 Lz 在 ${orbitData[0].minL.toFixed(2)} 与 ${orbitData[0].maxL.toFixed(2)} 之间变号（当前 ${s0.lz.toFixed(3)}）；管轨道的 Lz 始终为正。细线是整段轨迹，粗线到当前时刻，箭头是当前运动方向。速度 Verlet 的最大绝对能量漂移：箱 ${orbitData[0].err.toExponential(1)}、管 ${orbitData[1].err.toExponential(1)}（模型能量单位）。没有把单条轨道当作整个星系的自洽模型。`;
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-box">
        <div class="bf-slider"><span>轨道时间 <output data-sync="orb-frac">${(frac*100).toFixed(0)}%</output></span><input type="range" data-orb-frac data-sync="orb-frac-range" min="0" max="1" step="0.005" value="${frac}" aria-label="轨道积分时间比例"></div>
        <p>拖动时间：粗线沿已积分的轨迹前进，当前点的 Lz 符号给出“是否保持环绕方向”。</p>
      </div>
    </div>`;
    return {...result(p,out.join(''),readout),controls,bind(host){
      state.orbFrac=frac;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const patch=()=>{const w=Math.floor(host.clientWidth)||width,next=R['13-structure-24'](w,state);H.patchSvg(host,next,w);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;};
      host.oninput=event=>{if(event.target.matches('[data-orb-frac]')){state.orbFrac=+event.target.value;patch();}};
    }};
  };
  function hypotArrow(x,y,dx,dy){const L=14,hx=x+dx*L,hy=y+dy*L;const a=Math.atan2(dy,dx);return `<path d="M${x.toFixed(1)},${y.toFixed(1)}L${hx.toFixed(1)},${hy.toFixed(1)}" stroke="var(--accent)" stroke-width="2" fill="none"/><path d="M${hx.toFixed(1)},${hy.toFixed(1)}L${(hx-5*Math.cos(a-.5)).toFixed(1)},${(hy-5*Math.sin(a-.5)).toFixed(1)}L${(hx-5*Math.cos(a+.5)).toFixed(1)},${(hy-5*Math.sin(a+.5)).toFixed(1)}Z" fill="var(--accent)"/>`;}

  R['13-plane-25']=function(width,state={}) {
    const p=panels(width,['三维关系：一组指定的基本平面','二维投影：同一组合成点'],356,330),out=[],sample=[];
    for(let j=0;j<5;j++)for(let k=0;k<5;k++){const s=-.24+.12*j,i=-.45+.225*k;sample.push({s,i,r:1.25*s-.8125*i,si:j,ii:k});}
    const slice=Number.isFinite(state.plSlice)?Math.max(.05,Math.min(.45,state.plSlice)):.45;
    const sel=Number.isFinite(state.plSel)?Math.max(0,Math.min(24,Math.round(state.plSel))):-1;
    const a=p.items[0],b=p.items[1];
    const notesBeside=a.w>=440;
    const k=notesBeside?(a.h-64)/1.62:Math.min((a.w-70)/1.24,(a.h-124)/1.62);
    const cx=a.x+(notesBeside?a.w*.40:a.w*.5),cy=notesBeside?a.y+a.h*.5:a.y+66+k*.8;
    const proj=v=>[cx+k*(v.s+.55*v.i),cy-k*(.85*v.r+.30*v.i)];
    const S=.3,I=.55,RZ=.75;
    const corner=(s,i,r)=>proj({s,i,r});
    const box=[];
    for(const r of [-RZ,RZ])for(const i of [-I,I])box.push([corner(-S,i,r),corner(S,i,r)]);
    for(const r of [-RZ,RZ])for(const s of [-S,S])box.push([corner(s,-I,r),corner(s,I,r)]);
    for(const s of [-S,S])for(const i of [-I,I])box.push([corner(s,i,-RZ),corner(s,i,RZ)]);
    for(const [q1,q2] of box)out.push(seg(q1,q2,'bf-wire'));
    const face=[[-S,-I],[S,-I],[S,I],[-S,I]].map(([s,i])=>proj({s,i,r:1.25*s-.8125*i}));
    out.push(`<polygon points="${face.map(q=>q.map(n=>n.toFixed(2)).join(',')).join(' ')}" class="bf-soft-edge"/>`);
    for(const s of [-.24,-.12,0,.12,.24]){const line=[];for(const i of [-I,I])line.push(proj({s,i,r:1.25*s-.8125*i}));out.push(seg(line[0],line[1],'bf-wire'));}
    for(const i of [-.45,-.225,0,.225,.45]){const line=[];for(const s of [-S,S])line.push(proj({s,i,r:1.25*s-.8125*i}));out.push(seg(line[0],line[1],'bf-wire'));}
    const axisLabel=(from,to,text,dx=0,dy=0)=>{const q1=corner(...from),q2=corner(...to),mx=(q1[0]+q2[0])/2+dx,my=(q1[1]+q2[1])/2+dy;out.push(tx(mx,my,text,'bf-callout','middle'));};
    axisLabel([-S,-I,-RZ],[S,-I,-RZ],'s →',0,16);
    axisLabel([S,-I,-RZ],[S,I,-RZ],'i ↗',14,0);
    axisLabel([-S,-I,-RZ],[-S,-I,RZ],'r ↑',-14,0);
    sample.forEach((v,idx)=>{const q=proj(v),on=Math.abs(v.i)<=slice+.001;out.push(`<circle cx="${q[0].toFixed(2)}" cy="${q[1].toFixed(2)}" r="3.4" class="pl-i${v.ii}${on?'':' is-dim'}" data-pl-point="${idx}" data-s="${v.s}" data-i="${v.i}" data-r="${v.r}"/>`);if(idx===sel)out.push(`<circle cx="${q[0].toFixed(2)}" cy="${q[1].toFixed(2)}" r="7" class="bf-series" data-pl-ring/>`);});
    out.push(tx(notesBeside?a.x+a.w-196:a.x+18,notesBeside?a.y+128:a.y+300,'r = 1.25 s − 0.8125 i','bf-small'),tx(notesBeside?a.x+a.w-196:a.x+18,notesBeside?a.y+150:a.y+321,'斜投影；立方框只标方向，不是数据边界','bf-small bf-muted'),tx(notesBeside?a.x+a.w-196:a.x+18,notesBeside?a.y+172:a.y+342,'颜色 = 第三变量 i（0.05 级）','bf-small bf-muted'));
    if(notesBeside)out.push(tx(a.x+a.w-196,a.y+204,'点选：两图同时标出','bf-small bf-muted'));
    if(sel>=0){const v=sample[sel],q=proj(v);out.push(tx(q[0]+10,q[1]-9,`s=${v.s.toFixed(2)}  i=${v.i.toFixed(2)}`,'bf-callout'));}
    const ax=axes(b,{xmin:-.3,xmax:.3,ymin:-.75,ymax:.75,xlabel:'s = log₁₀(σ/200 km s⁻¹)',ylabel:'r = log₁₀(Re/5 kpc)',xticks:[-.2,0,.2],yticks:[-.5,0,.5]});out.push(ax.svg);
    out.push(seg([ax.x(-.28),ax.y(1.25*-.28)],[ax.x(.28),ax.y(1.25*.28)],'bf-guide-dash'));
    sample.forEach((v,idx)=>{const on=Math.abs(v.i)<=slice+.001;out.push(`<circle cx="${ax.x(v.s).toFixed(2)}" cy="${ax.y(v.r).toFixed(2)}" r="3.8" class="pl-i${v.ii}${on?'':' is-dim'}" data-pl-point2="${idx}"/>`);if(idx===sel)out.push(`<circle cx="${ax.x(v.s).toFixed(2)}" cy="${ax.y(v.r).toFixed(2)}" r="7.4" class="bf-series" data-pl-ring/>`);});
    out.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="transparent" tabindex="0" role="application" pointer-events="none" aria-label="合成点选择：左右键沿 s 移动，上下键沿 i 移动" data-pl-key/>`);
    const shown=sample.filter(v=>Math.abs(v.i)<=slice+.001).length;
    let readout=`25 个合成网格点严格位于指定平面 r = 1.25 s − 0.8125 i，零内禀散布，是教学样本而不是观测目录。`;
    readout+=slice>=.44?` 当前显示全部 i 档（25 点）。收窄切片窗口可以看到：二维图上的散开完全来自被略去的 i。`:` 切片 |i| ≤ ${slice.toFixed(2)}：${shown} 个点；窗口越窄，s–r 图上的点越贴近一条斜率 1.25 的直线，说明二维散布来自被略去的 i。`;
    if(sel>=0){const v=sample[sel];readout+=` 选中第 ${sel+1} 点：s=${v.s.toFixed(3)}、i=${v.i.toFixed(3)}、r=${v.r.toFixed(4)}（r 由同一关系算出）。`;}
    const swatches=[0,1,2,3,4].map(ii=>`<i class="bf-swatch pl-i${ii}"></i>`).join('');
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-box">
        <div class="bf-slider"><span>切片窗口 |i| ≤ <output data-sync="pl-slice-out">${slice.toFixed(2)}</output></span><input type="range" data-pl-slice data-sync="pl-slice" min="0.05" max="0.45" step="0.01" value="${slice}" aria-label="第三变量 i 的切片窗口"></div>
        <div class="bf-legend-row"><span>颜色 = i：</span>${swatches}<span>−0.45 → +0.45（合成网格）· 右图虚线为 i = 0 的切片（斜率 1.25）</span></div>
        <p>点选任一合成点，两幅图会同时标出同一点；也可以用键盘左右/上下移动选择。</p>
      </div>
      <div class="bf-tabs" style="margin-top:12px"><button type="button" data-pl-reset>恢复默认</button></div>
    </div>`;
    return {...result(p,out.join(''),readout),controls,bind(host){
      state.plSlice=slice;state.plSel=sel;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const patch=()=>{const keyFocused=host.querySelector('[data-pl-key]')===document.activeElement;const w=Math.floor(host.clientWidth)||width,next=R['13-plane-25'](w,state);H.patchSvg(host,next,w);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;if(keyFocused){const r=host.querySelector('[data-pl-key]');if(r)r.focus({preventScroll:true});}};
      host.onclick=event=>{
        const reset=event.target.closest('[data-pl-reset]');
        if(reset){state.plSlice=.45;state.plSel=-1;patch();return;}
        const point=event.target.closest('[data-pl-point],[data-pl-point2]');
        if(point){const idx=+(point.dataset.plPoint??point.dataset.plPoint2);state.plSel=state.plSel===idx?-1:idx;patch();}
      };
      host.oninput=event=>{if(event.target.matches('[data-pl-slice]')){state.plSlice=+event.target.value;patch();}};
      host.onkeydown=event=>{
        if(!event.target.matches('[data-pl-key]'))return;
        const step={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1],Home:[-9,0],End:[9,0]}[event.key];
        if(!step)return;event.preventDefault();
        const cur=state.plSel>=0?sample[state.plSel]:sample[12];
        let si=Math.max(0,Math.min(4,cur.si+step[0])),ii=Math.max(0,Math.min(4,cur.ii+step[1]));
        state.plSel=si*5+ii;patch();
      };
    }};
  };

  R['14-engine-26']=function(width,state={}) {
    const inc=Number.isFinite(state.engInc)?Math.max(5,Math.min(85,state.engInc)):55;
    const jetOn=!!state.engJet;
    const part=state.engPart||'all';
    const p=panels(width,['从中心向外的空间剖面（非等比例）'],460,330),a=p.items[0],out=[];
    const RD=Math.min(132,(a.w-170)/2.6,(a.h-170)/2.7),cx=a.x+a.w/2,cy=a.y+222;
    const TOR={x:.72,ry:.30,rx:.24},alpha=Math.atan(TOR.ry/TOR.x)*180/Math.PI;
    const blocked=inc<alpha;
    const P=(x,y)=>[cx+x*RD,cy-y*RD];
    const on=k=>part==='all'||part===k;
    const grp=(k,inner)=>`<g data-part="${k}" class="${on(k)?'':'is-dim'}">${inner}</g>`;
    if(jetOn)out.push(grp('jet',H.line(...P(0,-1.40),...P(0,1.40),'bf-series-3')+H.text(...P(0,1.46),'喷流（可选）','bf-callout-muted','middle')));
    let nlr='';
    for(const sgn of [-1,1]){
      const w1=1.34*Math.tan(Math.PI/9);
      nlr+=`<polygon points="${P(0,0).map(v=>v.toFixed(1)).join(',')} ${P(-w1,1.34*sgn).map(v=>v.toFixed(1)).join(',')} ${P(w1,1.34*sgn).map(v=>v.toFixed(1)).join(',')}" fill="var(--cyan)" fill-opacity=".10" stroke="var(--cyan)" stroke-opacity=".38" stroke-width=".9"/>`;
    }
    out.push(grp('nlr',nlr));
    let tor='';
    for(const sgn of [-1,1]){
      const c0=P(TOR.x*sgn,0);
      tor+=`<ellipse cx="${c0[0].toFixed(1)}" cy="${c0[1].toFixed(1)}" rx="${(TOR.rx*RD).toFixed(1)}" ry="${(TOR.ry*RD).toFixed(1)}" fill="var(--soft)" fill-opacity=".9" stroke="var(--muted)" stroke-width="1.1"/>`;
      for(let k=0;k<6;k++){const ang=k/6*2*Math.PI+ .4,rx=TOR.rx*RD*(k%2?.52:.28),ry=TOR.ry*RD*(k%2?.56:.30);tor+=`<circle cx="${(c0[0]+rx*Math.cos(ang)).toFixed(1)}" cy="${(c0[1]+ry*Math.sin(ang)).toFixed(1)}" r="1.6" fill="var(--muted)" fill-opacity=".55"/>`;}
    }
    out.push(grp('torus',tor));
    out.push(grp('disk',`<ellipse cx="${cx}" cy="${cy}" rx="${(.46*RD).toFixed(1)}" ry="${(.06*RD).toFixed(1)}" fill="var(--gold)" fill-opacity=".6"/>`));
    let blr='';for(let k=0;k<9;k++){const ang=k/9*2*Math.PI,rx=.17*RD*(k%2?1:.6),ry=.11*RD*(k%2?1:.7);blr+=`<circle cx="${(cx+rx*Math.cos(ang)).toFixed(1)}" cy="${(cy+ry*Math.sin(ang)).toFixed(1)}" r="2.1" class="bf-point-2"/>`;}
    out.push(grp('blr',blr));
    out.push(`<circle cx="${cx}" cy="${cy}" r="3.6" fill="var(--text)"/>`);
    const ox=cx+1.42*RD*Math.cos(inc*Math.PI/180),oy=cy-1.42*RD*Math.sin(inc*Math.PI/180);
    out.push(H.line(ox,oy,cx,cy,'bf-guide-dash'));
    out.push(`<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="5" fill="var(--accent)" data-eng-observer/>`);
    out.push(H.text(ox+(inc<45?10:-10),oy-8,'观测者视线','bf-small',inc<45?'start':'end'));
    const hy=cy-TOR.x*RD*Math.tan(inc*Math.PI/180),hx=P(TOR.x,0)[0];
    if(blocked)out.push(`<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="7" fill="none" stroke="var(--hot)" stroke-width="2" data-eng-blocked/>`+H.text(hx+9,hy-6,'视线在此穿过尘埃环','bf-callout','start'));
    const lx=Math.max(a.x+74,cx-2.2*RD),rx=Math.min(a.x+a.w-74,cx+2.2*RD);
    out.push(H.line(cx,cy+.16*RD,lx,cy+.34*RD,'bf-guide')+H.text(lx,cy+.38*RD,'吸积盘','bf-callout','middle'));
    out.push(H.line(cx-.12*RD,cy-.10*RD,lx,cy-.52*RD,'bf-guide')+H.text(lx,cy-.56*RD,'广线区 BLR','bf-callout','middle'));
    out.push(H.line(P(TOR.x,.02)[0],cy,rx,cy-.30*RD,'bf-guide')+H.text(rx,cy-.34*RD,'尘埃环 / 遮蔽结构','bf-callout','middle'));
    out.push(H.line(P(1.34*Math.tan(Math.PI/9),1.20)[0],P(1.34*Math.tan(Math.PI/9),1.20)[1],rx,cy-1.02*RD,'bf-guide')+H.text(rx,cy-1.06*RD,'窄线区 NLR','bf-callout','middle'));
    out.push(tx(a.x+18,a.y+a.h-52,`尘埃环张角 α ≈ ${alpha.toFixed(0)}°（示意）`,'bf-small bf-muted'));
    out.push(tx(a.x+18,a.y+a.h-30,`当前 i = ${inc.toFixed(0)}°：宽线区${blocked?'被遮挡':'可见'}`,'bf-small'));
    out.push(tx(a.x+18,a.y+a.h-10,'窄线区在尘埃环之外，两种方向都能看到','bf-small bf-muted'));
    const vis={disk:blocked?'被尘埃环遮挡':'可见',blr:blocked?'被尘埃环遮挡':'可见（宽发射线）',torus:'发出再处理红外，四条视线都可以看到它',nlr:'在尘埃环之外，两种方向都可见'};
    const text={
      all:`空间剖面：中心是黑洞与吸积盘，宽线区在盘上方靠近中心，尘埃环在更外的赤道面，窄线区沿极向延伸到更远。当前 i=${inc.toFixed(0)}°，尘埃环张角约 ${alpha.toFixed(0)}°，所以宽线区${blocked?'被遮挡':'可见'}。`,
      disk:`吸积盘：连续谱的主要来源，紧贴黑洞；视线倾角小于尘埃环张角时，盘与宽线区一起被尘埃环挡住。当前：${vis.disk}。`,
      blr:`广线区 BLR：盘上方、尘埃升华区以内的快速气体，产生宽发射线。它是否可见取决于视线是否穿过尘埃环——这是同一类天体呈现不同宽线谱的几何解释之一。当前：${vis.blr}。`,
      torus:`尘埃环：赤道面上的再处理结构，把中心辐射转成红外，并在小倾角方向遮挡中心。图中厚度/半径给出的张角只是示意。当前：${vis.torus}。`,
      nlr:`窄线区 NLR：位于尘埃环之外、沿极向延伸的电离气体，速度较低，产生窄发射线。因为它在外侧，宽线区被挡住时它仍然可见。当前：${vis.nlr}。`,
      jet:`喷流：沿极向抛出的准直外流，只在部分 AGN 中清楚出现；本图把它作为可选部件，不列为必需结构。`
    };
    const readout=`${text[part]||text.all} 本图不是等比例：同一视野内只比较相对位置，不给出真实半径；各结构尺度随黑洞质量、光度与气体状态改变。`;
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-tabs" role="group" aria-label="选择结构">${[['all','全部'],['disk','吸积盘'],['blr','广线区'],['torus','尘埃环'],['nlr','窄线区'],['jet','喷流']].map(([k,label])=>`<button type="button" data-eng-part="${k}" data-sync="eng-${k}" aria-pressed="${part===k}">${label}</button>`).join('')}</div>
      <div class="bf-box">
        <div class="bf-slider"><span>视线倾角 i（相对盘面）<output data-sync="eng-inc">${inc.toFixed(0)}°</output></span><input type="range" data-eng-inc data-sync="eng-inc-range" min="5" max="85" step="1" value="${inc}" aria-label="视线相对盘面的倾角"></div>
        <div class="bf-row"><label class="bf-toggle"><input type="checkbox" data-eng-jet data-sync="eng-jet-toggle" ${jetOn?'checked':''}> 显示喷流（可选，不是所有 AGN 都有）</label><button type="button" data-eng-reset>恢复默认</button></div>
        <p>把倾角调到小于尘埃环张角，可以看到宽线区被挡住、而窄线区仍然可见；这正是“同一类天体、不同视线”的几何。</p>
      </div>
    </div>`;
    return {...result(p,out.join(''),readout),controls,bind(host){
      state.engInc=inc;state.engJet=jetOn;state.engPart=part;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const patch=()=>{const w=Math.floor(host.clientWidth)||width,next=R['14-engine-26'](w,state);H.patchSvg(host,next,w);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;};
      host.onclick=event=>{
        const tab=event.target.closest('[data-eng-part]');
        if(tab){state.engPart=tab.dataset.engPart;patch();return;}
        if(event.target.closest('[data-eng-reset]')){state.engInc=55;state.engJet=false;state.engPart='all';patch();}
      };
      host.oninput=event=>{
        if(event.target.matches('[data-eng-inc]')){state.engInc=+event.target.value;patch();}
        else if(event.target.matches('[data-eng-jet]')){state.engJet=event.target.checked;patch();}
      };
    }};
  };

  R['14-engine-27']=function(width) {
    const p=panels(width,['薄球壳：近侧与远侧的路径差','等到达延迟：观察方向的投影'],286),out=[];
    p.items.forEach((a,j)=>{
      if(!j){const cx=a.x+a.w*.42,cy=a.y+137,rr=Math.min(64,a.w*.2),right=a.x+a.w-25;
        out.push(ellipse(cx,cy,rr,rr,'bf-line'),dot(cx,cy,5),tx(cx,cy+23,'中心','bf-small','middle'));
        [-1,1].forEach((sign,k)=>{const xx=cx+sign*rr;out.push(dot(xx,cy,4,k?'bf-point-2':'bf-point-3'),H.arrow(cx,cy-4,xx,cy-4,k?'bf-series-2':'bf-series-3'));out.push(H.arrow(xx,cy+(k?18:-18),right,cy+(k?18:-18),k?'bf-series-2':'bf-series-3'));});
        out.push(H.arrow(cx,a.y+190,right,a.y+190,'bf-line'),tx(cx,a.y+211,'直接闪光：延迟的零点','bf-small'));
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
    const p=panels(width,['样本A：每座晕都有 2 个成员','样本B：一半空、一半 4 个成员'],330,300),out=[];
    p.items.forEach((a,j)=>{
      const occ=j?[0,0,4,4]:[2,2,2,2];
      let total=0;
      occ.forEach((n,k)=>{
        const cx=a.x+a.w*(k%2?.72:.28),cy=a.y+104+Math.floor(k/2)*108,rr=Math.min(38,a.w*.13);
        out.push(ellipse(cx,cy,rr,rr,'bf-line'));
        const pts=Array.from({length:n},(_,i)=>[cx+rr*.6*Math.cos(T*i/n-Math.PI/2),cy+rr*.6*Math.sin(T*i/n-Math.PI/2)]);
        for(let u=0;u<n;u++)for(let v=u+1;v<n;v++){out.push(`<line x1="${pts[u][0].toFixed(1)}" y1="${pts[u][1].toFixed(1)}" x2="${pts[v][0].toFixed(1)}" y2="${pts[v][1].toFixed(1)}" class="bf-series-2" data-pair/>`);total++;}
        pts.forEach(v=>out.push(dot(v[0],v[1],4.6,j?'bf-point-2':'bf-point')));
        out.push(tx(cx,cy+rr+18,`N=${n}`,'bf-small','middle'));
      });
      out.push(tx(a.x+20,a.y+40,`本组配对总数 = ${total}`,'bf-label'));
      out.push(tx(a.x+20,a.y+62,j?'4 晕 8 星系；配对集中在两座晕里':'4 晕 8 星系；每晕恰好一对','bf-small bf-muted'));
      out.push(tx(a.x+20,a.y+a.h-38,'大圆=晕；小点=成员星系；细线=一对成员','bf-small bf-muted'));
      out.push(tx(a.x+20,a.y+a.h-16,`〈N〉=2；〈N(N−1)〉=${j?6:2}；配对数 ${j?12:4}`,'bf-small'));
    });
    return result(p,out.join(''),'每组都有4座晕、8个星系。A的不重复同晕配对数为4，B为12；细线连接每一对成员，图形上方直接给出本组配对总数。〈N(N−1)〉统计有序对，是每晕不重复配对数均值的两倍。这里只比较具体占据计数，未加入质量分布、内部径向分布或晕偏倚。');
  };

  function density(x,c=1.2) {return window.AdvancedPhysics.forestDensity(x,c);}
  R['16-lyman-forest-30']=function(width,state={}) {
    const p=panels(width,['同一视线：合成密度起伏','对应透射：F = exp(−AΔ^q)'],320,300),out=[],q=2-.7*(1.5-1),A=.35;
    const probe=Number.isFinite(state.lfProbe)?Math.max(0,Math.min(100,state.lfProbe)):55;
    p.items.forEach((a,j)=>{
      const ax=axes(a,{xmin:0,xmax:100,ymin:0,ymax:j?1:4,xlabel:'合成视线坐标（任意长度）',ylabel:j?'透射 F':'Δ=ρ/ρ̄（模型）',xticks:[0,25,50,75,100],yticks:j?[0,.5,1]:[0,2,4]});
      out.push(`<g data-lf-panel="${j}">`+ax.svg+curve(lin(0,100,301,x=>[ax.x(x),ax.y(j?Math.exp(-A*density(x)**q):density(x))]),j?'bf-series-2':'bf-series')+`</g>`);
      [21,55,82].forEach(x=>{out.push(H.line(ax.x(x),ax.y(0),ax.x(x),ax.y(j?1:4),'bf-guide-dash'));});
    });
    out.push(`<g class="lf-probe" aria-hidden="true"></g>`);
    out.push(`<rect x="${p.items[0].x}" y="${p.items[0].y}" width="${p.items[0].w}" height="${p.items[0].h+p.items[1].y+p.items[1].h-p.items[0].y}" fill="transparent" tabindex="0" role="application" aria-label="共享探针：左右键沿视线移动，读取两幅图同一位置的值"/>`);
    const d=density(probe),F=Math.exp(-A*d**q);
    const readout=`共享探针在 χ=${probe.toFixed(1)}：Δ=${d.toFixed(3)}，F=${F.toFixed(3)}。移动探针（或聚焦后按左右键）时，两幅图在同一横坐标上同时标出，读数来自同一个密度函数。直接调用森林实验的同一个密度函数，contrast=1.2，A=0.35，γ=1.5，q=1.65；原始正密度除以 0–100 视线窗口的积分均值，保证该窗口 ⟨Δ⟩=1。没有热展宽、速度畸变或屏蔽，因此不能从每道谷唯一反演真实气团位置。`;
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-box">
        <div class="bf-slider"><span>探针位置 χ <output data-sync="lf-probe">${probe.toFixed(1)}</output></span><input type="range" data-lf-slider data-sync="lf-probe-range" min="0" max="100" step="0.5" value="${probe}" aria-label="视线上的探针位置"></div>
        <p>两幅图共用同一个横坐标；探针读数与曲线来自同一个密度函数，不是两次近似。</p>
      </div>
    </div>`;
    return {...result(p,out.join(''),readout),controls,bind(host){
      state.lfProbe=probe;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const g=()=>host.querySelector('.lf-probe');
      const plots=()=>[...host.querySelectorAll('svg rect.bf-plot-bg')].map(r=>({x:+r.getAttribute('x'),y:+r.getAttribute('y'),w:+r.getAttribute('width'),h:+r.getAttribute('height')}));
      const syncControls=chi=>{
        const range=host.querySelector('[data-lf-slider]');if(range&&range.value!==String(chi))range.value=String(chi);
        const output=host.querySelector('[data-sync="lf-probe"]');if(output)output.textContent=chi.toFixed(1);
      };
      // One writer: figure marks, slider, live output and readout always move together.
      const drawProbe=()=>{
        const el=g();if(!el)return;const rects=plots();if(rects.length<2)return;
        const chi=Math.max(0,Math.min(100,state.lfProbe)),val=density(chi),f=Math.exp(-A*val**q);
        el.innerHTML=rects.map((r,j)=>{const x=r.x+chi/100*r.w;return `<line x1="${x.toFixed(1)}" y1="${r.y}" x2="${x.toFixed(1)}" y2="${r.y+r.h}" class="bf-crosshair"/><circle cx="${x.toFixed(1)}" cy="${(r.y+r.h-(j?f:val/(j?1:4))*r.h).toFixed(1)}" r="4" class="${j?'bf-point-2':'bf-point'}"/>`;}).join('')
          +`<text x="${(rects[0].x+chi/100*rects[0].w+(chi>=92?-6:6)).toFixed(1)}" y="${(rects[0].y+16).toFixed(1)}" text-anchor="${chi>=92?'end':'start'}" class="bf-callout">χ=${chi.toFixed(1)}</text>`;
        syncControls(chi);
        const out2=readoutEl();if(out2)out2.textContent=`共享探针在 χ=${chi.toFixed(1)}：Δ=${val.toFixed(3)}，F=${f.toFixed(3)}。两幅图在同一横坐标上同时标出，读数来自同一个密度函数（contrast=1.2，A=0.35，q=1.65）。没有热展宽、速度畸变或屏蔽，不能从每道谷唯一反演真实气团位置。`;
      };
      host.oninput=event=>{if(event.target.matches('[data-lf-slider]')){state.lfProbe=+event.target.value;drawProbe();}};
      host.onpointermove=event=>{
        const svg=host.querySelector('svg');if(!svg)return;
        const box=svg.getBoundingClientRect(),vw=Number(svg.getAttribute('width'))||width,vh=Number(svg.getAttribute('height'))||1;
        const vx=(event.clientX-box.left)*vw/box.width,vy=(event.clientY-box.top)*vh/box.height;
        const hit=plots().find(r=>vx>=r.x&&vx<=r.x+r.w&&vy>=r.y&&vy<=r.y+r.h);
        if(!hit)return;
        state.lfProbe=Math.max(0,Math.min(100,(vx-hit.x)/hit.w*100));drawProbe();
      };
      host.onkeydown=event=>{
        if(!event.target.matches('[role="application"]'))return;
        const step={ArrowLeft:-2,ArrowRight:2,Home:-100,End:100}[event.key];
        if(step===undefined)return;event.preventDefault();
        state.lfProbe=Math.max(0,Math.min(100,state.lfProbe+step));drawProbe();
      };
      drawProbe();
    }};
  };

  R['16-limit-systems-31']=function(width) {
    const p=panels(width,['柱密度与系统的包含关系'],420),a=p.items[0],out=[],l=a.x+62,r=a.x+a.w-30,y=a.y+90,xx=n=>l+(n-12)/(22-12)*(r-l);
    const dla=Math.log10(2e20);
    out.push(H.arrow(l,y,r,y,'bf-axis'));
    [12,15,17.2,20.3,22].forEach(n=>out.push(H.line(xx(n),y-4,xx(n),y+5,'bf-axis')+tx(xx(n),y+22,n.toFixed(1),'bf-small','middle')));
    out.push(tx((l+r)/2,a.y+150,'log₁₀[NHI / cm⁻²]','bf-small','middle'));
    const row1=a.y+176,row2=a.y+228;
    out.push(H.rect(xx(12),row1,xx(17.2)-xx(12),30,'bf-soft',3).replace('/>',' data-limit-band="forest"/>'));
    out.push(H.rect(xx(17.2),row1,xx(22)-xx(17.2),30,'bf-bar-a',3).replace('/>',' data-limit-band="lls"/>'));
    out.push(tx((xx(12)+xx(17.2))/2,row1+20,'森林','bf-small bf-muted','middle'));
    out.push(tx(xx(17.2)+8,row1+20,'广义 LLS','bf-label'));
    out.push(H.rect(xx(dla),row2,xx(22)-xx(dla),30,'bf-bar-b',3).replace('/>',' data-limit-band="dla"/>'));
    out.push(tx(xx(dla)-6,row2+20,'DLA（NHI ≥ 2×10²⁰）','bf-label','end'));
    out.push(`<rect x="${xx(dla).toFixed(1)}" y="${row1}" width="${(xx(22)-xx(dla)).toFixed(1)}" height="30" fill="none" stroke="var(--cyan)" stroke-dasharray="4 3" rx="2"/>`);
    out.push(`<line x1="${xx(dla).toFixed(1)}" y1="${row1}" x2="${xx(dla).toFixed(1)}" y2="${row2+30}" class="bf-guide-dash"/>`);
    out.push(`<text x="${(xx(dla)-6).toFixed(1)}" y="${(row1+44).toFixed(1)}" class="bf-callout-accent" text-anchor="end">⊂ 包含在 LLS 内</text>`);
    out.push(tx(l,a.y+296,'森林：低柱密度，Lyα 吸收较弱','bf-small bf-muted'));
    out.push(tx(l,a.y+318,'LLS：Lyman 边缘光深约为 1','bf-small bf-muted'));
    out.push(tx(l,a.y+340,'虚线框 = DLA 在 LLS 内的范围','bf-small bf-muted'));
    out.push(tx(l,a.y+362,'DLA：NHI ≥ 2×10²⁰ cm⁻²','bf-small bf-muted'));
    out.push(tx(l,a.y+382,'三者是包含关系，不是互斥三组','bf-small bf-muted'));
    out.push(tx(l,a.y+402,'阈值依目录约定；不计算阻尼翼','bf-small bf-muted'));
    return result(p,out.join(''),'广义LLS按912Å边缘光深约为1定义（NHI ≳ 1/σ₉₁₂ ≈ 1.6×10¹⁷ cm⁻²）；DLA 在更高柱密度一端（惯例 NHI ≥ 2×10²⁰ cm⁻²），图中用嵌套带表示它包含在广义 LLS 内，不是互斥第三组。低柱密度森林与部分LLS的细分阈值可依目录约定不同。边缘是束缚—自由吸收，Lyα 1215.67Å是束缚—束缚线吸收。图不计算阻尼翼；阈值依据本章§16.7–16.8及现有Lyman极限实验。');
  };
  window.BookFigureLateDiagnostics={orbitData,joint,density,bins,simpson,diskProjection,diskLOS,diskLOSCentre};
}());
