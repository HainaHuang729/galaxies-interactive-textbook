/* Shared scientific plot frame. Model functions and scale domains are supplied
   explicitly by each experiment; presentation never changes the numerical data. */
(() => {
 'use strict';
 const frames=new WeakMap(),units=new WeakMap(),references=new WeakMap();let serial=0,dialog;
 const font='12px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';
 const measure=document.createElement('canvas').getContext('2d');measure.font=font;
 function lines(text,width){const result=[];let line='';for(const ch of String(text||'')){if(line&&measure.measureText(line+ch).width>width){result.push(line);line=ch;}else line+=ch;}if(line)result.push(line);return result;}
 function label(svg,text,x,y,width,anchor='start'){
  if(window.BookMath){const size=BookMath.measure(text,width,12);BookMath.svgText(svg.node(),text,x,y,width,anchor,12);return size.lines;}
  const parts=lines(text,width),node=svg.append('text').attr('class','scientific-axis-label').attr('x',x).attr('y',y).attr('text-anchor',anchor);
  parts.forEach((part,i)=>node.append('tspan').attr('x',x).attr('dy',i?'1.25em':0).text(part));return parts.length;
 }
 function ticks(scale,count,explicit){
  const domain=scale.domain(),lo=Math.min(...domain),hi=Math.max(...domain),log=typeof scale.base==='function';
  if(explicit)return explicit.filter(v=>Number.isFinite(v)&&v>=lo&&v<=hi&&(!log||v>0));
  if(!log)return scale.ticks(count);
  const powers=[];for(let p=Math.ceil(Math.log10(lo));p<=Math.floor(Math.log10(hi));p++)powers.push(10**p);
  if(!powers.length)return scale.ticks(count).filter(v=>v>=lo&&v<=hi);
  const stride=Math.max(1,Math.ceil(powers.length/6));return powers.filter((_,i)=>i%stride===0||i===powers.length-1);
 }
 const number=v=>Math.abs(v)>=1e5||(v!==0&&Math.abs(v)<.001)?v.toExponential(1).replace('e+','e'):window.d3.format('~g')(v);
 function frame(id,options){
  const d3=window.d3,node=typeof id==='string'?document.getElementById(id):id,w=Math.max(140,node.clientWidth),h=Math.max(160,node.clientHeight),svg=d3.select(node);svg.selectAll('*').remove();svg.attr('viewBox',`0 0 ${w} ${h}`).classed('scientific-plot',true);
  const {x,y}=options,reference=references.get(node);
  if(reference&&(reference.xLabel!==options.xLabel||reference.yLabel!==options.yLabel))references.delete(node);
  if(reference&&reference.xLabel===options.xLabel&&reference.yLabel===options.yLabel){
   for(const [scale,key]of [[x,'x'],[y,'y']]){const values=reference.series.flatMap(c=>c.data.map(p=>p[key])).filter(v=>Number.isFinite(v)&&(!scale.base||v>0)),domain=scale.domain(),ascending=domain[0]<domain[1];if(values.length){const lo=Math.min(...domain,...values),hi=Math.max(...domain,...values);scale.domain(ascending?[lo,hi]:[hi,lo]);}}
  }
  const xt=ticks(x,w<380?3:5,options.xTicks),yt=ticks(y,4,options.yTicks),xf=options.xFormat||number,yf=options.yFormat||number;
  measure.font='11px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';
  const tickWidth=Math.max(0,...yt.map(v=>window.BookMath?BookMath.measure(String(yf(v)),Infinity,11).width:measure.measureText(String(yf(v))).width));measure.font=font;
  const left=Math.min(w*.34,Math.max(w<380?50:60,tickWidth+14)),right=22,labelWidth=w-left-right,yl=lines(options.yLabel,labelWidth),xl=lines(options.xLabel,w-28);
  const top=window.BookMath?24+BookMath.measure(options.yLabel,labelWidth,12).height:21+15*Math.max(1,yl.length),bottom=window.BookMath?34+BookMath.measure(options.xLabel,w-28,12).height:36+15*Math.max(1,xl.length),m={left,right,top,bottom,l:left,r:right,t:top,b:bottom};
  x.range([left,w-right]);y.range([h-bottom,top]);const box={x:left,y:top,w:w-left-right,h:h-top-bottom};
  svg.append('rect').attr('class','scientific-plot-area').attr('x',box.x).attr('y',box.y).attr('width',box.w).attr('height',box.h);
  svg.append('g').attr('class','grid scientific-grid').attr('transform',`translate(${left},0)`).call(d3.axisLeft(y).tickValues(yt).tickFormat('').tickSize(-box.w)).select('.domain').remove();
  const xg=svg.append('g').attr('class','scientific-x-axis').attr('transform',`translate(0,${h-bottom})`).call(d3.axisBottom(x).tickValues(xt).tickFormat(xf).tickSize(4).tickPadding(7).tickSizeOuter(0));
  xg.selectAll('.tick text').attr('text-anchor',v=>x(v)>w-40?'end':x(v)<35?'start':'middle');
  svg.append('g').attr('class','scientific-y-axis').attr('transform',`translate(${left},0)`).call(d3.axisLeft(y).tickValues(yt).tickFormat(yf).tickSize(4).tickPadding(7).tickSizeOuter(0));
  label(svg,options.yLabel,left,15,labelWidth);label(svg,options.xLabel,w/2,window.BookMath?h-4-BookMath.measure(options.xLabel,w-28,12).height+11:h-8-(Math.max(1,xl.length)-1)*15,w-28,'middle');
  const clip=`scientific-clip-${++serial}`;svg.append('defs').append('clipPath').attr('id',clip).append('rect').attr('x',box.x).attr('y',box.y).attr('width',box.w).attr('height',box.h);
  const layer=svg.append('g').attr('class','scientific-data-layer').attr('clip-path',`url(#${clip})`);
  frames.set(node,{x,y,box,xLabel:options.xLabel,yLabel:options.yLabel,clip,series:[]});
  queueMicrotask(()=>enhance(node));return {svg,layer,node,x,y,w,h,m,box};
 }
 function referenceLayer(node){
  node.querySelector('.scientific-reference-layer')?.remove();const info=frames.get(node),ref=references.get(node);if(!info||!ref)return;
  if(ref.xLabel!==info.xLabel||ref.yLabel!==info.yLabel)return;
  const layer=d3.select(node).append('g').attr('class','scientific-reference-layer').attr('clip-path',`url(#${info.clip})`);
  ref.series.forEach(c=>layer.append('path').attr('d',d3.line().defined(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&(!info.y.base||p.y>0)).x(p=>info.x(p.x)).y(p=>info.y(p.y))(c.data)).attr('fill','none').attr('stroke','var(--muted)').attr('stroke-width',1.4).attr('stroke-dasharray','2 5').attr('opacity',.7));
 }
 function setSeries(node,series){if(typeof node==='string')node=document.getElementById(node);const info=frames.get(node);if(!info)return;info.series=series.map((s,i)=>({label:s.label||`曲线 ${i+1}`,data:s.data.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:p.x,y:p.y}))}));queueMicrotask(()=>enhance(node));}
 function addSeries(node,data,label){if(typeof node==='string')node=document.getElementById(node);const info=frames.get(node);if(!info)return;info.series.push({label:label||`曲线 ${info.series.length+1}`,data:data.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))});return info.series.length-1;}
 // Insert the analytical current state into the actual line, not just a parallel readout array.
 function includeSample(node,index,x,y){
  if(typeof node==='string')node=document.getElementById(node);const info=frames.get(node),curve=info?.series[index];
  if(!curve||!Number.isFinite(x)||!Number.isFinite(y))return;
  const at=curve.data.findIndex(p=>p.x===x);if(at>=0)curve.data[at]={x,y};else curve.data.push({x,y});curve.data.sort((a,b)=>a.x-b.x);
  const path=node.querySelector(`path[data-plot-series="${index}"]`);if(path)d3.select(path).datum(curve.data).attr('d',d3.line().defined(p=>Number.isFinite(p.y)&&(!info.y.base||p.y>0)).x(p=>info.x(p.x)).y(p=>info.y(p.y)));
 }
 function snapshot(node){
  const clone=node.cloneNode(true),prefix=`plot-export-${++serial}-`,from=[node,...node.querySelectorAll('*')],to=[clone,...clone.querySelectorAll('*')],ids=new Map();
  const properties=['color','fill','fill-opacity','stroke','stroke-opacity','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','font-style','text-anchor','dominant-baseline','opacity','display','visibility','paint-order'];
  from.forEach((el,i)=>{const style=getComputedStyle(el);properties.forEach(key=>{const value=style.getPropertyValue(key);if(value)to[i].style.setProperty(key,value);});if(el.id){ids.set(el.id,prefix+el.id);to[i].id=prefix+el.id;}});
  clone.querySelectorAll('.scientific-probe').forEach(el=>el.remove());
  for(const el of [clone,...clone.querySelectorAll('*')])for(const attr of [...el.attributes]){let value=attr.value;for(const [old,next]of ids)value=value.replaceAll(`url(#${old})`,`url(#${next})`).replaceAll(`url("#${old}")`,`url(#${next})`);el.setAttribute(attr.name,value);}
  clone.removeAttribute('tabindex');clone.removeAttribute('aria-describedby');clone.removeAttribute('style');clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('role','img');clone.style.background=getComputedStyle(document.documentElement).getPropertyValue('--panel');
  const vb=node.viewBox.baseVal;clone.setAttribute('width',vb.width);clone.setAttribute('height',vb.height);return clone;
 }
 function open(node){
  if(!dialog){dialog=document.createElement('dialog');dialog.className='scientific-chart-dialog';dialog.id='scientific-chart-dialog';dialog.setAttribute('aria-labelledby','scientific-dialog-title');dialog.innerHTML='<button class="scientific-dialog-close" type="button">关闭 ×</button><h2 id="scientific-dialog-title"></h2><div class="scientific-dialog-stage"></div><p class="scientific-dialog-note">当前参数下的实际图表。坐标定义、单位与模型范围沿用实验页面。</p>';dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();});document.body.append(dialog);}
  dialog.querySelector('h2').textContent=node.getAttribute('aria-label')||node.closest('.lab')?.querySelector('h3')?.textContent||'实验数据图';dialog.querySelector('.scientific-dialog-stage').replaceChildren(snapshot(node));dialog.showModal();
 }
 async function download(node){
  const clone=snapshot(node),lab=node.closest('.lab'),description=document.createElementNS('http://www.w3.org/2000/svg','desc');description.textContent=[node.getAttribute('aria-label')||node.id,references.get(node)?'固定参照参数：'+references.get(node).parameters:'',...[...(lab?.querySelectorAll('input,select')||[])].map(el=>`${el.id}=${el.value}`)].join('；');clone.prepend(description);
  if(window.BookMath)await BookMath.decorateExport(clone);
  const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${node.id||'scientific-plot'}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function enhance(node){
  if(!node?.isConnected||!node.matches('svg.chart'))return;node.classList.add('scientific-plot');
  let unit=units.get(node);
  if(!unit){unit=document.createElement('div');unit.className='scientific-chart-unit';node.before(unit);unit.append(node);const tools=document.createElement('div');tools.className='scientific-chart-tools';const zoom=document.createElement('button'),save=document.createElement('button');zoom.type=save.type='button';zoom.className=save.className='scientific-chart-action';zoom.textContent='放大图表';zoom.setAttribute('aria-haspopup','dialog');zoom.addEventListener('click',()=>open(node));save.textContent='导出 SVG';save.addEventListener('click',()=>download(node));tools.append(zoom,save);unit.append(tools);units.set(node,unit);}
  const info=frames.get(node);if(!info)return;
  referenceLayer(node);
  if(info.series.length&&!unit.querySelector('.scientific-reference-action')){
   const pin=document.createElement('button');pin.type='button';pin.className='scientific-chart-action scientific-reference-action';pin.textContent='固定当前曲线';pin.setAttribute('aria-pressed','false');
   pin.onclick=()=>{if(references.has(node)){references.delete(node);}else{const current=frames.get(node),controls=[...(node.closest('.lab,.extension-lab')?.querySelectorAll('input[type=range],select')||[])],parameters=controls.map(el=>{const label=document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.cloneNode(true);label?.querySelectorAll('input,output,select').forEach(n=>n.remove());label?.querySelectorAll('.inline-math').forEach(n=>n.replaceWith(document.createTextNode(n.dataset.inlineRaw||'')));return (label?.textContent.trim()||el.id)+'='+el.value;}).join('；');references.set(node,{xLabel:current.xLabel,yLabel:current.yLabel,parameters,series:structuredClone(current.series)});}enhance(node);};unit.querySelector('.scientific-chart-tools').append(pin);
  }
  const pin=unit.querySelector('.scientific-reference-action'),ref=references.get(node);if(pin){pin.textContent=ref?'清除参照曲线':'固定当前曲线';pin.setAttribute('aria-pressed',String(!!ref));}
  let refNote=unit.querySelector('.scientific-reference-note');if(ref){if(!refNote){refNote=document.createElement('p');refNote.className='scientific-reference-note';unit.querySelector('.scientific-chart-tools').after(refNote);}const note='灰色点线为已固定的参照曲线。'+(ref.parameters?'固定时：'+ref.parameters:'');if(refNote.dataset.note!==note){refNote.textContent=note;refNote.dataset.note=note;}}else refNote?.remove();
  node.querySelectorAll('path:not(.domain),circle,line').forEach(el=>{if(!el.closest('defs,.grid,.tick,.scientific-x-axis,.scientific-y-axis,.scientific-probe')&&!el.getAttribute('clip-path'))el.setAttribute('clip-path',`url(#${info.clip})`);});
  if(node.__scientificProbeBound){node.__scientificProbeRefresh?.();return;}node.__scientificProbeBound=true;node.setAttribute('tabindex','0');node.setAttribute('role','group');node.setAttribute('aria-label',(node.getAttribute('aria-label')||'模型曲线')+'；聚焦后用方向键读取坐标');
  const out=document.createElement('output');out.className='scientific-coordinate';out.id=`scientific-coordinate-${++serial}`;out.textContent=info.series.length?'曲线取样：移动指针；左右移位，上下选曲线。':'坐标探针：移动指针，或聚焦图表后用方向键。';unit.append(out);node.setAttribute('aria-describedby',out.id);let px=.5,py=.5,active=false,chosen=0;
  const show=()=>{const current=frames.get(node);if(!current)return;active=true;const {box,x,y}=current;let cx=box.x+px*box.w,cy=box.y+py*box.h,description=`坐标 横轴=${number(x.invert(cx))}，纵轴=${number(y.invert(cy))}（单位见坐标轴）`;
   if(current.series.length){chosen%=current.series.length;const s=current.series[chosen],valid=s.data.filter(p=>!y.base||p.y>0),at=x.invert(cx),sample=valid.reduce((near,p)=>!near||Math.abs(x(p.x)-x(at))<Math.abs(x(near.x)-x(at))?p:near,null);if(sample){cx=x(sample.x);cy=y(sample.y);description=`${s.label} · 曲线取样 横轴=${number(sample.x)}，纵轴=${number(sample.y)}（已绘制节点，单位见轴；上下选曲线）`;out.dataset.probeX=sample.x;out.dataset.probeY=sample.y;out.dataset.probeSeries=chosen;}}
   let group=node.querySelector('.scientific-probe');if(!group){group=document.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class','scientific-probe');group.innerHTML='<path/><circle r="3"/>';node.append(group);}group.querySelector('path').setAttribute('d',`M${box.x},${cy}H${box.x+box.w}M${cx},${box.y}V${box.y+box.h}`);group.querySelector('circle').setAttribute('cx',cx);group.querySelector('circle').setAttribute('cy',cy);out.textContent=description;};
  node.__scientificProbeRefresh=()=>{if(active)show();};
  node.addEventListener('pointermove',event=>{const current=frames.get(node),b=node.getBoundingClientRect(),vb=node.viewBox.baseVal,x=(event.clientX-b.left)/b.width*vb.width,y=(event.clientY-b.top)/b.height*vb.height;if(x<current.box.x||x>current.box.x+current.box.w||y<current.box.y||y>current.box.y+current.box.h)return;px=(x-current.box.x)/current.box.w;py=(y-current.box.y)/current.box.h;show();});
  node.addEventListener('focus',show);node.addEventListener('keydown',event=>{const d={ArrowLeft:[-.01,0],ArrowRight:[.01,0],ArrowUp:[0,-.01],ArrowDown:[0,.01]}[event.key];if(!d)return;event.preventDefault();event.stopPropagation();if(frames.get(node)?.series.length&&d[1])chosen=(chosen+(d[1]>0?1:-1)+frames.get(node).series.length)%frames.get(node).series.length;else{px=Math.max(0,Math.min(1,px+d[0]));py=Math.max(0,Math.min(1,py+d[1]));}show();});
 }
 window.BookCharts={frame,enhance,snapshot,setSeries,addSeries,includeSample,inspect:node=>frames.get(typeof node==='string'?document.getElementById(node):node)};
 document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('svg.chart').forEach(enhance);window.dispatchEvent(new Event('resize'));},{once:true});
})();
