(()=>{
  'use strict';
  const sources={
    intro:{title:'第 1 章：导论',section:'§1.1–1.4',pages:'1–24',pdf:'23–46',body:'本章以宇宙学背景、初始条件和物理过程组织星系形成问题。网页用原创讲解重述要点，并增加可操作的教学模型。原书全文和图像不随网站发布。'},
    diversity:{title:'星系族群的多样性',section:'§1.1',pages:'2–5',pdf:'24–27',body:'依据形态、光度与恒星质量、大小与表面亮度、冷气体比例、颜色、环境、核活动和红移的讨论。顶部图像只展示几何与组分，不是观测图，也不模拟动力学支撑。'},
    ingredients:{title:'星系形成的物理要素',section:'§1.2.1–1.2.11，图 1.1–1.3',pages:'5–14',pdf:'27–36',body:'原书讨论宇宙学、扰动、引力增长、气体冷却、恒星形成、反馈、并合、动力学、化学演化、恒星族合成与星系际介质。过程图为重新组织的原创示意；气体循环数值模型是新增教学简化。图 1.2 的冷气体向 AGN 吸积的通道已在文字解释中纳入作者勘误。'},
    clocks:{title:'时间尺度',section:'§1.3',pages:'14–15',pdf:'36–37',body:'动力学时间、自由落体时间、冷却时间、气体消耗时间和哈勃时间的定义据本节。计算器固定 H₀=70 km/s/Mpc 作教学示例。作者勘误将 p.14 动力摩擦时间的质量比从 M_sat/M_main 改为 M_main/M_sat。'},
    history:{title:'星系形成理论简史',section:'§1.4.1–1.4.5',pages:'15–24',pdf:'37–46',body:'时间线选择教材中的历史节点：星系的河外性质、膨胀宇宙、微波背景、暗晕中的气体冷却、CDM 与加速膨胀。仅呈现教材的历史叙述，不包含 2010 年之后的研究进展。'}
  };
  Object.assign(sources,window.BookSources||{});
  const byId=id=>document.getElementById(id);
  window.showTutor=prompt=>{
    let dialog=byId('tutor-dialog');
    if(!dialog){dialog=document.createElement('dialog');dialog.id='tutor-dialog';dialog.innerHTML='<button class="dialog-close" aria-label="关闭伴读问题">×</button><span class="small-label">带出处的伴读问题</span><h2>继续讨论这个实验</h2><p>问题包含当前参数和模型假设，可复制到你的 AI 对话中。</p><textarea id="tutor-prompt" aria-label="伴读问题" rows="10"></textarea><button id="copy-prompt" class="primary">复制伴读问题</button><span id="copy-status" aria-live="polite"></span>';document.body.append(dialog);bindDialog(dialog);bindCopy();}
    byId('tutor-prompt').value=prompt;byId('copy-status').textContent='';dialog.showModal();
  };
  function bindDialog(dialog){dialog.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}
  function bindCopy(){const button=byId('copy-prompt');if(!button||button.dataset.bound)return;button.dataset.bound='true';button.addEventListener('click',async()=>{const area=byId('tutor-prompt');try{await navigator.clipboard.writeText(area.value);byId('copy-status').textContent='已复制，可粘贴到 AI 对话。';}catch{area.focus();area.select();byId('copy-status').textContent='请复制已选中的问题。';}});}
  document.querySelectorAll('dialog').forEach(bindDialog);bindCopy();
  window.showSource=key=>{const s=sources[key]||(window.BookSources||{})[key];if(!s||!byId('source-dialog'))return;byId('source-title').textContent=s.title;byId('source-content').replaceChildren();const loc=document.createElement('div');loc.className='source-pages';loc.textContent=`${s.section} · 印刷页 ${s.pages} · PDF 页序 ${s.pdf}`;const body=document.createElement('p');body.textContent=s.body;const book=document.createElement('p');book.textContent='Mo, van den Bosch & White, Galaxy Formation and Evolution, Cambridge University Press, 2010。';byId('source-content').append(loc,body,book);if(s.references?.length){const list=document.createElement('ul');for(const ref of s.references){const li=document.createElement('li'),a=document.createElement('a');a.href=ref.url;a.textContent=ref.title;a.target='_blank';a.rel='noopener';li.append(a);list.append(li);}byId('source-content').append(list);}byId('source-dialog').showModal();};
  document.querySelectorAll('[data-source]').forEach(b=>b.addEventListener('click',()=>window.showSource(b.dataset.source)));
  document.querySelectorAll('[data-question]').forEach(b=>b.addEventListener('click',()=>window.showTutor('我在阅读 Mo, van den Bosch & White (2010)《Galaxy Formation and Evolution》的交互教材。'+b.dataset.question+' 请区分教材结论、补充解释和不确定性。')));
  const links=[...document.querySelectorAll('.chapter-rail nav a')];
  if(links.length){const observer=new IntersectionObserver(entries=>{const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(!visible[0])return;links.forEach(a=>a.setAttribute('aria-current',String(a.hash==='#'+visible[0].target.id)));},{rootMargin:'-15% 0px -60% 0px'});links.forEach(a=>{const section=document.querySelector(a.hash);if(section)observer.observe(section);});}
  const complete=byId('mark-read');
  const readKey='galaxies-chapter-'+(document.body.dataset.chapter||'1')+'-read';
  function readState(){try{return localStorage.getItem(readKey)==='true';}catch{return false;}}
  function syncRead(){if(!complete)return;complete.textContent=readState()?'取消已读标记':'标记本章已读';byId('read-status').textContent=readState()?'已在这台浏览器保存。':'';}
  complete?.addEventListener('click',()=>{try{localStorage.setItem(readKey,String(!readState()));syncRead();}catch{byId('read-status').textContent='浏览器未允许保存阅读记录。';}});syncRead();
})();
