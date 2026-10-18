(() => {
  'use strict';
  const records=window.BookBodyFigures||[], byId=new Map(records.map(r=>[r.id,r]));
  const figures=[...document.querySelectorAll('.body-figure')];
  const states=new Map();
  function paintFields(host,fields){
    if(!fields?.length)return;
    const style=getComputedStyle(document.documentElement),rgb=key=>{const hex=style.getPropertyValue(key).trim().replace('#','');return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));},zero=rgb('--bf-zero'),positive=rgb('--bf-positive'),negative=rgb('--bf-negative');
    fields.forEach((field,index)=>{
      const target=host.querySelector(`[data-bf-raster="${index}"]`);if(!target)return;
      const canvas=document.createElement('canvas');canvas.width=field.nx;canvas.height=field.ny;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(field.nx,field.ny);
      field.values.forEach((value,i)=>{const t=Math.max(0,Math.min(1,(value-field.min)/(field.max-field.min))),side=field.mode==='diverging'&&t<.5?negative:positive,k=field.mode==='diverging'?Math.abs(2*t-1):t;pixels.data.set([...zero.map((v,j)=>Math.round(v+(side[j]-v)*k)),255],4*i);});ctx.putImageData(pixels,0,0);target.setAttribute('href',canvas.toDataURL('image/png'));
      if(!field.probe)return;
      target.setAttribute('tabindex','0');target.setAttribute('role','img');target.setAttribute('aria-label',`${field.label}；方向键移动探针读取数值`);
      let ix=Math.floor(field.nx/2),iy=Math.floor(field.ny/2);
      const probe=()=>{
        let readout=host.querySelector('.bf-probe-output');if(!readout){readout=document.createElement('p');readout.className='bf-probe-output';readout.setAttribute('aria-live','polite');host.append(readout);}
        const lines=[];
        fields.forEach((other,k)=>{if(!other.probe||(!field.linked&&k!==index))return;const im=host.querySelector(`[data-bf-raster="${k}"]`),x=+im.getAttribute('x'),y=+im.getAttribute('y'),w=+im.getAttribute('width'),h=+im.getAttribute('height'),xx=Math.floor((ix+.5)/field.nx*other.nx),yy=Math.floor((iy+.5)/field.ny*other.ny),cx=x+(xx+.5)/other.nx*w,cy=y+(yy+.5)/other.ny*h;host.querySelector(`.bf-probe-${k}`)?.remove();const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class',`bf-probe-${k}`);g.setAttribute('aria-hidden','true');g.innerHTML=`<path d="M${x},${cy}H${x+w}M${cx},${y}V${y+h}" class="bf-crosshair"/><circle cx="${cx}" cy="${cy}" r="3" class="bf-probe-dot"/>`;im.parentNode.append(g);lines.push(`${other.label}：${other.unit}=${other.values[yy*other.nx+xx].toFixed(4)}`);});
        readout.textContent=`探针 x/L=${((ix+.5)/field.nx).toFixed(3)}，y/L=${(1-(iy+.5)/field.ny).toFixed(3)} ｜ ${lines.join('；')}`;
      };
      target.addEventListener('pointermove',event=>{const b=target.getBoundingClientRect();ix=Math.max(0,Math.min(field.nx-1,Math.floor((event.clientX-b.left)/b.width*field.nx)));iy=Math.max(0,Math.min(field.ny-1,Math.floor((event.clientY-b.top)/b.height*field.ny)));probe();});
      target.addEventListener('focus',probe);target.addEventListener('keydown',event=>{const move={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!move)return;event.preventDefault();event.stopPropagation();ix=Math.max(0,Math.min(field.nx-1,ix+move[0]));iy=Math.max(0,Math.min(field.ny-1,iy+move[1]));probe();});
    });
  }
  function renderSVG(host,record,width,state={}) {
    const renderer=window.BookFigureRenderers[record.renderer];
    if(!renderer)throw Error('Missing figure renderer '+record.renderer);
    const result=renderer(width,state);
    if(!Number.isFinite(result.height)||/NaN|Infinity/.test(result.svg))throw Error('Invalid geometry '+record.id);
    host.innerHTML=`<svg class="bf-svg" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${result.height}" viewBox="0 0 ${width} ${result.height}" role="${result.fields?.some(f=>f.probe)?'group':'img'}" aria-label="${window.BookFigureGeometry.esc(record.title)}"><title>${window.BookFigureGeometry.esc(record.title)}</title>${result.svg}</svg>`;
    paintFields(host,result.fields);
    if(Array.isArray(result.legend)&&result.legend.length){
      const legend=document.createElement('div');legend.className='bf-legend';legend.setAttribute('aria-label','曲线图例');
      for(const [cls,label] of result.legend){const item=document.createElement('span'),key=document.createElement('i');key.className=cls;key.setAttribute('aria-hidden','true');item.append(key,document.createTextNode(label));legend.append(item);}host.append(legend);
    }
    else if(typeof result.legend==='string'){const diagnostic=document.createElement('p');diagnostic.className='bf-readout';diagnostic.textContent=result.legend;host.append(diagnostic);}
    return result;
  }
  let dialog;
  function openLarge(figure,record,selected) {
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='body-figure-dialog';dialog.className='body-figure-dialog';dialog.setAttribute('aria-labelledby','bf-dialog-title');
      dialog.innerHTML='<button type="button" class="bf-dialog-close">关闭 ×</button><h2 id="bf-dialog-title"></h2><div class="bf-dialog-stage"></div><p class="bf-dialog-caption"></p>';
      dialog.querySelector('button').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();});
      document.body.append(dialog);
    }
    dialog.querySelector('h2').textContent=record.title;
    const stage=dialog.querySelector('.bf-dialog-stage');stage.replaceChildren();
    dialog.showModal();
    if(record.production==='code')renderSVG(stage,record,Math.max(220,Math.min(1120,stage.clientWidth)),states.get(record.id));
    else {
      const panel=selected||figure.querySelector('.bf-image-panel:not([hidden])');
      const img=panel.querySelector('img').cloneNode();img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=panel.dataset.fullSrc||img.src;img.loading='eager';
      const credit=document.createElement('div');credit.className='bf-dialog-credit';credit.setAttribute('data-no-math','');credit.append(...[...panel.querySelector('figcaption').childNodes].map(node=>node.cloneNode(true)));
      const viewport=document.createElement('div');viewport.className='bf-image-viewport';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','观测图；放大后可滚动查看细节');viewport.append(img);
      viewport.addEventListener('keydown',event=>{
        if(!viewport.classList.contains('is-zoomed'))return;
        const direction={ArrowLeft:[-40,0],ArrowRight:[40,0],ArrowUp:[0,-40],ArrowDown:[0,40]}[event.key];if(!direction)return;
        event.preventDefault();event.stopPropagation();viewport.scrollBy({left:direction[0],top:direction[1],behavior:'instant'});
      });
      const zoom=document.createElement('div');zoom.className='bf-image-zoom';zoom.setAttribute('data-no-math','');zoom.setAttribute('aria-label','图像显示比例');
      for(const [factor,label] of [[1,'适应窗口'],[2,'放大 2×'],[4,'放大 4×']]){
        const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-pressed',String(factor===1));
        button.addEventListener('click',()=>{
          for(const b of zoom.children)b.setAttribute('aria-pressed',String(b===button));
          viewport.classList.toggle('is-zoomed',factor>1);img.style.width=factor===1?'':(viewport.clientWidth*factor)+'px';
          requestAnimationFrame(()=>viewport.scrollTo({left:factor===1?0:Math.max(0,img.clientWidth*.5-viewport.clientWidth*.5),top:factor===1?0:Math.max(0,img.clientHeight*.5-viewport.clientHeight*.5),behavior:'instant'}));
        });zoom.append(button);
      }
      stage.append(zoom,viewport,credit);
    }
    dialog.querySelector('.bf-dialog-caption').textContent=record.production==='code'?(figure.querySelector(':scope > .bf-readout').textContent||record.caption):record.caption;
  }
  for(const figure of figures){
    const record=byId.get(figure.id);if(!record)continue;
    if(record.production==='code'){
      const host=figure.querySelector('.bf-stage'),state={matter:.3};states.set(record.id,state);let previous=0;
      const draw=(force=false)=>{const width=Math.floor(host.clientWidth);if(width<100||(!force&&width===previous))return;previous=width;const result=renderSVG(host,record,width,state);figure.querySelector(':scope > .bf-readout').textContent=result.readout||'';};
      new ResizeObserver(()=>draw()).observe(host);draw();
      figure.querySelector('[data-bf-growth-model]')?.addEventListener('change',event=>{state.matter=+event.target.value;draw(true);});
      window.addEventListener('bookthemechange',()=>{if(host.clientWidth>=100)draw(true);else previous=0;});
      figure.querySelector('.bf-expand').addEventListener('click',()=>openLarge(figure,record));
    }else{
      const panels=[...figure.querySelectorAll('.bf-image-panel')],buttons=[...figure.querySelectorAll('[data-bf-mode]')];
      let chosen=false;
      const show=mode=>{figure.dataset.mode=mode;panels.forEach((p,i)=>{p.hidden=mode!=='all'&&+mode!==i;});buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bfMode===mode)));};
      const defaults=()=>{if(!chosen)show(innerWidth<650?'0':'all');};
      buttons.forEach(b=>b.addEventListener('click',()=>{chosen=true;show(b.dataset.bfMode);}));
      panels.forEach(p=>p.querySelector('button').addEventListener('click',()=>openLarge(figure,record,p)));
      window.addEventListener('resize',defaults);defaults();
    }
  }
})();
