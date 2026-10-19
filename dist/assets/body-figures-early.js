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
  let dvSerial=0;
  R['1-diversity-0'] = function(width,state={}) {
    const names=['椭圆 E','透镜 S0','无棒旋涡 S','有棒旋涡 SB'];
    const keys=['E','S0','S','SB'];
    const parts=[['all','全部'],['bulge','核球'],['disk','盘'],['arms','旋臂'],['bar','棒']];
    const sel=parts.some(([k])=>k===state.divPart)?state.divPart:'all';
    const focused=Number.isFinite(state.divClass)&&state.divClass>=0&&state.divClass<4?Math.round(state.divClass):-1;
    const has={E:{},S0:{bulge:1,disk:1},S:{bulge:1,disk:1,arms:1},SB:{bulge:1,disk:1,arms:1,bar:1}};
    const cols=width>=640?2:1,gap=20,pw=(width-gap*(cols-1))/cols,ph=244,rows=Math.ceil(4/cols),height=rows*ph+gap*(rows-1);
    const gid=`dv-bulge-${++dvSerial}`;
    let s=`<defs><radialGradient id="${gid}"><stop offset="0" stop-color="var(--gold)" stop-opacity=".9"/><stop offset=".55" stop-color="var(--gold)" stop-opacity=".35"/><stop offset="1" stop-color="var(--gold)" stop-opacity="0"/></radialGradient></defs>`;
    for(let i=0;i<4;i++){
      const p={x:(i%cols)*(pw+gap),y:Math.floor(i/cols)*(ph+gap),w:pw,h:ph};
      const cx=p.x+pw/2,cy=p.y+112,r=Math.min(100,pw*.33,96),own=has[keys[i]];
      s+=H.rect(p.x,p.y,pw,ph,focused===i?'bf-panel bf-panel-focus':'bf-panel',8)+H.text(p.x+14,p.y+26,names[i],'bf-title');
      const pc=(k,cls)=>`${cls}${sel!=='all'&&sel!==k?' is-dim':''}`;
      if(i===0){
        for(let j=5;j>=1;j--)s+=`<ellipse cx="${cx}" cy="${cy}" rx="${(r*j/5).toFixed(1)}" ry="${(r*.64*j/5).toFixed(1)}" class="${pc('spheroid','bf-series')}" opacity="${(.3+.13*j).toFixed(2)}" data-part="spheroid"/>`;
      }else{
        s+=`<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${(r*.46).toFixed(1)}" class="${pc('disk','bf-soft-edge')}" data-part="disk"/>`;
        if(own.arms){
          let arms='';
          for(const arm of [0,1])for(const strand of [0,1]){
            const pts=[];for(let j=0;j<=60;j++){const t=j/60,ang=arm*Math.PI+.35+strand*.17+t*3.4,rr=r*(.26+.68*t);pts.push([cx+rr*Math.cos(ang),cy+rr*.46*Math.sin(ang)]);}
            arms+=H.polyline(pts,pc('arms','bf-series'));
          }
          s+=`<g data-part="arms">${arms}</g>`;
        }
        if(own.bar)s+=`<line x1="${cx-r*.52}" y1="${cy}" x2="${cx+r*.52}" y2="${cy}" class="${pc('bar','bf-series')}" style="stroke-width:${(r*.16).toFixed(1)}px;stroke-linecap:round" data-part="bar"/>`;
      }
      if(i>0)s+=`<ellipse cx="${cx}" cy="${cy}" rx="${(r*.24).toFixed(1)}" ry="${(r*.21).toFixed(1)}" class="${pc('bulge','')}" fill="url(#${gid})" data-part="bulge"/>`;
      if(sel!=='all'&&own[sel]){
        const spot={bulge:[cx,cy-r*.28],disk:[cx+r*.6,cy+r*.34],arms:[cx-r*.74,cy-r*.5],bar:[cx+r*.62,cy-r*.15]}[sel];
        s+=H.text(spot[0],spot[1],{bulge:'核球',disk:'盘',arms:'旋臂',bar:'棒'}[sel],'bf-callout-accent','middle');
      }
      if(sel!=='all'&&i===0)s+=H.text(cx,cy+4,`不分解${parts.find(([k])=>k===sel)[1]}`,'bf-callout-muted','middle');
      const token=(k,label)=>{const present=!!own[k],hot=sel===k;return `${label} <tspan class="${hot?'bf-sel':present?'bf-has':'bf-none'}">${present?'有':'无'}</tspan>`;};
      if(i===0){
        s+=`<text x="${cx}" y="${p.y+200}" class="bf-small" text-anchor="middle">整体椭球恒星系统</text>`;
        s+=`<text x="${cx}" y="${p.y+220}" class="bf-small bf-muted" text-anchor="middle">本图不分解核球 / 盘</text>`;
      }else{
        s+=`<text x="${cx}" y="${p.y+206}" class="bf-small" text-anchor="middle">${token('bulge','核球')} · ${token('disk','盘')} · ${token('arms','旋臂')} · ${token('bar','棒')}</text>`;
      }
      s+=H.text(cx,p.y+228,'并排比较结构，不是演化顺序','bf-small bf-muted','middle');
      s+=`<rect x="${p.x}" y="${p.y}" width="${pw}" height="${ph}" fill="transparent" data-div-panel="${i}" aria-hidden="true"/>`;
    }
    const partText={
      all:'四种形态按“核球、盘、旋臂、棒”的有无并排。点选一个部件，四格会同时只保留该部件；也可以点击某一格查看它的部件清单。',
      bulge:'核球：S0、S、SB 是盘星系中心的致密恒星成分。椭圆星系 E 在本图不分解出独立的核球与盘，整体画成椭球状恒星系统；没有任何一格把 E 说成“有独立核球”。',
      disk:'盘：E 没有恒星盘；S0、S、SB 都有。S0 与 S 的关键差别不在盘的有无，而在盘内有没有清楚的旋臂结构。',
      arms:'旋臂：只有 S 与 SB 有，是盘内的旋臂结构（密度波是对它的一种解释，不是唯一解释）。旋臂不是绕在星系外面的实体结构。',
      bar:'棒：只有 SB 有。棒位于盘内、穿过中心，与旋臂是两种不同的结构；本图只示意存在与位置，未按亮度比例绘制。'
    };
    let readout=`形态分类的四格只比较结构，排列不表示年龄顺序，也不是一条必经的演化路线；真实星系存在连续变化与其他形态。 ${partText[sel]}`;
    if(focused>=0)readout+=` 当前格：${names[focused]} —— ${['整体为椭球状恒星系统，本图不分解核球、盘、旋臂或棒','有盘与中心致密成分，但没有清楚的旋臂','有中心致密成分、盘与两条旋臂，没有棒','盘内含棒，同时有旋臂'][focused]}。`;
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-tabs" role="group" aria-label="比较形态部件">${parts.map(([k,label])=>`<button type="button" data-div-part="${k}" data-sync="div-${k}" aria-pressed="${sel===k}">${label}</button>`).join('')}</div>
      <div class="bf-row"><button type="button" data-div-reset>恢复默认</button><p style="margin:0">点选格子可读取该类的部件清单；这不是演化序列。</p></div>
    </div>`;
    return {height,svg:s,controls,readout,bind(host){
      state.divPart=sel;state.divClass=focused;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const patch=()=>{const w=Math.floor(host.clientWidth)||width,next=R['1-diversity-0'](w,state);H.patchSvg(host,next,w);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;};
      host.onclick=event=>{
        const tab=event.target.closest('[data-div-part]');
        if(tab){state.divPart=tab.dataset.divPart;patch();return;}
        if(event.target.closest('[data-div-reset]')){state.divPart='all';state.divClass=-1;patch();return;}
        const panel=event.target.closest('[data-div-panel]');
        if(panel){const i=+panel.dataset.divPanel;state.divClass=state.divClass===i?-1:i;patch();}
      };
    }};
  };
  R['1-clocks-1'] = function(width) {
    const names=['① 较早：恒星先出生','② 随后：星系开始并合','③ 较晚：恒星汇集在一起'];
    const f=frames(width,names,320,width>=720?220:width);let s='';
    const stars=(origin,cx,cy)=>[-17,0,17].map((dx,k)=>`<circle data-star-id="${origin}-${k}" data-star-origin="${origin}" cx="${cx+dx}" cy="${cy}" r="4.5" class="${['bf-point','bf-point-2','bf-point-3'][origin]}"/>`).join('');
    f.items.forEach((p,i)=>{
      const cx=p.x+p.w/2;
      s+=`<g data-assembly-stage="${i+1}">`+H.rect(p.x,p.y,p.w,p.h,'bf-panel',8)+title(p,names[i]);
      const galaxy=(id,y,rx,ry,content)=>`<g data-galaxy="${id}">`+ellipse(cx,p.y+y,rx,ry,'bf-shape')+content+'</g>';
      if(i===0){
        [91,157,223].forEach((y,j)=>{
          s+=H.text(cx,p.y+y-29,'星系 '+['A','B','C'][j],'bf-label','middle');
          s+=galaxy(['A','B','C'][j],y,63,22,stars(j,cx,p.y+y));
        });
        s+=H.text(cx,p.y+280,'三座星系，各自已有恒星','bf-label','middle');
        s+=H.text(cx,p.y+303,'它们还没有汇集到同一座星系','bf-small bf-muted','middle');
      }else if(i===1){
        s+=H.text(cx,p.y+70,'A 与 B 已并合','bf-label','middle');
        s+=galaxy('AB',115,82,37,stars(0,cx,p.y+103)+stars(1,cx,p.y+127));
        s+=H.text(cx,p.y+188,'C 仍是另一座星系','bf-label','middle');
        s+=galaxy('C',223,63,22,stars(2,cx,p.y+223));
        s+=H.text(cx,p.y+280,'组装进行中','bf-label','middle');
        s+=H.text(cx,p.y+303,'圆点仍是原来那批恒星','bf-small bf-muted','middle');
      }else{
        s+=H.text(cx,p.y+77,'A、B、C 最终汇集','bf-label','middle');
        s+=galaxy('ABC',155,85,64,stars(0,cx,p.y+131)+stars(1,cx,p.y+155)+stars(2,cx,p.y+179));
        s+=H.text(cx,p.y+248,'现在属于同一座星系','bf-label','middle');
        s+=H.text(cx,p.y+280,'星系可以刚组装好','bf-label','middle');
        s+=H.text(cx,p.y+303,'里面的恒星却早已出生','bf-small bf-muted','middle');
      }
      s+='</g>';
      if(i<2){const next=f.items[i+1];s+=next.y===p.y?H.arrow(p.x+p.w+4,p.y+160,next.x-4,next.y+160,'bf-series'):H.arrow(cx,p.y+p.h+4,cx,next.y-4,'bf-series');}
    });
    return {height:f.height,svg:s,legend:[['bf-series','A 中出生的恒星','dot'],['bf-series-2','B 中出生的恒星','dot'],['bf-series-3','C 中出生的恒星','dot']],readout:'从①到③追踪同一批圆点：恒星先在不同星系里出生，后来才随星系并合汇集。圆点代表恒星，外轮廓代表它们当时所属的星系；颜色只区分出生地。为看清组装过程，此例不画新增恒星；圆点数量、轮廓大小和阶段间距不表示真实星数、质量或年代。'};
  };
  let hrSerial=0;
  const hrFigure=(() => {
    const SUN_T=5772,SUN_LOG=Math.log10(SUN_T);
    const DOMAIN={logTMin:Math.log10(2500),logTMax:Math.log10(40000),logLMin:-6,logLMax:6};
    const ORDER=['main','giant','dwarf'];
    const GROUPS={
      main:{label:'主序',count:100,range:[Math.log10(2500),4.60],scatter:.16,band:.26,seed:20261018},
      giant:{label:'巨星',count:40,range:[3.48,3.84],scatter:.16,band:.28,seed:20261019},
      dwarf:{label:'白矮星',count:30,range:[3.61,4.48],scatter:.14,band:.24,seed:20261020}
    };
    const COMPARE_RADII=[.01,1,30];
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    function interp(points,v){
      if(v<=points[0][0])return points[0][1];
      if(v>=points[points.length-1][0])return points[points.length-1][1];
      for(let i=1;i<points.length;i++)if(v<=points[i][0]){
        const [x0,y0]=points[i-1],[x1,y1]=points[i];
        return y0+(y1-y0)*(v-x0)/(x1-x0);
      }
      return points[points.length-1][1];
    }
    const giantTrack=[[3.48,2.68],[3.55,2.45],[3.63,2.12],[3.72,1.70],[3.80,1.28],[3.84,1.12]];
    function trackLogL(type,logT){
      if(type==='main')return 6.35*(logT-SUN_LOG);
      if(type==='giant')return interp(giantTrack,logT);
      return 2*Math.log10(.012)+4*(logT-SUN_LOG);
    }
    function buildPoints(type){
      const def=GROUPS[type],rng=H.rng(def.seed),points=[];
      for(let i=0;i<def.count;i++){
        const base=def.range[0]+(def.range[1]-def.range[0])*(i+.5)/def.count;
        const logT=clamp(base+(rng()-.5)*.055,def.range[0],def.range[1]);
        const u=(rng()+rng()+rng()-1.5)/1.5;
        const logL=trackLogL(type,logT)+u*def.scatter*(i%29===0?1.3:1);
        points.push(Object.freeze({id:`synthetic-${type}-${String(i+1).padStart(3,'0')}`,type,T:10**logT,L:10**logL,logT,logL}));
      }
      return Object.freeze(points);
    }
    const POINTS=Object.freeze(Object.fromEntries(ORDER.map(type=>[type,buildPoints(type)])));
    const COUNTS=Object.freeze(Object.fromEntries(ORDER.map(type=>[type,POINTS[type].length])));
    const TEMP_STOPS=[[3.39794,[255,117,102]],[3.50,[255,151,100]],[3.62,[255,185,116]],[3.74,[255,222,151]],[3.82,[255,241,207]],[3.95,[221,234,255]],[4.20,[166,199,255]],[4.602,[112,161,255]]];
    function tempColor(logT){
      const t=clamp(logT,TEMP_STOPS[0][0],TEMP_STOPS[TEMP_STOPS.length-1][0]);
      for(let i=1;i<TEMP_STOPS.length;i++)if(t<=TEMP_STOPS[i][0]){
        const [t0,c0]=TEMP_STOPS[i-1],[t1,c1]=TEMP_STOPS[i],f=(t-t0)/(t1-t0);
        return `rgb(${c0.map((v,j)=>Math.round(v+(c1[j]-v)*f)).join(',')})`;
      }
      return 'rgb(112,161,255)';
    }
    const SUPS={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
    const sup=n=>String(n).split('').map(c=>SUPS[c]??c).join('');
    function sci(v,digits=1){const e=Math.floor(Math.log10(v)),m=v/10**e;return `${m.toFixed(digits)}×10${sup(e)}`;}
    function formatLum(L){return (L>=1e4||(L>0&&L<1e-3))?sci(L,2):L>=100?L.toFixed(0):L>=1?L.toFixed(2):L.toFixed(L>=.01?3:4);}
    const formatInt=n=>Math.round(n).toLocaleString('en-US');
    function luminosity(R,T){return R*R*(T/SUN_T)**4;}
    function comparisonAt(T){
      return COMPARE_RADII.map(R=>{const L=luminosity(R,T);return {R,T,L,logL:Math.log10(L)};});
    }
    return {SUN_T,SUN_LOG,DOMAIN,ORDER,GROUPS,POINTS,COUNTS,COMPARE_RADII,trackLogL,tempColor,formatLum,formatInt,luminosity,comparisonAt,sup};
  })();
  window.BookHrFigureModel=hrFigure;
  R['2-stars-3'] = function(width,state={}) {
    const M=hrFigure,D=M.DOMAIN;
    const selected=Object.hasOwn(M.GROUPS,state.hrGroup)?state.hrGroup:'all';
    const comparison=!!state.hrCompare;
    const temperature=Math.max(3500,Math.min(10000,Number.isFinite(state.hrTemperature)?state.hrTemperature:M.SUN_T));
    const sunFocus=!!state.hrSunFocus;
    const compact=width<560,tight=width<268;
    const left=tight?38:compact?44:58,right=tight?8:compact?12:18,top=compact?72:92,bottom=compact?56:64;
    const plotW=Math.max(120,width-left-right);
    const plotH=Math.round(compact?Math.max(286,Math.min(380,width*1.08)):Math.max(430,Math.min(520,width*.44)));
    const height=top+plotH+bottom;
    const logMin=Math.log10(2500),logMax=Math.log10(40000);
    const x=t=>left+(logMax-Math.log10(t))/(logMax-logMin)*plotW;
    const xl=lt=>left+(logMax-lt)/(logMax-logMin)*plotW;
    const y=l=>top+(D.logLMax-l)/(D.logLMax-D.logLMin)*plotH;
    const id=`hr-chart-${++hrSerial}`;
    const dot=compact?1.55:2.1;
    const allSelected=selected==='all';
    const groupLabel=allSelected?'全部类型':M.GROUPS[selected].label;
    let s=`<defs><linearGradient id="${id}-temperature" x1="0" x2="1">`;
    for(let i=0;i<=8;i++){const lt=D.logTMax-(D.logTMax-D.logTMin)*i/8;s+=`<stop offset="${(i/8*100).toFixed(1)}%" stop-color="${M.tempColor(lt)}"/>`;}
    s+=`</linearGradient><clipPath id="${id}-clip"><rect x="${left}" y="${top}" width="${plotW}" height="${plotH}" rx="3"/></clipPath></defs>`;
    s+=`<g class="hr-diagram${compact?' is-compact':''}${tight?' is-tight':''}" data-hr-chart data-hr-left="${left}" data-hr-top="${top}" data-hr-plot-width="${plotW}" data-hr-plot-height="${plotH}" data-hr-logt-min="${D.logTMin}" data-hr-logt-max="${D.logTMax}" data-hr-logl-min="${D.logLMin}" data-hr-logl-max="${D.logLMax}" data-hr-sun-t="${M.SUN_T}" data-hr-selected="${selected}" data-hr-comparison-state="${comparison}" data-hr-sun-focus="${sunFocus}">`;
    s+=H.text(left,compact?13:18,compact?'合成教学点：颜色=温度，点大小相同（非观测）':'合成教学点（非观测）· 颜色=温度 · 所有点大小相同，不表示半径 · 无演化轨迹','hr-note');
    s+=H.text(left,compact?28:36,compact?'等半径（黑体）：L/L☉=(R/R☉)²(T/5772K)⁴':'等半径虚线（黑体球面有效温度关系）：L/L☉ = (R/R☉)² (T/5772 K)⁴','hr-formula');
    const bandY=top-(compact?35:45),bandH=compact?8:11;
    s+=`<rect x="${left}" y="${bandY}" width="${plotW}" height="${bandH}" rx="${bandH/2}" fill="url(#${id}-temperature)" class="hr-temp-band" data-hr-temp-band/>`;
    if(!tight)for(const [letter,lt] of [['O',4.55],['B',4.25],['A',3.96],['F',3.84],['G',3.75],['K',3.65],['M',3.44]])s+=H.text(xl(lt),bandY+bandH-2.7,letter,'hr-spectral','middle');
    s+=H.text(left,top-6,'光度 L / L☉（对数）','hr-axis-title');
    s+=H.rect(left,top,plotW,plotH,'hr-plot',3);
    const xTicks=compact?[30000,10000,5000,2500]:[30000,20000,10000,7000,5000,3500,2500];
    const yTicks=[-6,-4,-2,0,2,4,6];
    for(const T of xTicks){const px=xl(Math.log10(T));s+=H.line(px,top,px,top+plotH,'hr-grid');s+=H.line(px,top+plotH,px,top+plotH+4,'hr-axis-line');s+=`<text x="${px.toFixed(2)}" y="${(top+plotH+18).toFixed(2)}" class="hr-tick" text-anchor="${T===2500?'end':'middle'}" data-hr-temp-tick="${T}">${M.formatInt(T)}</text>`;}
    for(const l of yTicks){const py=y(l);const label=l===0?'1':`10${M.sup(l)}`;s+=H.line(left,py,left+plotW,py,'hr-grid');s+=H.line(left-4,py,left,py,'hr-axis-line');s+=H.text(left-8,py+3.6,label,'hr-tick','end');}
    s+=H.line(left,top,left,top+plotH,'hr-axis-line')+H.line(left,top+plotH,left+plotW,top+plotH,'hr-axis-line');
    s+=H.text(left+plotW,top+plotH+42,compact?'表面温度 T / K（对数，向右降低）':'表面温度 T / K　← 更热　　更冷 →　（对数标度，向右降低）','hr-axis-title','end');
    s+=`<g clip-path="url(#${id}-clip)">`;
    // Iso-radius curves follow L = R²T⁴ exactly; they are not fitted to the scattered points.
    const isoLines=[.01,.1,1,10,100],isoLabels=[];
    for(const R of isoLines){
      const points=[];for(let i=0;i<=240;i++){const lt=D.logTMin+(D.logTMax-D.logTMin)*i/240,ll=2*Math.log10(R)+4*(lt-M.SUN_LOG);if(ll>=D.logLMin&&ll<=D.logLMax)points.push([xl(lt),y(ll)]);}
      if(points.length>1)s+=`<path d="${points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('')}" class="hr-iso" data-hr-isoradius="${R}"/>`;
      isoLabels.push({R,Y:y(2*Math.log10(R)+4*(Math.log10(2800)-M.SUN_LOG))});
    }
    if(sunFocus){
      s+=H.line(x(M.SUN_T),top,x(M.SUN_T),top+plotH,'hr-sun-guide')+H.line(left,y(0),left+plotW,y(0),'hr-sun-guide');
    }
    const labelPos={main:{t:32500,l:5.52,anchor:'start'},giant:{t:4300,l:3.22,anchor:'middle'},dwarf:{t:16000,l:-1.18,anchor:'middle'}};
    for(const type of M.ORDER){
      const def=M.GROUPS[type],points=M.POINTS[type],on=allSelected||selected===type;
      s+=`<g class="hr-type ${on?'is-on':'is-off'}" data-hr-type-group="${type}" data-hr-type-count="${points.length}">`;
      const upper=[],lower=[];
      for(let i=0;i<=64;i++){const lt=def.range[0]+(def.range[1]-def.range[0])*i/64,ll=M.trackLogL(type,lt);upper.push([xl(lt),y(ll+def.band)]);lower.push([xl(lt),y(ll-def.band)]);}
      const ribbon=`M${upper.map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L')}L${lower.reverse().map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L')}Z`;
      s+=`<path d="${ribbon}" class="hr-envelope" data-hr-band="${type}"/>`;
      for(const p of points)s+=`<circle cx="${xl(p.logT).toFixed(2)}" cy="${y(p.logL).toFixed(2)}" r="${dot}" class="hr-point" fill="${M.tempColor(p.logT)}" data-hr-star="${type}" data-temperature="${p.T.toFixed(1)}" data-log-luminosity="${p.logL.toFixed(5)}"/>`;
      const lp=labelPos[type],px=x(lp.t),py=y(lp.l);
      s+=H.text(lp.anchor==='start'?px+6:px,py,def.label,'hr-type-label',lp.anchor);
      if(!compact)s+=H.text(lp.anchor==='start'?px+6:px,py+15,`合成带 ${points.length} 点`,'hr-type-sub',lp.anchor);
      s+='</g>';
    }
    const sunX=x(M.SUN_T),sunY=y(0);
    s+=`<g class="hr-sun${sunFocus?' is-located':''}" data-hr-sun data-t="${M.SUN_T}" data-logl="0"><circle cx="${sunX.toFixed(2)}" cy="${sunY.toFixed(2)}" r="${compact?6.5:8.5}" class="hr-sun-halo"/><circle cx="${sunX.toFixed(2)}" cy="${sunY.toFixed(2)}" r="${compact?2.7:3.4}" class="hr-sun-core"/></g>`;
    s+=H.text(sunX+10,sunY-9,compact?'太阳 · L=1':'太阳','hr-sun-label');
    s+=H.text(sunX+10,sunY+5,compact?'T=5772 K':'T=5772 K · L/L☉=1','hr-sun-sub');
    const comparisons=M.comparisonAt(temperature);
    if(comparison){
      const px=x(temperature);
      s+=H.line(px,top,px,top+plotH,'hr-comparison-line');
      s+=H.text(px-6,top+17,`同温 T=${M.formatInt(temperature)} K`,'hr-comparison-title','end');
      for(const item of comparisons){
        const cy=y(item.logL);
        s+=`<g class="hr-comparison" data-hr-comparison="${item.R}" data-radius="${item.R}" data-temperature="${temperature}" data-luminosity="${item.L.toFixed(8)}"><circle cx="${px.toFixed(2)}" cy="${cy.toFixed(2)}" r="${compact?6:7}" class="hr-comparison-ring"/><circle cx="${px.toFixed(2)}" cy="${cy.toFixed(2)}" r="${compact?2:2.5}" fill="${M.tempColor(Math.log10(temperature))}" class="hr-comparison-core"/></g>`;
        s+=H.text(px-11,cy+3.4,`R=${item.R} R☉`,'hr-comparison-label','end');
      }
    }
    for(const item of isoLabels)s+=H.text(left+plotW-4,item.Y-3,compact?`${item.R} R☉`:`R=${item.R} R☉`,'hr-iso-label','end');
    s+='</g>';
    const counts=M.COUNTS,total=counts.main+counts.giant+counts.dwarf;
    const compareText=comparisons.map(v=>`${v.R} R☉ → ${M.formatLum(v.L)} L☉`).join('；');
    let readout=allSelected?`当前显示全部三类合成教学分布：主序 ${counts.main}、巨星 ${counts.giant}、白矮星 ${counts.dwarf} 个点（点数不是星数统计）。`:`已高亮${groupLabel}：${counts[selected]} 个合成点；其他类型淡化。`;
    if(comparison)readout+=` 同温 T=${M.formatInt(temperature)} K：${compareText}。三个环标与这三项读数来自同一个黑体关系。`;
    if(sunFocus)readout+=' 已定位太阳：T=5772 K，L/L☉=1。';
    readout+=' 所有散点和色带均为合成教学点，不对应真实恒星、星表或观测样本；颜色只表示温度，圆点大小相同、不表示半径。等半径虚线严格按 L/L☉=(R/R☉)²(T/5772 K)⁴ 计算。三条带仅作类型范围示意，不是演化轨迹，类型之间没有先后。';
    const readings=comparisons.map((v,i)=>`<div data-hr-reading="${v.R}"><span>${['小半径','太阳半径','大半径'][i]} · R = ${v.R} R☉</span><strong data-hr-luminosity="${v.L.toFixed(8)}">${M.formatLum(v.L)} L☉</strong><span>同一 T 下由黑体关系得到</span></div>`).join('');
    const controls=`<div class="hr-controls" data-no-math>
      <div class="hr-tabs" role="group" aria-label="突出显示恒星类型">${[['all','全部'],['main','主序'],['giant','巨星'],['dwarf','白矮星']].map(([g,name])=>`<button type="button" data-hr-group="${g}" aria-pressed="${selected===g}">${name}</button>`).join('')}</div>
      <div class="hr-experiment">
        <div class="hr-tool-row">
          <label class="hr-toggle"><input type="checkbox" data-hr-compare ${comparison?'checked':''}> 同温对照</label>
          <button type="button" data-hr-sun-locate aria-pressed="${sunFocus}">定位太阳</button>
          <button type="button" data-hr-reset>恢复默认</button>
        </div>
        <div class="hr-compare-panel"${comparison?'':' hidden'}>
          <label class="hr-temperature">对照温度 <output>${M.formatInt(temperature)} K</output><input aria-label="对照有效温度" type="range" data-hr-temperature min="3500" max="10000" step="1" value="${temperature}"></label>
          <div class="hr-readings">${readings}</div>
          <p>固定温度时，半径每增大 10 倍，光度增大 100 倍。三个环是模型对照，不代表三颗真实恒星。</p>
        </div>
        <p class="hr-hint"${comparison?' hidden':''}>勾选“同温对照”后，固定一个温度并比较三种半径的模型光度。</p>
        <p class="hr-disclaimer">三项读数与图内环标共用同一温度；颜色只表示温度，点大小不表示半径。</p>
      </div>
    </div>`;
    return {height,className:'hr-diagram',svg:s,controls,readout,bind(host,redraw){
      state.hrGroup=selected;state.hrCompare=comparison;state.hrTemperature=temperature;state.hrSunFocus=sunFocus;
      const figureReadout=host.closest('.body-figure')?.querySelector(':scope > .bf-readout');
      const dialogReadout=host.closest('dialog')?.querySelector('.bf-dialog-caption');
      if(figureReadout){figureReadout.setAttribute('aria-live','polite');figureReadout.setAttribute('aria-atomic','true');figureReadout.setAttribute('data-no-math','');figureReadout.classList.add('hr-figure-readout');}
      if(dialogReadout)dialogReadout.setAttribute('data-no-math','');
      const patch=()=>{
        const w=Math.floor(host.clientWidth)||width;
        const next=R['2-stars-3'](w,state);
        const svg=host.querySelector('svg');
        if(svg){svg.innerHTML=next.svg;svg.setAttribute('width',String(w));svg.setAttribute('height',String(next.height));svg.setAttribute('viewBox',`0 0 ${w} ${next.height}`);}
        const template=document.createElement('template');template.innerHTML=next.controls;
        const nextRoot=template.content;
        host.querySelectorAll('[data-hr-group]').forEach(button=>{
          const current=nextRoot.querySelector(`[data-hr-group="${button.dataset.hrGroup}"]`);
          if(current)button.setAttribute('aria-pressed',current.getAttribute('aria-pressed'));
        });
        const compareBox=host.querySelector('[data-hr-compare]'),nextCompare=nextRoot.querySelector('[data-hr-compare]');
        if(compareBox&&nextCompare)compareBox.checked=nextCompare.checked;
        const sunButton=host.querySelector('[data-hr-sun-locate]'),nextSun=nextRoot.querySelector('[data-hr-sun-locate]');
        if(sunButton&&nextSun)sunButton.setAttribute('aria-pressed',nextSun.getAttribute('aria-pressed'));
        const panel=host.querySelector('.hr-compare-panel'),nextPanel=nextRoot.querySelector('.hr-compare-panel');
        if(panel&&nextPanel)panel.hidden=nextPanel.hidden;
        const hint=host.querySelector('.hr-hint'),nextHint=nextRoot.querySelector('.hr-hint');
        if(hint&&nextHint)hint.hidden=nextHint.hidden;
        const range=host.querySelector('[data-hr-temperature]'),nextRange=nextRoot.querySelector('[data-hr-temperature]');
        if(range&&nextRange)range.value=nextRange.value;
        const output=host.querySelector('.hr-temperature output'),nextOutput=nextRoot.querySelector('.hr-temperature output');
        if(output&&nextOutput)output.textContent=nextOutput.textContent;
        const readingsHost=host.querySelector('.hr-readings'),nextReadings=nextRoot.querySelector('.hr-readings');
        if(readingsHost&&nextReadings)readingsHost.innerHTML=nextReadings.innerHTML;
        const readout=host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
        if(readout)readout.textContent=next.readout;
      };
      host.onclick=event=>{
        const sun=event.target.closest('[data-hr-sun-locate]');
        const reset=event.target.closest('[data-hr-reset]');
        const group=event.target.closest('[data-hr-group]');
        if(sun){state.hrSunFocus=!state.hrSunFocus;patch();return;}
        if(reset){state.hrGroup='all';state.hrCompare=false;state.hrTemperature=M.SUN_T;state.hrSunFocus=false;patch();return;}
        if(group){state.hrGroup=group.dataset.hrGroup;patch();}
      };
      host.oninput=event=>{
        if(event.target.matches('[data-hr-compare]')){state.hrCompare=event.target.checked;patch();return;}
        if(event.target.matches('[data-hr-temperature]')){state.hrTemperature=+event.target.value;state.hrCompare=true;patch();}
      };
      if(figureReadout)figureReadout.textContent=readout;
      if(dialogReadout)dialogReadout.textContent=readout;
    }};
  };
  R['3-distance-4'] = function(width,state={}) {
    const ae=Number.isFinite(state.d4Ae)?Math.max(.25,Math.min(1,state.d4Ae)):.5;
    const chi=integrate(z=>1/Math.sqrt(.3*(1+z)**3+.7),0,1);
    const da=chi/2,dl=chi*2;
    const row1=frames(width,['共动坐标：同一对位置，χ 不变','物理间距：a 增大时同一对位置拉长'],306,340);
    const row2=H.panels(width,['角大小定义 θ = ℓ / Dₐ','通量定义 F = L / (4πDₗ²)','同一 z=1，三种距离不同'],300,300,row1.height+24);
    let s=row1.svg;
    row2.items.forEach((p,i)=>s+=H.rect(p.x,p.y,p.w,p.h,'bf-panel',8)+H.text(p.x+12,p.y+22,['角大小定义 θ = ℓ / Dₐ','通量定义 F = L / (4πDₗ²)','同一 z=1，三种距离不同'][i],'bf-title'));
    const A=row1.items[0],B=row1.items[1],C=row2.items[0],D=row2.items[1],E=row2.items[2];
    const arc=(cx,cy,r,a0,a1,cls='bf-series-2')=>{const p0=[cx+r*Math.cos(a0),cy+r*Math.sin(a0)],p1=[cx+r*Math.cos(a1),cy+r*Math.sin(a1)];return `<path d="M${p0[0].toFixed(2)},${p0[1].toFixed(2)}A${r},${r} 0 0 1 ${p1[0].toFixed(2)},${p1[1].toFixed(2)}" fill="none" class="${cls}"/>`;};
    // A — comoving rows: identical tick spacing at both times.
    const left=A.x+46,right=A.x+A.w-26,yE=A.y+116,yR=A.y+212;
    [yE,yR].forEach((yy,row)=>{
      s+=H.line(left,yy,right,yy,'bf-line');
      for(let j=0;j<=6;j++){const xx=left+j*(right-left)/6;s+=H.line(xx,yy-9,xx,yy+9,'bf-line').replace('/>',` data-d4-tick="${row}" data-x="${xx.toFixed(2)}"/>`);}
    });
    for(let j=0;j<=6;j++){const xx=left+j*(right-left)/6;s+=H.line(xx,yE+9,xx,yR-9,'bf-guide-dash');}
    s+=H.line(left,yE-26,left,yR+26,'bf-axis')+H.line(right,yE-26,right,yR+26,'bf-axis');
    s+=H.text(left,yR+34,'观测者 χ=0','bf-small bf-muted')+H.text(right,yR+34,'源 χ=χ₀','bf-small bf-muted','end');
    s+=H.text(left,yE-16,`发射 aₑ=${ae.toFixed(2)}`,'bf-label')+H.text(left,yR-16,'接收 a=1','bf-label');

    s+=H.arrow(right,yE,left,yR,'bf-series');
    s+=H.text((left+right)/2,yE+62,'光从源到观测者','bf-small','middle');
    s+=H.text(left,A.y+262,'两行共用同一套共动刻度：χ 不变','bf-label');
    s+=H.text(left,A.y+286,'改 aₑ 只动右图的物理尺','bf-small bf-muted');
    // B — physical separation: same pair, physical length aχ.
    const bx0=B.x+70,bx1=B.x+B.w-52,XB=v=>bx0+v/(chi*1.25)*(bx1-bx0);
    s+=H.line(bx0,B.y+236,bx1,B.y+236,'bf-axis');
    for(const v of [0,.2,.4,.6,.8])s+=H.line(XB(v),B.y+236,XB(v),B.y+242,'bf-axis')+H.text(XB(v),B.y+258,v.toFixed(1),'bf-small','middle');
    s+=H.text(bx0,B.y+96,`发射：aₑχ₀ = ${(chi*ae).toFixed(3)}`,'bf-small');
    s+=H.rect(bx0,B.y+104,XB(chi*ae)-bx0,16,'bf-bar-a',4).replace('/>',' data-d4-bar="emission" data-v="'+(chi*ae).toFixed(6)+'"/>');
    s+=H.text(bx0,B.y+166,`接收：a₀χ₀ = ${chi.toFixed(3)}`,'bf-small');
    s+=H.rect(bx0,B.y+174,XB(chi)-bx0,16,'bf-bar-b',4).replace('/>',' data-d4-bar="reception" data-v="'+chi.toFixed(6)+'"/>');
    s+=H.line(XB(chi*ae),B.y+104,XB(chi*ae),B.y+174,'bf-guide-dash');
    s+=H.arrow(XB(chi*ae),B.y+196,XB(chi),B.y+196,'bf-series');
    s+=H.text((XB(chi*ae)+XB(chi))/2,B.y+214,`接收时多出 ${(chi*(1-ae)).toFixed(3)}（×${(1/ae).toFixed(2)}）`,'bf-label','middle');
    s+=H.text(bx0,B.y+276,'横轴：物理间距 / (c/H₀)','bf-small bf-muted');
    s+=H.text(bx0,B.y+296,'两行 = 同一对位置的两个时刻','bf-small bf-muted');
    // C — angular size.
    const cox=C.x+26,coy=C.y+214,csx=C.x+C.w-40,ch=34;
    s+=H.line(cox,coy,csx,coy,'bf-guide-dash');
    s+=H.polyline([[cox,coy],[csx,coy-ch]],'bf-series')+H.polyline([[cox,coy],[csx,coy+ch]],'bf-series');
    s+=H.line(csx,coy-ch-6,csx,coy+ch+6,'bf-series-3')+H.text(csx+8,coy,`ℓ`,'bf-label');
    const a0=Math.atan2(-ch,csx-cox),a1=Math.atan2(ch,csx-cox);
    s+=arc(cox,coy,46,a0,a1)+H.text(cox+56,coy+4,'θ','bf-label');
    s+=H.text((cox+csx)/2,coy-12,'Dₐ','bf-label','middle');
    s+=H.text(C.x+18,C.y+242,'θ 是源的张角','bf-small bf-muted')+H.text(C.x+18,C.y+262,'同样大小的源，Dₐ 越大 θ 越小','bf-small bf-muted');
    s+=H.text(C.x+18,C.y+284,`z=1：Dₐ = ${da.toFixed(3)} c/H₀`,'bf-small');
    // D — flux.
    const dr=Math.min(D.w*.30,82),dsx=D.x+dr+16,dcy=D.y+168;
    s+=point(dsx,dcy,'bf-point-3',5)+H.text(dsx-8,dcy-12,'L','bf-label','end');
    s+=`<circle cx="${dsx}" cy="${dcy}" r="${dr}" fill="none" class="bf-guide"/>`;
    for(const t of [-.7,0,.7])s+=H.arrow(dsx+6,dcy,dsx+dr*Math.cos(t),dcy+dr*Math.sin(t),'bf-series-2');
    s+=H.rect(dsx+dr-2,dcy-11,7,22,'bf-area',2)+H.text(dsx+dr+12,dcy-16,'A','bf-label');
    s+=H.text(dsx,dcy+dr+22,'4πDₗ²','bf-label','middle');
    s+=H.text(D.x+18,D.y+242,'同一 L 铺在半径 Dₗ 的球面上','bf-small bf-muted')+H.text(D.x+18,D.y+262,'探测器只接到面积 A','bf-small bf-muted');
    s+=H.text(D.x+18,D.y+284,`z=1：Dₗ = ${dl.toFixed(3)} c/H₀`,'bf-small');
    // E — three distances at one redshift.
    const ex0=E.x+58,ex1=E.x+E.w-26,XE=v=>ex0+v/1.7*(ex1-ex0);
    s+=H.line(ex0,E.y+206,ex1,E.y+206,'bf-axis');
    for(const v of [0,.5,1,1.5])s+=H.line(XE(v),E.y+206,XE(v),E.y+212,'bf-axis')+H.text(XE(v),E.y+228,v.toFixed(1),'bf-small','middle');
    [['Dₐ = ℓ/θ',da,'bf-bar-b'],['χ（共动）',chi,'bf-bar-a'],['Dₗ = L/(4πF)',dl,'bf-bar-c']].forEach(([label,v,cls],i)=>{
      const yy=E.y+78+i*40;
      s+=H.text(ex0,yy-4,`${label} = ${v.toFixed(3)}`,'bf-small');
      s+=H.rect(ex0,yy,XE(v)-ex0,14,cls,3);
    });
    s+=H.text(ex0,E.y+244,'单位 c/H₀；三种距离定义不同','bf-small bf-muted');
    s+=H.text(ex0,E.y+262,'同一 z 下并不相等','bf-small bf-muted');
    s+=H.text(ex0,E.y+280,'不能画成同一时刻的四根尺','bf-small bf-muted')+H.text(ex0,E.y+298,'Dₗ = (1+z)χ = (1+z)² Dₐ','bf-small');
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-box">
        <div class="bf-slider"><span>发射时的尺度因子 aₑ <output data-sync="d4-ae">${ae.toFixed(2)}</output></span><input type="range" data-d4-ae data-sync="d4-ae-range" min="0.25" max="1" step="0.01" value="${ae}" aria-label="发射时的尺度因子"></div>
        <p>拖动 aₑ：左格的共动刻度保持不动，右格的物理尺按 a 变化。aₑ=1 时两行等长（没有膨胀间隔）。</p>
        <div class="bf-tabs" style="margin-top:12px"><button type="button" data-d4-reset>回到 aₑ=0.50</button></div>
      </div>
    </div>`;
    const readout=`例：平直 Ωm,0=0.3、ΩΛ,0=0.7，忽略辐射。发射尺度 aₑ=${ae.toFixed(2)}：两行共动刻度完全不动（χ₀=${chi.toFixed(3)} c/H₀）；同一对共动位置的物理间距从 ${(chi*ae).toFixed(3)} 增大到 ${chi.toFixed(3)} c/H₀（×${(1/ae).toFixed(2)}）。Dₐ、Dₗ 是由角大小与通量定义的观测量，不是同一时刻的四根尺：z=1 时 χ=${chi.toFixed(3)}、Dₐ=${da.toFixed(3)}、Dₗ=${dl.toFixed(3)}（单位 c/H₀）。`;
    return {height:row2.height,svg:s,controls,readout,className:'d4-figure',bind(host){
      state.d4Ae=ae;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const patch=()=>{const w=Math.floor(host.clientWidth)||width,next=R['3-distance-4'](w,state);H.patchSvg(host,next,w);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;};
      host.oninput=event=>{if(event.target.matches('[data-d4-ae]')){state.d4Ae=+event.target.value;patch();}};
      host.onclick=event=>{if(event.target.closest('[data-d4-reset]')){state.d4Ae=.5;patch();}};
    }};
  };
  R['3-distance-5'] = function(width) {
    const p={x:0,y:0,w:width,h:350},a=H.axes(p,{xmin:-2.05,xmax:2.05,ymin:0,ymax:2,xlabel:'共动坐标 χ',ylabel:'共形时间 η',xticks:[-2,-1,0,1,2],yticks:[0,.5,1,1.5,2]});
    let s=a.svg;
    const line=(f,cls)=>H.polyline(curve(t=>[a.x(f(.03+t*1.94)),a.y(.03+t*1.94)]),cls);
    // Past light cone of "today": the region that can have influenced η=1.
    s+=`<polygon points="${[a.x(0),a.y(1)].join(',')} ${[a.x(1),a.y(0)].join(',')} ${[a.x(0),a.y(0)].join(',')} ${[a.x(-1),a.y(0)].join(',')}" fill="var(--gold)" fill-opacity=".07" stroke="none"/>`;
    s+=line(e=>e,'bf-series')+line(e=>-e,'bf-series');
    s+=line(e=>2-e,'bf-series-2')+line(e=>e-2,'bf-series-2');
    s+=line(e=>e*(2-e)/2,'bf-series-3')+line(e=>-e*(2-e)/2,'bf-series-3');
    s+=H.line(a.x(0),a.y(0),a.x(0),a.y(2),'bf-guide')+H.line(a.x(-1.6),a.y(1),a.x(1.6),a.y(1),'bf-guide');
    // The two null rays that reach the observer today, with their direction of travel.
    s+=H.arrow(a.x(1),a.y(0),a.x(0),a.y(1),'bf-series-2')+H.arrow(a.x(-1),a.y(0),a.x(0),a.y(1),'bf-series-2');
    s+=H.text(a.x(.52),a.y(.56),'光锥','bf-callout','start')+H.text(a.x(.52),a.y(.47),'到达今天的两条光路','bf-callout-muted','start');
    s+=point(a.x(0),a.y(1),'bf-point',5)+H.text(a.x(0)+9,a.y(1)-10,'今天','bf-small');
    s+=H.text(a.x(.06),a.y(1.93),'未来','bf-small bf-muted')+H.text(a.x(.06),a.y(.08),'过去','bf-small bf-muted');
    return{height:p.h,svg:s,legend:[['bf-series','粒子视界 χp=η'],['bf-series-2','事件视界 χe=2−η'],['bf-series-3','共动哈勃尺度 χH=η(2−η)/2']],readout:'解析运动学背景 a(η)=η/(2−η)，0<η<2，a₀=1 在 η₀=1；c=1。光在共形坐标中满足 dχ/dη=±1，所以从 η=0 出发的光路是 45° 直线。今天 χp=χe=1，而 χH=0.5；阴影是能够影响“今天”的过去光锥。此例用于区分定义，不是本书实验采用的 ΛCDM 膨胀史，曲线也不是宇宙实体边缘。'};
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
    const stages=[[1,1,1],[1,.9,.18],[1,.15,.08]],f=frames(width,['三个方向都较长（球）','压缩 c：片','再压缩 b：丝'],280,265);let s=f.svg;
    f.items.forEach((p,j)=>{
      const [ax,ay,az]=stages[j],cx=p.x+p.w/2,cy=p.y+124,k=Math.min(70,p.w*.25);
      const project=(x,y,z)=>[cx+k*(x-.45*y),cy+k*(.3*y-.9*z)];
      const DASH=[null,'6 4','2 4'];
      [[0,1],[0,2],[1,2]].forEach((ab,i)=>{
        const pts=curve(t=>{const v=[0,0,0];v[ab[0]]=Math.cos(t*tau)*stages[j][ab[0]];v[ab[1]]=Math.sin(t*tau)*stages[j][ab[1]];return project(...v);});
        s+=H.polyline(pts,['bf-series','bf-series-2','bf-series-3'][i]).replace('class="',`stroke-dasharray="${DASH[i]||'none'}" class="`);
      });
      const axisLabels=['a','b','c'],comp=j===1?[2]:j===2?[1,2]:[];
      for(let i=0;i<3;i++){
        const v=[0,0,0];v[i]=1.16;
        const q1=[cx,cy],q2=project(...v);
        s+=seg(q1,q2,'bf-axis');
        const ex=q1[0]+(q2[0]-q1[0])*1.1,ey=q1[1]+(q2[1]-q1[1])*1.1;
        s+=H.text(ex,ey+3,comp.includes(i)?`${axisLabels[i]} ↓`:`${axisLabels[i]}（未压）`,comp.includes(i)?'bf-callout-accent':'bf-callout-muted','middle');
      }
      s+=H.text(cx,p.y+236,`轴比 a : b : c = ${ax} : ${ay} : ${az}`,'bf-label','middle');
      s+=H.text(cx,p.y+258,'同一投影；比例仅作几何示例','bf-small bf-muted','middle');
    });
    return{height:f.height,svg:s,legend:[['bf-series','ab 主平面轮廓'],['bf-series-2','ac 主平面轮廓（虚线）','dashed'],['bf-series-3','bc 主平面轮廓（点线）','dotted']],readout:'三个主平面中的椭圆由所列轴比精确投影；虚线/点线用于在重叠处区分 ac 与 bc 主平面。阶段 2 压缩 c、阶段 3 再压缩 b，箭头只标出受压方向。轴比是独立选定的几何状态，未积分椭球引力动力学；薄片与细丝只说明不同方向压缩的形态，不能据此声称已经形成稳定星系。'};
  };
  R['5-similarity-9'] = function(width,state={}) {
    const q=[1,2,3],u=[-.1,-1.4,-3],cs=['bf-series','bf-series-2','bf-series-3'];
    const t0=Number.isFinite(state.simT)?Math.max(.5,Math.min(.75,state.simT)):.7;
    const rad=(i,t)=>q[i]*Math.cos(t)+u[i]*Math.sin(t);
    const cross=(i,j)=>Math.atan2(q[j]-q[i],u[i]-u[j]);
    const crossings=[cross(0,1),cross(0,2),cross(1,2)].filter(t=>t>=.5&&t<=.75).sort((a,b)=>a-b);
    const radii=[0,1,2].map(i=>rad(i,t0));
    const order=[0,1,2].sort((i,j)=>radii[j]-radii[i]);
    const f=frames(width,['沿同一壳追踪：半径随时间','同一时刻的空间次序：半径标尺固定'],410,300);let s='';
    const p=f.items[0],a=H.axes(p,{xmin:0,xmax:.79,ymin:0,ymax:3.3,xlabel:'时间 ωt',ylabel:'半径 r / r₀',xticks:[0,.25,.5,.75],yticks:[0,1,2,3]});
    s+=a.svg+title(p,'三条可解析的示踪壳轨迹');
    if(crossings.length)s+=H.rect(a.x(crossings[0]),a.y(3.3),a.x(crossings[crossings.length-1])-a.x(crossings[0]),a.y(0)-a.y(3.3),'bf-soft',0);
    [0,1,2].forEach(i=>s+=H.polyline(curve(t=>[a.x(t*.75),a.y(rad(i,t*.75))],160),cs[i]));
    s+=H.line(a.x(t0),a.y(0),a.x(t0),a.y(3.28),'bf-guide-dash');
    [0,1,2].forEach(i=>s+=`<circle cx="${a.x(t0).toFixed(2)}" cy="${a.y(radii[i]).toFixed(2)}" r="5" class="${cs[i].replace('bf-series','bf-point')}" data-sim-current="${i}" data-r="${radii[i].toFixed(4)}"/>`);
    const tRight=a.x(t0)>a.x(.55);s+=H.text(a.x(t0)+(tRight?-6:6),a.y(3.2),`ωt=${t0.toFixed(3)}`,'bf-small',tRight?'end':'start');
    if(crossings.length)s+=H.text(a.x(crossings[0]),a.y(3.10),'三次交叉','bf-small bf-muted','start');
    s+=H.text(a.x(.02),a.y(.25),'阴影：两两交叉的时间段','bf-small bf-muted');
    const z=f.items[1],k=Math.min((z.w-120)/2.6,(z.h-250)/1.3),cx=z.x+z.w*.42,cy=z.y+205;
    s+=title(z,'固定标尺：1 r₀ 在图上是同一长度');
    s+=`<circle cx="${cx}" cy="${cy}" r="${(k*1.3).toFixed(1)}" fill="none" class="bf-wire" stroke-dasharray="3 5"/>`;

    [0,1,2].forEach(i=>s+=`<circle cx="${cx}" cy="${cy}" r="${(radii[i]*k).toFixed(2)}" fill="none" class="${cs[i]}" stroke-width="2.4" data-sim-ring="${i}"/>`);
    s+=point(cx,cy,'bf-point',2.2);
    const rx=z.x+z.w-30;
    s+=H.line(rx,cy,rx,cy-k*1.3,'bf-axis');
    [0,.5,1,1.3].forEach(v=>{const yy=cy-k*v;s+=H.line(rx-5,yy,rx+5,yy,'bf-axis')+H.text(rx+9,yy+4,v.toFixed(1),'bf-small');});
    s+=H.text(rx+14,cy-k*1.3-10,'窗口 0–1.3 r₀','bf-small','end');
    [0,1,2].forEach(i=>{const yy=cy-k*radii[i];s+=H.line(rx-13,yy,rx,yy,cs[i])+H.line(rx-13,yy-3,rx-13,yy+3,cs[i]);});
    s+=H.text(z.x+18,z.y+330,`从外到内：${order.map(i=>`壳 ${i+1}`).join(' → ')}`,'bf-label');
    s+=H.text(z.x+18,z.y+352,`壳 1 r=${radii[0].toFixed(3)} r₀；壳 2 r=${radii[1].toFixed(3)} r₀`,'bf-small bf-muted')+H.text(z.x+18,z.y+370,`壳 3 r=${radii[2].toFixed(3)} r₀`,'bf-small bf-muted');
    s+=H.text(z.x+18,z.y+390,'半径用同一固定标尺；滑块只改时刻','bf-small bf-muted');
    const crossed=(i,j)=>t0>cross(i,j);
    const crossedText=[['壳 1','壳 2',crossed(0,1)],['壳 1','壳 3',crossed(0,2)],['壳 2','壳 3',crossed(1,2)]].filter(v=>v[2]).map(v=>`${v[0]}与${v[1]}`).join('、')||'尚无';
    const readout=`演示模型：无自引力示踪壳在固定谐振势 Φ=ω²r²/2 内运动，rᵢ/r₀=qᵢcos(ωt)+uᵢsin(ωt)，q=(1,2,3)，u=(−0.1,−1.4,−3)。当前 ωt=${t0.toFixed(3)}：${[0,1,2].map(i=>`壳 ${i+1} r=${radii[i].toFixed(3)} r₀`).join('，')}；从外到内的次序是 ${order.map(i=>`壳 ${i+1}`).join(' → ')}。已经交叉：${crossedText}（解析交叉时刻 ${crossings.map(t=>t.toFixed(3)).join('、')}）。交叉后壳的身份不变、半径仍为正；这只解释“壳交叉”，不是自相似吸积解或 N 体历史。`;
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-box">
        <div class="bf-slider"><span>时间 ωt <output data-sync="sim-t">${t0.toFixed(3)}</output></span><input type="range" data-sim-t data-sync="sim-t-range" min="0.5" max="0.75" step="0.005" value="${t0}" aria-label="示踪壳模型时间"></div>
        <div class="bf-tabs" style="margin-top:12px"><button type="button" data-sim-preset="0.52">交叉前</button><button type="button" data-sim-preset="0.6">交叉中</button><button type="button" data-sim-preset="0.72">交叉后</button><button type="button" data-sim-reset>恢复 ωt=0.70</button></div>
        <p>拖动时间：左图当前点与右图圆环、半径标尺同步；圆环的像素半径始终用同一标尺（0–1.3 r₀），不随参数缩放。</p>
      </div>
    </div>`;
    return {height:f.height,svg:s,controls,readout,legend:[['bf-series','壳 1（q=1）'],['bf-series-2','壳 2（q=2）'],['bf-series-3','壳 3（q=3）']],bind(host){
      state.simT=t0;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const patch=()=>{const w=Math.floor(host.clientWidth)||width,next=R['5-similarity-9'](w,state);H.patchSvg(host,next,w);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;};
      host.oninput=event=>{if(event.target.matches('[data-sim-t]')){state.simT=+event.target.value;patch();}};
      host.onclick=event=>{
        const preset=event.target.closest('[data-sim-preset]');
        if(preset){state.simT=+preset.dataset.simPreset;patch();return;}
        if(event.target.closest('[data-sim-reset]')){state.simT=.7;patch();}
      };
    }};
  };
  R['6-lensing-10'] = function(width) {
    const f=frames(width,['薄透镜：光路拓扑','天空角位置：解析点像'],320,300);let s=f.svg;
    const G=4.30091e-9,c=299792.458,m=10**11.4,te=Math.sqrt(4*G*m/c**2*1000/(1000*1600))*206264.80624709636,beta=.3;
    const pos=(beta+Math.sqrt(beta*beta+4*te*te))/2,neg=(beta-Math.sqrt(beta*beta+4*te*te))/2;
    const p=f.items[0],x0=p.x+28,xl=p.x+p.w*.50,xs=p.x+p.w-28,y=p.y+142,k=39;
    s+=H.line(x0,y,xs,y,'bf-guide')+H.line(xl,p.y+57,xl,p.y+239,'bf-line')+H.line(xs,p.y+57,xs,p.y+239,'bf-line');
    [pos,neg].forEach((t,i)=>s+=H.polyline([[x0,y],[xl,y-t*k],[xs,y-beta*k*1.7]],i?'bf-series-2':'bf-series'));
    s+=point(x0,y,'bf-shape',4)+point(xl,y,'bf-shape',5)+point(xs,y-beta*k*1.7,'bf-point-3',4);
    s+=H.text(x0,p.y+264,'观测者','bf-small')+H.text(xl,p.y+264,'透镜面','bf-small','middle')+H.text(xs,p.y+264,'源面','bf-small','end');
    s+=H.text(p.x+18,p.y+294,'间隔与偏折未按比例绘制；两条光路都从同一源出发','bf-small bf-muted');
    const z=f.items[1],cx=z.x+z.w/2,cy=z.y+150,scale=Math.min((z.w-120)/4.4,(z.h-150)/2.4);
    // Two-dimensional sky: the Einstein ring, the source and the two images on the source--lens axis.
    s+=`<circle cx="${cx}" cy="${cy}" r="${(te*scale).toFixed(2)}" fill="none" class="bf-series-2" stroke-dasharray="5 4" data-lens-ring/>`;
    s+=H.line(cx-te*scale*1.35,cy,cx+te*scale*1.35,cy,'bf-guide-dash');
    s+=H.line(cx,cy-te*scale*1.35,cx,cy+te*scale*1.35,'bf-guide-dash');
    s+=point(cx,cy,'bf-point-3',3);
    [[pos,'θ₊','bf-point'],[neg,'θ₋','bf-point-2'],[beta,'β','bf-point-3']].forEach(([a,n,cl])=>{
      const px=cx+a*scale;s+=point(px,cy,cl,4.6);
      s+=H.text(px,cy+(n==='β'?-10:18),n,'bf-label','middle');
    });
    s+=H.text(cx+te*scale+8,cy+te*scale-6,'θE 参考圆','bf-small bf-muted');
    s+=H.text(z.x+18,z.y+232,`θE = ${te.toFixed(3)}″，β = ${beta.toFixed(3)}″`,'bf-label');
    s+=H.text(z.x+18,z.y+256,`θ₊ = ${pos.toFixed(3)}″，θ₋ = ${neg.toFixed(3)}″`,'bf-label');
    s+=H.text(z.x+18,z.y+282,'虚线圆只描边：角半径 θE，不是有限源的环像','bf-small bf-muted');
    s+=H.text(z.x+18,z.y+304,`角坐标刻度同一比例：1 θE ≈ ${scale.toFixed(1)} px`,'bf-small bf-muted');
    return{height:f.height,svg:s,legend:[['bf-series','θ₊：像与光路'],['bf-series-2','θ₋：像与光路'],['bf-series-3','β：未偏折的源位置']],readout:'沿用本章默认点质量 M=10¹¹·⁴ M☉ 与物理角径距离 dL=1000、dS=1600、dLS=1000 Mpc，源角 β=0.3″。点像由 θ±=[β±√(β²+4θE²)]/2 计算。平面间隔仅表示光路拓扑，dLS 不能用 dS−dL 替换；右图角坐标是精确点源参照，不是有限源表面亮度图。'};
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
    s+=H.arrow(w-25,60,w-25,274,'bf-line')+H.text(w-25,302,'时间向下','bf-small','middle');
    s+=H.text(12,313,'质量单位：终态质量 M₀','bf-small bf-muted');
    s+=H.text(12,335,'未计平滑吸积或质量损失','bf-small bf-muted');
    return{height:h,svg:s,readout:'逐节点守恒：0.25+0.15=0.40，0.20+0.10=0.30，最后 0.40+0.30+0.30=1.00。节点标签是 M/M₀；圆大小仅辅助辨认。此树由教学示例直接指定，不是从 EPS 的单时刻祖先边际分布唯一还原出的真实并合历史。'};
  };
  let fbSerial=0;
  R['8-feedback-14'] = function(width,state={}) {
    const LAYERS=[['shock','外激波'],['hot','受激波热气体'],['contact','接触面'],['reverse','反向激波'],['cold','冷薄壳']];
    const sel=LAYERS.some(([k])=>k===state.fbLayer)?state.fbLayer:'all';
    const presence=[{shock:1,hot:1},{shock:1,hot:1,contact:1,reverse:1,cold:1}];
    const gid=`fb-hot-${++fbSerial}`,gid2=`fb-wind-${fbSerial}`;
    const f=frames(width,['瞬时注能：Sedov–Taylor 绝热极限','持续风：热泡、接触面与冷薄壳'],426,330);
    let s=`<defs><radialGradient id="${gid}"><stop offset="0" stop-color="var(--gold)" stop-opacity=".55"/><stop offset=".7" stop-color="var(--gold)" stop-opacity=".26"/><stop offset="1" stop-color="var(--gold)" stop-opacity=".08"/></radialGradient><radialGradient id="${gid2}"><stop offset="0" stop-color="var(--cyan)" stop-opacity=".34"/><stop offset="1" stop-color="var(--cyan)" stop-opacity=".05"/></radialGradient></defs>`+f.svg;
    f.items.forEach((p,i)=>{
      const cx=p.x+p.w/2,cy=p.y+146,r=Math.min(92,p.w*.25),own=presence[i];
      const on=k=>sel==='all'||sel===k;
      const part=(k,inner)=>`<g data-fb-layer="${k}" class="bf-part${on(k)?'':' is-dim'}">${inner}</g>`;
      const ring=(r0,r1,cls)=>`<path d="M${(cx-r1).toFixed(1)},${cy}a${r1},${r1} 0 1,0 ${2*r1},0a${r1},${r1} 0 1,0 ${-2*r1},0M${(cx-r0).toFixed(1)},${cy}a${r0},${r0} 0 1,0 ${2*r0},0a${r0},${r0} 0 1,0 ${-2*r0},0" fill-rule="evenodd" class="${cls}"/>`;
      if(i===0){
        s+=part('hot',`<circle cx="${cx}" cy="${cy}" r="${(r*.985).toFixed(1)}" fill="url(#${gid})"/>`);
        s+=part('shock',`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" class="bf-series" stroke-width="2.6"/>`);
      }else{
        s+=part('cold',ring(r*.84,r,'bf-bar-b'));
        s+=part('contact',`<circle cx="${cx}" cy="${cy}" r="${(r*.84).toFixed(1)}" fill="none" class="bf-series-2" stroke-dasharray="5 4"/>`);
        s+=part('hot',ring(r*.30,r*.84,'bf-bar-a'));
        s+=part('reverse',`<circle cx="${cx}" cy="${cy}" r="${(r*.30).toFixed(1)}" fill="var(--gold)" fill-opacity=".14"/><circle cx="${cx}" cy="${cy}" r="${(r*.30).toFixed(1)}" fill="none" class="bf-series-3" stroke-dasharray="3 4"/>`);
        s+=part('shock',`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" class="bf-series" stroke-width="2.6"/>`);
        s+=point(cx,cy,'bf-point-3',4.5);
      }
      const lead=(x1,y1,x2,y2)=>H.line(x1,y1,x2,y2,'bf-guide');
      if(i===0){
        s+=H.text(cx,cy-r-9,'外激波 R ∝ t^0.4','bf-callout','middle');
        s+=lead(cx+r*.45,cy+r*.45,cx+r+4,cy+r*.52)+H.text(cx+r+8,cy+r*.56,'热气体','bf-callout');
      }else{
        s+=H.text(cx,cy-r-9,'外激波 R ∝ t^0.6','bf-callout','middle');
        s+=lead(cx+r*.92,cy-r*.30,cx+r+4,cy-r*.40)+H.text(cx+r+8,cy-r*.36,'冷薄壳','bf-callout');
        s+=lead(cx-r*.84,cy+r*.16,cx-r-4,cy+r*.30)+H.text(cx-r-8,cy+r*.34,'接触面','bf-callout','end');
        s+=lead(cx+r*.22,cy+r*.22,cx+r+4,cy+r*.40)+H.text(cx+r+8,cy+r*.44,'反向激波','bf-callout');
        s+=H.text(cx,cy+16,'中心注能','bf-callout-muted','middle');
      }
      const tok=(k,label)=>{const present=!!own[k],hot=sel===k;return `${label} <tspan class="${hot?'bf-sel':present?'bf-has':'bf-none'}">${present?'有':'无'}</tspan>`;};
      s+=`<text x="${cx}" y="${p.y+306}" class="bf-small" text-anchor="middle">${tok('shock','外激波')} · ${tok('hot','热气体')}</text>`;
      s+=`<text x="${cx}" y="${p.y+328}" class="bf-small" text-anchor="middle">${tok('contact','接触面')} · ${tok('reverse','反向激波')} · ${tok('cold','冷壳')}</text>`;
      s+=H.text(cx,p.y+356,i?'内部半径仅为分层示意，未由流体解计算':'外半径由 Sedov 解析极限给出；内部没有新增物理层','bf-small bf-muted','middle');
      s+=H.text(cx,p.y+380,i?'两格边界条件不同，不是同一个泡的前后两帧':'均匀介质、点爆炸、无辐射损失','bf-small bf-muted','middle');
    });
    const text={
      all:'左：Sedov–Taylor 绝热极限（均匀介质、点爆炸、无辐射损失）；右：持续风（热内部近似绝热、外部扫掠层有效冷却）。两格是不同的边界条件，不是同一个泡的前后两帧；右图内部半径只为分层示意。',
      shock:'外激波：两种极限都有，但时间律不同——Sedov 的 R∝t^(2/5)，持续风的 R∝t^(3/5)（各自解析极限，图中只画了一个时刻）。',
      hot:'受激波热气体：Sedov 极限里整个内部都被激波加热（绝热，没有冷壳）；持续风里只有内圈到接触面之间的风是热的。',
      contact:'接触面：只在持续风里出现，位于热泡与扫起的环境介质之间。Sedov 极限没有抛射物，所以本图不画接触面。',
      reverse:'反向激波：只在持续风里出现，位于热泡内侧。图中它的半径只是排版示意，未由流体解计算；不要把 .30r 当成预言值。',
      cold:'冷薄壳：只在持续风里出现，是扫起并冷却的环境介质。Sedov 绝热极限明确不加冷薄壳。'
    };
    const readout=`${text[sel]} 右图的 .84r（接触面）与 .30r（反向激波）只是分层排版，不与左图的内部结构比较。`;
    const controls=`<div class="bf-controls" data-no-math>
      <div class="bf-tabs" role="group" aria-label="选择要对照的层">${[['all','全部'],...LAYERS].map(([k,label])=>`<button type="button" data-fb-layer-sel="${k}" data-sync="fb-${k}" aria-pressed="${sel===k}">${label}</button>`).join('')}</div>
      <div class="bf-row"><button type="button" data-fb-reset>恢复默认</button><p style="margin:0">点选一层：两格同时高亮该层；在不存在的极限里会标为“无”。</p></div>
    </div>`;
    return {height:f.height,svg:s,controls,readout,bind(host){
      state.fbLayer=sel;
      const readoutEl=()=>host.closest('.body-figure')?.querySelector(':scope > .bf-readout')||host.closest('dialog')?.querySelector('.bf-dialog-caption');
      const patch=()=>{const w=Math.floor(host.clientWidth)||width,next=R['8-feedback-14'](w,state);H.patchSvg(host,next,w);H.syncControls(host,next.controls);const el=readoutEl();if(el)el.textContent=next.readout;};
      host.onclick=event=>{
        const tab=event.target.closest('[data-fb-layer-sel]');
        if(tab){state.fbLayer=tab.dataset.fbLayerSel;patch();return;}
        if(event.target.closest('[data-fb-reset]')){state.fbLayer='all';patch();}
      };
    }};
  };
  window.BookEarlyFigureModels={growth,seedField};
}());
