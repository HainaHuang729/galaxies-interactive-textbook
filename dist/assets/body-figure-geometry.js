(() => {
  'use strict';
  const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const num = n => Number(n).toFixed(3).replace(/\.?0+$/,'') || '0';
  let gradientSerial=0;
  const H = {
    esc,
    text: (x,y,s,c='bf-label',anchor='start') => `<text x="${x}" y="${y}" class="${c}" text-anchor="${anchor}">${esc(s)}</text>`,
    line: (x1,y1,x2,y2,c='bf-line') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c}"/>`,
    path: (d,c='bf-series') => `<path d="${d}" class="${c}"/>`,
    circle: (x,y,r,c='bf-point') => `<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`,
    rect: (x,y,w,h,c='bf-shape',r=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" class="${c}"/>`,
    polyline: (p,c='bf-series') => `<polyline points="${p.map(p=>p.map(num).join(',')).join(' ')}" class="${c}"/>`,
    arrow(x1,y1,x2,y2,c='bf-series') {
      const a=Math.atan2(y2-y1,x2-x1),r=6;
      return H.line(x1,y1,x2,y2,c)+H.polyline([[x2-r*Math.cos(a-.45),y2-r*Math.sin(a-.45)],[x2,y2],[x2-r*Math.cos(a+.45),y2-r*Math.sin(a+.45)]],c);
    },
    panels(width,titles,panelHeight=240,minWidth=290,offsetY=0) {
      const gap=24,cols=Math.max(1,Math.min(titles.length,Math.floor((width+gap)/(minWidth+gap)))),w=(width-gap*(cols-1))/cols;
      return {height:Math.ceil(titles.length/cols)*(panelHeight+gap)-gap+offsetY,items:titles.map((title,i)=>({x:i%cols*(w+gap),y:offsetY+Math.floor(i/cols)*(panelHeight+gap),w,h:panelHeight}))};
    },
    axes(p,o) {
      // The 8px gap below the panel title keeps a title and the y-axis title apart.
      const q={x:p.x+46,y:p.y+52,w:p.w-64,h:p.h-100};
      if(o.equalAspect){const scale=Math.min(q.w/(o.xmax-o.xmin),q.h/(o.ymax-o.ymin)),w=scale*(o.xmax-o.xmin),h=scale*(o.ymax-o.ymin);q.x+=(q.w-w)/2;q.y+=(q.h-h)/2;q.w=w;q.h=h;}
      const x=v=>q.x+(v-o.xmin)/(o.xmax-o.xmin)*q.w,y=v=>q.y+q.h-(v-o.ymin)/(o.ymax-o.ymin)*q.h;
      const xt=o.xticks||[o.xmin,(o.xmin+o.xmax)/2,o.xmax],yt=o.yticks||[o.ymin,(o.ymin+o.ymax)/2,o.ymax];
      let svg=H.rect(q.x,q.y,q.w,q.h,'bf-plot-bg');
      const value=t=>Array.isArray(t)?t[0]:t,label=t=>Array.isArray(t)?t[1]:num(t);
      for(const t of yt)if(value(t)>o.ymin&&value(t)<o.ymax)svg+=H.line(q.x,y(value(t)),q.x+q.w,y(value(t)),'bf-grid');
      for(const t of xt)if(value(t)>o.xmin&&value(t)<o.xmax)svg+=H.line(x(value(t)),q.y,x(value(t)),q.y+q.h,'bf-grid');
      svg+=H.line(q.x,q.y,q.x,q.y+q.h,'bf-axis')+H.line(q.x,q.y+q.h,q.x+q.w,q.y+q.h,'bf-axis');
      for(const t of xt)svg+=H.line(x(value(t)),q.y+q.h,x(value(t)),q.y+q.h+4)+H.text(x(value(t)),q.y+q.h+19,label(t),'bf-small',value(t)===o.xmin?'start':value(t)===o.xmax?'end':'middle');
      for(const t of yt)svg+=H.line(q.x-4,y(value(t)),q.x,y(value(t)))+H.text(q.x-8,y(value(t))+4,label(t),'bf-small','end');
      if(o.ylabel)svg+=H.text(q.x,q.y-9,o.ylabel,'bf-small');
      if(o.xlabel)svg+=H.text(q.x+q.w,q.y+q.h+39,o.xlabel,'bf-small','end');
      return {svg,x,y,plot:q};
    },
    raster(x,y,w,h,nx,ny,fn,min,max,index=0,extra={}){
      const values=[];for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)values.push(fn((i+.5)/nx,(j+.5)/ny));
      return {svg:`<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" data-bf-raster="${index}"/>`,field:{nx,ny,values,min,max,...extra}};
    },
    colorbar(x,y,w,min,max,label,mode='diverging'){
      const id=`bf-color-scale-${++gradientSerial}`,stops=mode==='sequential'?'<stop offset="0" stop-color="var(--bf-zero)"/><stop offset="1" stop-color="var(--bf-positive)"/>':'<stop offset="0" stop-color="var(--bf-negative)"/><stop offset=".5" stop-color="var(--bf-zero)"/><stop offset="1" stop-color="var(--bf-positive)"/>';
      let svg=`<defs><linearGradient id="${id}" color-interpolation="sRGB">${stops}</linearGradient></defs><rect x="${x}" y="${y}" width="${w}" height="9" fill="url(#${id})"/>`;
      svg+=H.text(x,y+29,String(min),'bf-small')+H.text(x+w,y+29,String(max),'bf-small','end')+H.text(x+w/2,y+50,label,'bf-label','middle');if(mode==='diverging')svg+=H.text(x+w/2,y+29,'0','bf-small','middle');return svg;
    },
    rng(seed) { return () => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed+.5)/4294967296;}; },
    // In-place redraw used by interactive renderers: the stage keeps its controls,
    // so a dragged range input is never replaced under the pointer.
    patchSvg(host,result,width){
      const svg=host.querySelector('svg');if(!svg)return null;
      svg.innerHTML=result.svg;
      svg.setAttribute('width',String(width));svg.setAttribute('height',String(result.height));
      svg.setAttribute('viewBox',`0 0 ${width} ${result.height}`);
      if(result.className&&!svg.classList.contains(result.className))svg.classList.add(...result.className.split(/\s+/).filter(Boolean));
      return svg;
    },
    // Mirror the state of controls from a freshly rendered control block onto the live DOM.
    syncControls(host,html){
      const holder=document.createElement('template');holder.innerHTML=html||'';
      const next=holder.content;
      const pick=(key,el)=>[...next.querySelectorAll(`[data-sync="${key}"]`)].find(n=>n.tagName===el.tagName&&String(n.type||'')===String(el.type||''));
      host.querySelectorAll('[data-sync]').forEach(el=>{
        const src=pick(el.getAttribute('data-sync'),el);if(!src)return;
        if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',src.getAttribute('aria-pressed')||'false');
        else if(el.matches('input[type="range"]'))el.value=src.value;
        else if(el.matches('input[type="checkbox"]'))el.checked=src.checked;
        else if(el.tagName==='OUTPUT'||el.hasAttribute('data-sync-text'))el.textContent=src.textContent;
        if(el.hasAttribute('hidden')||src.hasAttribute('hidden'))el.hidden=src.hasAttribute('hidden');
      });
      host.querySelectorAll('[data-sync-html]').forEach(el=>{
        const src=next.querySelector(`[data-sync-html="${el.getAttribute('data-sync-html')}"]`);
        if(src)el.innerHTML=src.innerHTML;
      });
    }
  };
  window.BookFigureGeometry=H;
  window.BookFigureRenderers={};
})();
