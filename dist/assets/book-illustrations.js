(() => {
  'use strict';
  const artworks = [...document.querySelectorAll('.chapter-illustration')];
  if (!artworks.length) return;
  artworks.forEach(art => art.closest('.reader-cover')?.classList.add('has-illustration'));
  for(const study of document.querySelectorAll('.illustration-study')){
    const regions=JSON.parse(study.dataset.regions),figure=study.closest('figure'),trigger=figure.querySelector('.illustration-open'),img=trigger.querySelector('img'),outline=document.createElement('span');let selected;
    outline.className='illustration-region';outline.setAttribute('aria-hidden','true');trigger.append(outline);
    function place(){if(!selected||!img.naturalWidth)return;const imageBox=img.getBoundingClientRect(),buttonBox=trigger.getBoundingClientRect(),ratio=img.naturalWidth/img.naturalHeight,width=Math.min(imageBox.width,imageBox.height*ratio),height=width/ratio,[x,y,w,h]=selected.box;Object.assign(outline.style,{left:imageBox.left-buttonBox.left+(imageBox.width-width)/2+width*x/100+'px',top:imageBox.top-buttonBox.top+(imageBox.height-height)/2+height*y/100+'px',width:width*w/100+'px',height:height*h/100+'px'});}
    new ResizeObserver(place).observe(img);img.addEventListener('load',place);
    for(const button of study.querySelectorAll('[data-region]'))button.onclick=()=>{const on=button.getAttribute('aria-pressed')!=='true';study.querySelectorAll('[data-region]').forEach(n=>n.setAttribute('aria-pressed',String(on&&n===button)));outline.toggleAttribute('data-on',on);selected=on?regions[+button.dataset.region]:undefined;if(on){place();study.querySelector('p').textContent=selected.text;}else study.querySelector('p').textContent='选择一个区域，查看它与本节模型的关系。';};
  }
  let dialog, image, title, caption, provenance, legendBox, lastTrigger;
  for (const art of artworks) art.querySelector('.illustration-open').addEventListener('click', event => {
    const trigger = event.currentTarget;
    lastTrigger = trigger;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'illustration-dialog'; dialog.className = 'illustration-dialog';
      dialog.setAttribute('aria-labelledby', 'illustration-dialog-title');
      dialog.setAttribute('aria-describedby', 'illustration-dialog-caption');
      const close = document.createElement('button');
      close.type = 'button'; close.className = 'illustration-dialog-close'; close.textContent = '关闭 ×';
      close.addEventListener('click', () => dialog.close());
      title = document.createElement('h2'); title.id = 'illustration-dialog-title';
      image = document.createElement('img');
      const imageStage = document.createElement('div');imageStage.className='illustration-dialog-image';imageStage.append(image);
      caption = document.createElement('p'); caption.id = 'illustration-dialog-caption';
      legendBox = document.createElement('div'); legendBox.className = 'illustration-dialog-legend';
      provenance = document.createElement('p'); provenance.className = 'illustration-dialog-provenance';
      dialog.append(close, title, imageStage, caption, legendBox, provenance);
      dialog.addEventListener('close', () => lastTrigger?.focus({preventScroll:true}));
      dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const box = dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
      });
      document.body.append(dialog);
    }
    const isSvg=trigger.dataset.artFormat==='svg';dialog.classList.toggle('is-code-svg',isSvg);
    title.textContent = trigger.dataset.artTitle; caption.textContent = trigger.dataset.artCaption+(isSvg?' 小屏可在图内左右滑动，查看完整标注。':'');
    // Provenance comes from the manifest: AI concept image vs original code-drawn SVG.
    const generator = trigger.dataset.artGenerator || 'ImageGen（内置工具）';
    const artProvenance = trigger.dataset.artProvenance || '';
    provenance.textContent = [generator, artProvenance, /无定量标尺/.test(artProvenance) ? '' : '无定量标尺'].filter(Boolean).join(' · ');
    // The full legend is repeated in the enlarged view so the figure stays self-explanatory there.
    const sourceLegend = trigger.closest('figure')?.querySelector('.illustration-legend');
    legendBox.replaceChildren();
    if (sourceLegend) {
      legendBox.append(sourceLegend.cloneNode(true));
      legendBox.hidden = false;
      dialog.classList.add('has-legend');
    } else {
      legendBox.hidden = true;
      dialog.classList.remove('has-legend');
    }
    const original = trigger.querySelector('img');
    image.src = trigger.dataset.fullSrc; image.alt = original.alt;
    image.width = original.width; image.height = original.height;
    dialog.showModal();
  });
})();
