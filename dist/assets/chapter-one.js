(()=>{
 'use strict';
 const $=id=>document.getElementById(id),P=window.GalaxyPhysics;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const state={morph:'disk',inclination:50,yaw:0,stars:true,gas:true,halo:false,cycle:{cooling:1,depletion:2,loading:1,time:3},clock:{mass:11,radius:30,cool:-.5,cold:5,sfr:2}};
 try{const saved=JSON.parse(localStorage.getItem('galaxies-chapter-1-labs')||'null');if(saved){if(['disk','elliptical','irregular'].includes(saved.morph))state.morph=saved.morph;for(const k of ['stars','gas','halo'])if(typeof saved[k]==='boolean')state[k]=saved[k];for(const[k,a,b]of [['inclination',0,80],['yaw',-100,100]])if(Number.isFinite(saved[k]))state[k]=clamp(saved[k],a,b);for(const[k,a,b]of [['cooling',.1,3],['depletion',.1,5],['loading',0,5],['time',0,6]])if(Number.isFinite(saved.cycle?.[k]))state.cycle[k]=clamp(saved.cycle[k],a,b);for(const[k,a,b]of [['mass',9,13],['radius',2,150],['cool',-2,1],['cold',.1,30],['sfr',.1,30]])if(Number.isFinite(saved.clock?.[k]))state.clock[k]=clamp(saved.clock[k],a,b);}}catch{}
 const save=()=>{try{localStorage.setItem('galaxies-chapter-1-labs',JSON.stringify(state));}catch{}};
 function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed+.5)/4294967296;};}
 const morphInfo={disk:{title:'旋转支撑的盘星系',text:'一个扁平的恒星盘、中央较集中的恒星分布，以及可形成恒星的气体。许多盘星系有旋臂，但盘与螺旋图案不是同一个概念。'},elliptical:{title:'以随机运动支撑为主的椭圆星系',text:'恒星分布较为光滑，通常比盘星系更缺乏冷气体。图中仅显示一个几何例子；真实椭圆星系的扁率、运动与形成历史有很大差异。'},irregular:{title:'形态不规则的星系',text:'团块和不对称结构提示形态分类的局限。此处用含气体的矮不规则系统作示意；不能仅凭不规则外观判定它一定发生过并合。'}};
 const canvas=$('galaxy-anatomy'),ctx=canvas.getContext('2d');let w=0,h=0,points=[];
 function prepareGalaxy(){const random=rng(4108);points=[];for(let i=0;i<6500;i++){let x,y,z;const r=-Math.log(random()*random())*2.5,phi=random()*Math.PI*2;if(state.morph==='disk'){x=r*Math.cos(phi);y=r*Math.sin(phi);z=(random()-.5)*.24;}else if(state.morph==='elliptical'){const cos=random()*2-1,sin=Math.sqrt(1-cos*cos);x=r*sin*Math.cos(phi);y=r*sin*Math.sin(phi)*.76;z=r*cos*.7;}else{const q=i%3,centers=[[-3,-2],[3,2],[0,4]],rr=r*.6;x=centers[q][0]+rr*Math.cos(phi);y=centers[q][1]+rr*Math.sin(phi);z=(random()-.5)*2;}points.push({x,y,z,size:.25+random()*.65,a:.2+random()*.55});}}
 function project(p){const s=Math.min(w*.035,h*.055),a=state.yaw,inc=state.inclination*Math.PI/180,x=p.x*Math.cos(a)-p.y*Math.sin(a),y=p.x*Math.sin(a)+p.y*Math.cos(a);return[w/2+x*s,h*.46+(y*Math.cos(inc)-p.z*Math.sin(inc))*s];}
 function glow(x,y,r,color,alpha){const gr=ctx.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${color},${alpha})`);gr.addColorStop(.3,`rgba(${color},${alpha*.3})`);gr.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=gr;ctx.fillRect(x-r,y-r,2*r,2*r);}
 function drawGalaxy(){if(!w)return;ctx.clearRect(0,0,w,h);ctx.fillStyle='#070f18';ctx.fillRect(0,0,w,h);const rand=rng(92);for(let i=0;i<70;i++){ctx.fillStyle=`rgba(167,208,232,${.1+rand()*.2})`;ctx.beginPath();ctx.arc(rand()*w,rand()*h,.4+rand()*.5,0,Math.PI*2);ctx.fill();}const s=Math.min(w*.035,h*.055);
  if(state.halo){glow(w/2,h*.46,Math.min(w*.45,h*.64),'85,151,173',.12);ctx.strokeStyle='#32505d';ctx.lineWidth=.7;for(const factor of [.4,.7,1]){ctx.beginPath();ctx.ellipse(w/2,h*.46,Math.min(w*.39,h*.48)*factor,h*.40,0,0,2*Math.PI);ctx.stroke();}}
  if(state.gas){const alpha=state.morph==='elliptical'?.025:.17;if(state.morph==='irregular'){for(const p of [{x:-3,y:-2,z:0},{x:3,y:2,z:0},{x:0,y:4,z:0}]){const xy=project(p);glow(xy[0],xy[1],5*s,'77,156,181',alpha);}}else{ctx.save();ctx.translate(w/2,h*.46);ctx.scale(1,Math.max(.2,Math.cos(state.inclination*Math.PI/180)));glow(0,0,12*s,'77,156,181',alpha);ctx.restore();}}
  if(state.stars){ctx.save();ctx.translate(w/2,h*.46);ctx.scale(1,state.morph==='disk'?Math.max(.2,Math.cos(state.inclination*Math.PI/180)):.8);glow(0,0,7*s,'241,220,183',state.morph==='irregular'?.1:.26);ctx.restore();for(const p of points){const xy=project(p);ctx.fillStyle=`rgba(238,230,211,${p.a})`;ctx.beginPath();ctx.arc(xy[0],xy[1],p.size,0,Math.PI*2);ctx.fill();}}
 }
 function resizeGalaxy(){const box=canvas.getBoundingClientRect();w=box.width;h=box.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);drawGalaxy();}
 function syncGalaxy(){document.querySelectorAll('[data-morph]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.morph===state.morph)));$('morphology-title').textContent=morphInfo[state.morph].title;$('morphology-description').textContent=morphInfo[state.morph].text;$('anatomy-angle').value=state.inclination;$('angle-value').textContent=state.inclination+'°';for(const k of ['stars','gas','halo'])$('layer-'+k).checked=state[k];prepareGalaxy();drawGalaxy();}
 document.querySelectorAll('[data-morph]').forEach(b=>b.addEventListener('click',()=>{state.morph=b.dataset.morph;syncGalaxy();save();}));for(const k of ['stars','gas','halo'])$('layer-'+k).addEventListener('change',e=>{state[k]=e.target.checked;drawGalaxy();save();});$('anatomy-angle').addEventListener('input',e=>{state.inclination=+e.target.value;$('angle-value').textContent=state.inclination+'°';drawGalaxy();});$('anatomy-angle').addEventListener('change',save);let drag=null;canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,yaw:state.yaw};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(drag){state.yaw=drag.yaw+(e.clientX-drag.x)*.009;drawGalaxy();}});canvas.addEventListener('pointerup',()=>{drag=null;save();});canvas.addEventListener('pointercancel',()=>drag=null);syncGalaxy();new ResizeObserver(resizeGalaxy).observe(canvas.parentElement);

 const processes={
  background:['宇宙学与初始扰动','§1.2.1–1.2.2 · pp.6–7','宇宙学规定膨胀背景和物质组成；初始扰动使密度不再处处相同。完全均匀的物质分布不会自行形成我们讨论的结构。初始条件需由理论和观测共同约束。','后续：第 3、4 章'],
  gravity:['暗晕提供引力势阱','§1.2.3 · pp.7–8','密度偏高的区域吸引更多物质，偏差逐步增长。无碰撞暗物质与可激波加热、可辐射的气体经历不同的演化；暗晕形成不等于其中的恒星已经形成。','后续：第 4、5、7 章'],
  cooling:['气体失去热能，向内聚集','§1.2.4 · p.8','辐射冷却可以降低气体的热压力支撑。是否有效取决于温度、密度与组成。气体沉降时，角动量会影响它能收缩到什么尺度。冷却本身没有把气体直接变成恒星。','后续：第 8、11 章'],
  stars:['冷气体成为恒星','§1.2.5 · pp.8–9','气体中的自引力、冷却、湍流等共同影响恒星形成。形成速率和初始质量函数决定后续的光、质量回流与能量注入；这一步无法只由总气体质量唯一决定。','后续：第 9、10 章'],
  feedback:['新生恒星也会改变燃料','§1.2.6 · pp.9–10','恒星与吸积黑洞释放的能量可以加热、扰动或驱走气体。反馈既依赖此前的形成活动，又会改变之后的活动。图中回路只是联系示意，箭头不是测得的固定速率。','后续：第 8、10、14 章'],
  mergers:['结构会被重新安排','§1.2.7–1.2.8 · pp.10–12','暗晕与星系可以并合；卫星也会经历潮汐剥离和动力摩擦。星系内部的棒等不稳定性能够重分配质量和角动量，因此外观不只由最初形成时的条件决定。','后续：第 7、11–13 章'],
  chemistry:['恒星把历史写进物质和光','§1.2.9–1.2.10 · pp.12–13','恒星核合成与质量抛射改变气体的金属丰度，进而影响冷却。恒星族合成把不同年龄、质量和组成的恒星光谱相加，再考虑尘埃，连接形成历史与观测。','后续：第 10 章'],
  blackhole:['边界是开放的','§1.2.6、1.2.11 · pp.9–10、13–14','中心黑洞可由热气体与冷气体等供给，吸积引发活动。星系际介质向星系提供物质，也接收外流带出的质量、能量和金属。这里不把星系当成完全封闭的盒子。','后续：第 14、16 章']
 };
 function showProcess(key){const [title,ref,body,next]=processes[key];$('process-title').textContent=title;$('process-ref').textContent=ref;$('process-body').textContent=body;$('process-next').textContent=next;document.querySelectorAll('[data-process]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.process===key)));}document.querySelectorAll('[data-process]').forEach(b=>b.addEventListener('click',()=>showProcess(b.dataset.process)));showProcess('cooling');
 const ingredients=[
 ['1.2.1','宇宙学背景','膨胀史、时空几何和物质组成决定星系形成发生的背景。书中的具体宇宙学参数有出版年代，本章不把它们当作当前测量结果。','p.6'],
 ['1.2.2','初始条件','微小密度扰动为结构提供起点；原书介绍暴胀产生扰动的思路，同时强调初始条件不能完全由第一性原理确定。','pp.6–7'],
 ['1.2.3','引力不稳定性','密度扰动在引力作用下增长，进入非线性后形成复杂结构。气体通过激波和压力响应，暗物质则表现为无碰撞体系。','pp.7–8'],
 ['1.2.4','气体冷却','冷却通道依赖温度和组成。气体失去热能后可向内聚集；若角动量适当，可沉降成盘。','p.8'],
 ['1.2.5','恒星形成','恒星形成率与初始质量函数共同决定可见光、质量回流和能量反馈。平静盘中的形成与高强度星暴是需要区分的情形。','pp.8–9'],
 ['1.2.6','反馈过程','超新星和活动星系核可以改变气体的温度、分布与保留量。反馈与冷却、形成率相互依赖，而非独立外加的开关。','pp.9–10'],
 ['1.2.7','并合','暗晕的层级组装可以由并合树描述，但暗晕并合后，其中的星系未必马上合并。轨道衰减与潮汐演化还需要时间。','pp.10–12'],
 ['1.2.8','动力学演化','潮汐作用、冲压剥离和内部不稳定性可以改变结构与气体供应。相似的核球外观可能对应不同形成渠道。','p.12'],
 ['1.2.9','化学演化','天文学把比氦重的元素统称为金属。恒星形成、回流、流入、流出和并合共同影响金属丰度与元素比例。','pp.12–13'],
 ['1.2.10','恒星族合成','把不同恒星的演化与发光叠加，才能从形成历史预测光谱。尘埃吸收与红外再辐射使这一联系更复杂。','p.13'],
 ['1.2.11','星系际介质','星系与环境不断交换质量、能量和金属。远处光源的吸收光谱为研究介质提供探针。','pp.13–14']
 ];
 for(const [n,title,text,ref]of ingredients){const article=document.createElement('article');article.className='ingredient-item';const h=document.createElement('h4');h.textContent=n+'　'+title;const p=document.createElement('p');p.textContent=text;const span=document.createElement('span');span.textContent='原书 '+ref;article.append(h,p,span);$('ingredient-details').append(article);}

 const colors=window.BookTheme.palette({hot:'#b78d9b',cold:'#7abdc4',stars:'#e4c389',outflow:'#8e9daa'});const names={hot:'热气体',cold:'冷气体',stars:'恒星',outflow:'喷出物质'};
 let reference=null,cycleHistory=P.gasHistory(state.cycle),playing=false,last=0;
 const tooltip=document.createElement('div');tooltip.className='chart-tooltip';tooltip.hidden=true;document.body.append(tooltip);
 function frame(svgNode,height,left=56){const width=svgNode.getBoundingClientRect().width;const svg=d3.select(svgNode);svg.attr('viewBox',`0 0 ${width} ${height}`).selectAll('*').remove();return {svg,width,height,m:{left,right:16,top:15,bottom:45},pw:Math.max(40,width-left-16),ph:height-60};}
 function drawCycle(){
  const node=$('cycle-chart'),f=frame(node,node.getBoundingClientRect().height),{svg,width,height,m,pw,ph}=f;
  const x=d3.scaleLinear().domain([0,6]).range([m.left,m.left+pw]),y=d3.scaleLinear().domain([0,1]).range([m.top+ph,m.top]);
  const stacked=d3.stack().keys(['hot','cold','stars','outflow'])(cycleHistory);
  svg.append('g').selectAll('path').data(stacked).join('path').attr('fill',d=>colors[d.key]).attr('opacity',.72).attr('d',d3.area().x(d=>x(d.data.t)).y0(d=>y(d[0])).y1(d=>y(d[1])));
  svg.append('g').attr('transform',`translate(0,${m.top+ph})`).call(d3.axisBottom(x).ticks(width<400?3:6).tickSize(0).tickPadding(10)).call(g=>g.select('.domain').attr('stroke',window.BookTheme.color('#40545c')));
  svg.append('g').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('.0%')).tickSize(0).tickPadding(8)).call(g=>g.select('.domain').remove());
  svg.append('text').attr('class','axis-title').attr('x',m.left+pw/2).attr('y',height-4).attr('text-anchor','middle').text('时间 / Gyr');
  svg.append('text').attr('class','axis-title').attr('transform',`translate(13,${m.top+ph/2}) rotate(-90)`).attr('text-anchor','middle').text('初始质量的比例');
  if(reference)svg.append('path').attr('data-reference','stars').attr('fill','none').attr('stroke',window.BookTheme.color('#f2e6ca')).attr('stroke-dasharray','5 4').attr('stroke-width',1.8).attr('d',d3.line().x(d=>x(d.t)).y(d=>y(d.stars))(P.gasHistory(reference)));
  svg.append('line').attr('data-time-guide','').attr('x1',x(state.cycle.time)).attr('x2',x(state.cycle.time)).attr('y1',m.top).attr('y2',m.top+ph).attr('stroke',window.BookTheme.color('#fff3d5')).attr('stroke-width',1.3);
  const overlay=svg.append('rect').attr('x',m.left).attr('y',m.top).attr('width',pw).attr('height',ph).attr('fill','transparent');
  function show(e){const t=clamp(x.invert(d3.pointer(e,node)[0]),0,6),data=P.gasState(t,state.cycle);tooltip.replaceChildren();const title=document.createElement('div');title.textContent=t.toFixed(2)+' Gyr';tooltip.append(title);for(const key of Object.keys(names)){const row=document.createElement('div');row.textContent=names[key]+' '+(data[key]*100).toFixed(1)+'%';tooltip.append(row);}tooltip.hidden=false;tooltip.style.left=clamp(e.clientX+14,6,innerWidth-220)+'px';tooltip.style.top=Math.max(6,e.clientY-tooltip.offsetHeight-12)+'px';}
  overlay.on('pointermove',show).on('click',show).on('pointerleave',()=>tooltip.hidden=true);
 }
 function cycleValues(){const c=state.cycle,data=P.gasState(c.time,c);$('reservoirs').replaceChildren();for(const key of Object.keys(names)){const el=document.createElement('div');el.className='reservoir '+key;const title=document.createElement('span'),i=document.createElement('i'),value=document.createElement('strong');title.append(i,document.createTextNode(names[key]));value.textContent=(data[key]*100).toFixed(1)+'%';el.append(title,value);$('reservoirs').append(el);}
  for(const k of ['cooling','depletion','loading'])$(k).value=c[k];$('cooling-value').textContent=c.cooling.toFixed(1)+' Gyr';$('depletion-value').textContent=c.depletion.toFixed(1)+' Gyr';$('loading-value').textContent=c.loading.toFixed(1);$('cycle-time').value=c.time;$('cycle-time-value').textContent=c.time.toFixed(2)+' Gyr';$('cycle-takeaway').textContent=`到 ${c.time.toFixed(1)} Gyr，${(data.stars*100).toFixed(1)}% 的初始物质留在恒星及遗骸中，${(data.outflow*100).toFixed(1)}% 已喷出。此时恒星形成率约 ${data.sfr.toFixed(2)} M☉/yr。`;$('cycle-reference').hidden=!reference;$('cycle-compare').textContent=reference?'移除对比':'记录作对比';
 }
 function updateCycle(){cycleHistory=P.gasHistory(state.cycle);cycleValues();drawCycle();}
 for(const k of ['cooling','depletion','loading']){$(k).addEventListener('input',e=>{state.cycle[k]=+e.target.value;updateCycle();});$(k).addEventListener('change',save);}
 $('cycle-time').addEventListener('input',e=>{stop();state.cycle.time=+e.target.value;updateCycle();});$('cycle-time').addEventListener('change',save);
 $('cycle-compare').addEventListener('click',()=>{reference=reference?null:{...state.cycle};updateCycle();});
 function stop(){playing=false;last=0;$('cycle-takeaway').setAttribute('aria-live','polite');$('cycle-play').textContent=state.cycle.time>=6?'重播':'播放';}
 function tick(t){if(!playing)return;if(last)state.cycle.time=Math.min(6,state.cycle.time+Math.min(60,t-last)*.0004);last=t;cycleValues();const width=$('cycle-chart').getBoundingClientRect().width,x=56+(width-72)*state.cycle.time/6;d3.select('#cycle-chart [data-time-guide]').attr('x1',x).attr('x2',x);if(state.cycle.time>=6){stop();save();}else requestAnimationFrame(tick);}
 $('cycle-play').addEventListener('click',()=>{if(playing){stop();save();return;}if(state.cycle.time>=6)state.cycle.time=0;playing=true;$('cycle-takeaway').setAttribute('aria-live','off');$('cycle-play').textContent='暂停';requestAnimationFrame(tick);});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 function cyclePrompt(){const c=state.cycle,d=P.gasState(c.time,c);return `我在学习 MBW (2010) §1.2.4–1.2.6，pp.8–10。教学模型：起始 10^10 M☉ 热气体，冷却时间 ${c.cooling} Gyr，气体消耗时间 ${c.depletion} Gyr，即时回流 R=0.4，外流质量载荷 η=${c.loading}。在 ${c.time.toFixed(2)} Gyr，热、冷、恒星、喷出物质比例分别为 ${[d.hot,d.cold,d.stars,d.outflow].map(v=>(v*100).toFixed(1)+'%').join('、')}。模型无外界吸积、再吸积或 AGN。请解释反馈为什么改变恒星份额，检查质量守恒，并提出一个可以用这些参数验证的问题。请区别教材观点和新增教学简化。`;}
 $('cycle-question').addEventListener('click',()=>{stop();window.showTutor(cyclePrompt());});
 const clockInputs={mass:'mass',radius:'radius',cool:'clock-cool',cold:'cold-mass',sfr:'sfr'};
 function updateClock(){
  const c=state.clock;c.cold=Math.min(c.cold,10**c.mass/1e9);$('cold-mass').max=Math.min(30,10**c.mass/1e9);
  for(const[k,id]of Object.entries(clockInputs))$(id).value=c[k];$('mass-value').textContent=`10^${c.mass.toFixed(1)} M☉`;$('radius-value').textContent=c.radius+' kpc';$('clock-cool-value').textContent=(10**c.cool).toFixed(2)+' Gyr';$('cold-mass-value').textContent=c.cold.toFixed(1)+' × 10⁹ M☉';$('sfr-value').textContent=c.sfr.toFixed(1)+' M☉/yr';
  const times=P.clocks(c),labels={freefall:'自由落体',dynamical:'动力学',cooling:'冷却',starformation:'恒星形成',hubble:'哈勃时间'};
  const rows=Object.entries(times).map(([k,v])=>({key:k,label:labels[k],value:v}));const node=$('clock-chart'),height=node.getBoundingClientRect().height,{svg,width}=frame(node,height,80);
  const lo=Math.min(.01,d3.min(rows,d=>d.value)/2),hi=Math.max(30,d3.max(rows,d=>d.value)*2),x=d3.scaleLog().domain([lo,hi]).range([80,width-28]),y=d3.scalePoint().domain(rows.map(d=>d.key)).range([30,height-70]);
  const groups=svg.append('g').selectAll('g').data(rows).join('g');groups.append('line').attr('x1',80).attr('x2',d=>x(d.value)).attr('y1',d=>y(d.key)).attr('y2',d=>y(d.key)).attr('stroke',window.BookTheme.color('#3d575f')).attr('stroke-width',2);
  groups.append('circle').attr('cx',d=>x(d.value)).attr('cy',d=>y(d.key)).attr('r',5).attr('fill',d=>d.key==='cooling'?window.BookTheme.color('#7abdc4'):d.key==='starformation'?window.BookTheme.color('#e4c389'):window.BookTheme.color('#b5cebb'));
  groups.append('text').attr('x',68).attr('y',d=>y(d.key)+4).attr('text-anchor','end').text(d=>d.label);
  groups.append('text').attr('x',d=>x(d.value)).attr('y',d=>y(d.key)-12).attr('text-anchor',d=>x(d.value)>width-65?'end':'middle').text(d=>d.value<.01?d.value.toExponential(1):d.value.toFixed(2));
  const ticks=[.0001,.001,.01,.1,1,10,100,1000].filter(v=>v>=lo&&v<=hi);svg.append('g').attr('transform',`translate(0,${height-47})`).call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format('~g')).tickSize(0).tickPadding(8)).call(g=>g.select('.domain').attr('stroke',window.BookTheme.color('#40545c')));
  svg.append('text').attr('class','axis-title').attr('x',(80+width-28)/2).attr('y',height-5).attr('text-anchor','middle').text('时间 / Gyr · 对数坐标');
  $('clock-verdict').textContent=(times.cooling<times.dynamical?'冷却比动力学调整快，气体可能在建立静力平衡前失去热压力支撑。':'冷却比动力学调整慢，气体较有机会先保持近似静力平衡。')+(times.starformation>times.dynamical?'气体消耗也较慢；这为先沉降后形成恒星提供条件，但不能仅据此断言最终一定形成盘。':'气体消耗时间较短，形成恒星与动力学变化可能交织进行；这些时间尺度不能单独决定最终形态。');
 }
 for(const[k,id]of Object.entries(clockInputs)){$(id).addEventListener('input',e=>{state.clock[k]=+e.target.value;updateClock();});$(id).addEventListener('change',save);}
 $('clock-question').addEventListener('click',()=>window.showTutor(`请解释 MBW §1.3（pp.14–15）的时间尺度竞争。我的参数是 ${JSON.stringify(state.clock)}，其中 mass 是以 M☉ 为单位的总质量的十进对数，radius 单位 kpc，cool 是冷却时间（Gyr）的十进对数，cold 单位10^9 M☉，sfr 单位 M☉/yr。计算结果（Gyr）为 ${JSON.stringify(P.clocks(state.clock))}。请核对自由落体与动力学时间的关系，说明为何哈勃时间不是一般情形下的宇宙年龄，且不能用这些时钟唯一预测形态。`));

 const history={
 '1920':['“星云”究竟在哪里','Shapley 与 Curtis 的大辩论把一些星云是否位于银河系之外的问题集中呈现出来。争论本身并未完成距离测量；后来的距离证据才改变了判断。','§1.4.1 · pp.15–16'],
 '1925':['距离测量打开河外世界','原书以 Hubble 利用造父变星距离证明部分星云是河外星系为转折点。关键进展是把模糊的外观问题变成可测量的距离问题。','§1.4.1 · p.16'],
 '1929':['星系成为宇宙膨胀的探针','距离与退行速度的关系把星系观测和整体宇宙模型连接起来。星系既是需要解释的对象，也是研究宇宙结构与演化的示踪物。','§1.4.2 · p.16'],
 '1965':['微波背景支持热宇宙历史','微波背景的发现为早期宇宙曾经炽热、稠密的图景提供关键证据，并与轻元素丰度等证据形成相互检验。','§1.4.2 · p.17'],
 '1978':['把冷却放进暗物质势阱','White 与 Rees 的框架把暗晕的层级组装与其中气体的冷却、凝聚联系起来，也明确提出反馈对解释低效率的重要性。','§1.4.5 · p.23'],
 '1980s':['冷暗物质框架逐渐成形','较低的粒子热速度允许更小尺度的扰动保留下来。数值模拟和聚类观测不断检验这个框架，随后还促使人们修正宇宙学参数与成分。','§1.4.4 · pp.20–22'],
 '1998':['加速膨胀带来新的背景约束','Ia 型超新星的距离—红移关系指向加速膨胀。原书把它与后续微波背景证据一起讨论，说明 ΛCDM 如何成为相互协调的模型。','§1.4.2、1.4.4 · pp.16、21–22']
 };
 function showHistory(year){const[title,body,source]=history[year];$('history-year').textContent=year==='1980s'?'1980 年代':year;$('history-title').textContent=title;$('history-body').textContent=body;$('history-source').textContent=source;document.querySelectorAll('[data-year]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.year===year)));}document.querySelectorAll('[data-year]').forEach(b=>b.addEventListener('click',()=>showHistory(b.dataset.year)));showHistory('1920');
 const quizzes=[
  ['“早型星系”一定比“晚型星系”更早形成吗？',['是，这是一条年龄顺序。','不是，这是历史性的形态名称。'],1,'“早型 / 晚型”不能直接当成年龄或必经演化顺序。需要恒星族、动力学与环境等更多证据。依据 §1.1 pp.2–4。'],
  ['提高本页气体循环模型的外流质量载荷，会怎样？',['把同样多的物质更快全部变成恒星。','让更多物质进入喷出组分，减少恒星的最终份额。'],1,'在当前固定冷却、消耗时间且没有再吸积的模型中，恒星与喷出物质分配比由 (1−R):η 决定。该定量关系属于本页教学模型，原书 §1.2.6 pp.9–10 提供反馈联系。'],
  ['恒星大多很古老，是否意味着星系结构也在同一时刻组装完成？',['不一定：恒星形成与质量组装是不同定义。','是：两种形成时间必须一致。'],0,'古老恒星可以在较晚的并合中才聚集到同一系统。谈“形成时间”时，要说清楚追踪的是恒星形成还是结构组装。依据 §1.3 p.15。']
 ];
 quizzes.forEach(([q,answers,correct,why],i)=>{const article=document.createElement('article');article.className='quiz-item';const h=document.createElement('h3');h.textContent=(i+1)+'. '+q;const options=document.createElement('div');options.className='quiz-options';const feedback=document.createElement('p');feedback.className='quiz-feedback';feedback.setAttribute('aria-live','polite');answers.forEach((text,j)=>{const b=document.createElement('button');b.textContent=text;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{options.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));feedback.textContent=(j===correct?'正确。':'再想一想。')+why;});options.append(b);});article.append(h,options,feedback);$('quiz').append(article);});
 $('tutor-open').addEventListener('click',()=>window.showTutor(cyclePrompt()));
 updateCycle();updateClock();stop();
 new ResizeObserver(()=>{drawCycle();updateClock();}).observe($('cycle-chart').parentElement);
 addEventListener('resize',()=>{tooltip.hidden=true;updateClock();});
})();
