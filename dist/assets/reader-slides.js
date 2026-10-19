/* A chapter is a sequence of intact teaching units. Move live DOM nodes so
   experiment listeners, parameter state, MathML and original deep links survive. */
(() => {
  'use strict';
  const main = document.getElementById('reading');
  const rail = document.querySelector('.chapter-rail');
  if (!main || !rail || document.body.classList.contains('reader-ready')) return;
  const chapter = document.body.dataset.chapter || '1';
  const storageKey = `galaxies-chapter-${chapter}-slide-v1`;
  const sections = [...main.children].filter(el => el.matches('section, .chapter-footer'));
  const pages = [];
  const groups = [];
  const clean = el => {
    if(!el)return '';
    const copy=el.cloneNode(true);
    copy.querySelectorAll('.inline-math[data-inline-raw]').forEach(math=>math.replaceWith(document.createTextNode(math.dataset.inlineRaw)));
    copy.querySelectorAll('.katex').forEach(math=>math.replaceWith(document.createTextNode(math.querySelector('.katex-html')?.textContent||'')));
    return (copy.textContent||'').replace(/\s+/g,' ').trim();
  };
  const element = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  const titleOf = el => clean(el.querySelector('h3,h2,h1'));
  function heading(text) { return element('h2', 'reader-page-heading', text); }
  function addPage(group, nodes, title, type, target) {
    if (!nodes.length) return null;
    const page = element('div', `reader-slide reader-${type}`);
    const hasTarget = document.getElementById(target) || nodes.some(node => node.nodeType === 1 && (node.id === target || [...node.querySelectorAll('[id]')].some(el => el.id === target)));
    page.id = hasTarget ? `reader-page-${pages.length + 1}` : target;
    page.tabIndex = -1;
    page.setAttribute('role', 'group');
    const record = {el: page, title, type, target, group, index: pages.length};
    page.setAttribute('aria-label', title);
    page.dataset.pageTarget = target;
    if (type !== 'cover') page.append(element('div', 'reader-context', group.title));
    page.append(...nodes);
    group.el.append(page);
    group.pages.push(record);
    pages.push(record);
    return record;
  }
  function splitModel(group, experiment, page) {
    const models = [...experiment.querySelectorAll('details.model-assumptions')];
    if (!models.length) return;
    const target = `${page.target}-model`;
    models.forEach(detail => { detail.open = true; });
    const toolbar = element('div', 'reader-model-toolbar');
    const back = element('a', 'reader-model-back', '返回实验');
    back.href = `#${page.target}`;
    toolbar.append(back);
    const source = experiment.querySelector('[data-source]') || group.el.querySelector('.section-heading [data-source], .chapter-meta [data-source]');
    if (source) {
      const show = element('button', 'source', '本模型出处');
      show.type = 'button';
      show.addEventListener('click', () => window.showSource?.(source.dataset.source));
      toolbar.append(show);
    }
    addPage(group, [element('p', 'reader-model-kicker', '公式与模型边界'), heading(page.title), toolbar, ...models], `${page.title} · 公式与假设`, 'model', target);
    const link = element('a', 'reader-model-link', '查看公式与假设');
    link.href = `#${target}`;
    experiment.append(link);
  }
  for (const section of sections) {
    const isOpening = section.id === 'opening';
    const isFooter = section.matches('footer');
    const label = isOpening ? '本章起点' : isFooter ? '来源与延伸' : clean(section.querySelector('.section-heading h2')) || titleOf(section);
    const num = clean(section.querySelector('.section-heading > span'));
    const group = {el: section, title: [num, label].filter(Boolean).join(' '), pages: []};
    groups.push(group);
    section.classList.add('reader-group');
    if (isFooter) {
      section.id ||= 'chapter-references';
      addPage(group, [heading('来源与延伸'), ...section.childNodes], label, 'references', section.id);
      continue;
    }
    const children = [...section.children];
    children.forEach(el => el.remove());
    if (isOpening) {
      const lastIntro = children.findIndex(el => el.classList.contains('chapter-meta'));
      const cover = addPage(group, children.slice(0, lastIntro + 1), clean(children.find(el => el.tagName === 'H1')), 'cover', 'opening');
      const start = element('button', 'reader-start primary', '开始本章');
      const hint = element('p', 'reader-key-hint', '逐页阅读 · 左右方向键翻页');
      cover.el.append(start, hint);
      start.addEventListener('click', () => navigate(cover.index + 1));
      const rest = children.slice(lastIntro + 1);
      if (rest.length) {
        const experiment = rest.find(el => el.matches('.lab,[id$="-lab"]')) || rest[0];
        const title = titleOf(experiment) || clean(experiment.querySelector('.scene-caption')) || ({2:'把同一座星系放远一些',3:'膨胀怎样拉长光的波长',4:'密度起伏：振幅与相位'}[chapter] || '开篇实验');
        if (!experiment.querySelector('h2,h3')) rest.unshift(heading(title));
        const target = experiment.id || 'opening-experiment';
        const page = addPage(group, rest, title, 'experiment', target);
        splitModel(group, experiment, page);
      }
      continue;
    }
    if (section.id === 'practice') {
      const quiz = children.find(el => el.querySelector('.quiz-item'));
      if (quiz) {
        const questions = [...quiz.children];
        questions.forEach(el => el.remove());
        questions.forEach((question, i) => {
          const body = i === 0 ? quiz : element('div', 'reader-quiz-question');
          body.append(question);
          const nodes = [heading(`检验理解 · ${i + 1} / ${questions.length}`), body];
          if (i === questions.length - 1) nodes.push(...children.filter(el => el.matches('.chapter-finish')));
          addPage(group, nodes, `理解题 ${i + 1}：${clean(question.querySelector('h3'))}`, 'quiz', i === 0 ? 'practice' : `practice-question-${i + 1}`);
        });
        // Preserve any authored practice introduction as well as every question.
        const extras = children.filter(el => el !== quiz && !el.matches('.section-heading,.chapter-finish'));
        if (extras.length) group.pages[0].el.insertBefore(element('div'), group.pages[0].el.lastChild).append(...extras);
        continue;
      }
    }
    let pending = [], continuation = 0;
    const flush = () => {
      if (!pending.length) return;
      const first = !group.pages.length;
      const target = first ? section.id : `${section.id}-reading-${++continuation}`;
      let pageTitle = label;
      if (pending.every(el => el.matches('details'))) {
        pending.forEach(el => { el.open = true; });
        pageTitle = clean(pending[0].querySelector('summary')) || label;
        if (pending.length === 1) pending[0].querySelector('summary').textContent = '展开或收起说明';
        pending.unshift(heading(pageTitle));
      } else if (!pending.some(el => el.matches('.section-heading'))) pending.unshift(heading(label));
      addPage(group, pending, pageTitle, 'reading', target);
      pending = [];
    };
    for (const child of children) {
      if (child.matches('.body-figure,.body-illustration')) {
        flush();
        addPage(group, [child], titleOf(child) || label, 'figure', child.id);
      } else if (child.matches('.lab')) {
        flush();
        const target = child.id || `${section.id}-experiment-${group.pages.length + 1}`;
        const page = addPage(group, [child], titleOf(child) || label, 'experiment', target);
        splitModel(group, child, page);
      } else if (child.matches('.concept-reading')) {
        flush();
        addPage(group, [child], titleOf(child) || label, 'reading', child.id || `${section.id}-concept-${group.pages.length + 1}`);
      } else if (child.id === 'cosmic-reading' || child.matches('.concept-readings')) {
        flush();
        const readings = [...child.children];
        readings.forEach((reading, i) => {
          const body = i === 0 ? child : element('div');
          body.append(reading);
          body.classList.add('reader-concept-container');
          addPage(group, [body], titleOf(reading) || label, 'reading', reading.id || `${section.id}-evidence-${i + 1}`);
        });
      } else {
        pending.push(child);
      }
    }
    flush();
  }
  if (!pages.length) return;

  const answerKey = `galaxies-chapter-${chapter}-answers-v1`;
  let answers = {};
  try {
    const saved = JSON.parse(localStorage.getItem(answerKey) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) answers = saved;
  } catch {}
  const saveAnswers = () => { try { localStorage.setItem(answerKey, JSON.stringify(answers)); return true; } catch { return false; } };
  for (const page of pages.filter(page => page.type === 'quiz')) {
    const question = clean(page.el.querySelector('.quiz-item h3'));
    const options = [...page.el.querySelectorAll('.quiz-options button')];
    const tools = element('div', 'reader-answer-tools');
    const status = element('span', 'reader-answer-status');
    status.setAttribute('role', 'status');
    const clear = element('button', 'quiet', '清除本题作答');
    clear.type = 'button'; clear.disabled = true;
    options.forEach((button, index) => button.addEventListener('click', () => {
      answers[question] = index;
      status.textContent = saveAnswers() ? '已保存在此浏览器' : '当前浏览器无法保存作答';
      clear.disabled = false;
    }));
    clear.addEventListener('click', () => {
      delete answers[question]; saveAnswers();
      options.forEach(button => button.setAttribute('aria-pressed', 'false'));
      const feedback = page.el.querySelector('.quiz-feedback');
      if (feedback) feedback.textContent = '';
      status.textContent = '已清除'; clear.disabled = true;
    });
    tools.append(clear, status);
    page.el.querySelector('.quiz-item')?.append(tools);
    if (Number.isInteger(answers[question]) && options[answers[question]]) options[answers[question]].click();
  }

  // A few carefully chosen checks teach how to use a model. Presets run the
  // existing input handlers and can be undone; no parallel model state exists.
  for (const page of pages) {
    const guide = window.BookLabGuides?.[`${chapter}:${page.target.replace(/-model$/, '')}`];
    page.guide = guide;
    if (!guide || page.type !== 'experiment') continue;
    const box = element('aside', 'reader-investigation');
    box.setAttribute('aria-label', '本页实验任务');
    box.append(element('p', 'reader-objective', guide.objective));
    const detail = element('details');
    detail.append(element('summary', '', '操作步骤与核对值'));
    const list = element('ol');
    guide.steps.forEach(step => list.append(element('li', '', step)));
    detail.append(list, element('p', 'reader-check', guide.check));
    (guide.terms || []).forEach(term => detail.append(element('p', 'reader-term', term)));
    if (guide.preset) {
      const button = element('button', 'quiet reader-check-preset', '载入核对参数');
      const undo = element('button', 'quiet reader-check-undo', '恢复操作前参数');
      button.type = undo.type = 'button';
      undo.disabled = true;
      const status = element('span', 'reader-preset-status');
      status.setAttribute('role', 'status');
      let snapshot = null;
      const apply = values => {
        pausePage(page);
        for (const [id, value] of Object.entries(values)) {
          const control = document.getElementById(id);
          if (!control) continue;
          control.value = value;
          control.dispatchEvent(new Event(control.matches('select') ? 'change' : 'input', {bubbles: true}));
        }
      };
      button.addEventListener('click', () => {
        snapshot = Object.fromEntries(Object.keys(guide.preset).map(id => [id, document.getElementById(id)?.value]));
        apply(guide.preset);
        undo.disabled = false;
        status.textContent = '已载入核对值，结果仍由当前实验计算。';
        updateOverflow();
      });
      undo.addEventListener('click', () => {
        if (!snapshot) return;
        apply(snapshot); snapshot = null; undo.disabled = true;
        status.textContent = '已恢复操作前参数。';
      });
      const actions = element('div', 'reader-check-actions');
      actions.append(button, undo, status); detail.append(actions);
    }
    box.append(detail);
    page.el.insertBefore(box, page.el.children[1] || null);
  }
  const showTutor = window.showTutor;
  if (showTutor) window.showTutor = prompt => {
    const guide = pages[current]?.guide;
    if (guide) prompt += '\n\n本页验证任务：' + guide.objective + '\n操作：' + guide.steps.join('；') + '\n核对：' + guide.check + '\n请对照当前参数判断它们是否满足核对条件，解释差异，不要假定我已完成全部步骤。';
    showTutor(prompt);
  };

  // Keep the chapter outline control at the left of the persistent top bar.
  const toggle = element('button', 'reader-outline-toggle');
  toggle.type = 'button';
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01"/></svg><span>目录</span>';
  toggle.setAttribute('aria-label', '打开本章目录');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'reader-outline');
  const drawer = element('dialog', 'reader-outline');
  drawer.id = 'reader-outline';
  drawer.setAttribute('aria-labelledby', 'reader-outline-title');
  const drawerHeader = element('div', 'reader-outline-header');
  const drawerTitle = element('h2', '', clean(rail.querySelector('.rail-title')) || `第 ${chapter} 章`);
  drawerTitle.id = 'reader-outline-title';
  const close = element('button', 'reader-outline-close', '×');
  close.type = 'button'; close.setAttribute('aria-label', '收起本章目录');
  drawerHeader.append(drawerTitle, close);
  const nav = element('nav', 'reader-outline-pages');
  nav.setAttribute('aria-label', '本章分页目录');
  for (const group of groups) {
    const block = element('div', 'reader-outline-group');
    block.append(element('p', '', group.title));
    for (const page of group.pages) {
      const a = element('a');
      a.href = `#${page.target}`;
      a.append(element('span', 'reader-outline-number', String(page.index + 1).padStart(2, '0')), element('span', '', page.title));
      a.dataset.readerIndex = page.index;
      nav.append(block);
      block.append(a);
      page.link = a;
    }
  }
  drawer.append(drawerHeader, nav);
  const railFooter = rail.querySelector('.rail-footer');
  if (railFooter) drawer.append(railFooter);
  rail.remove();
  const brand = document.querySelector('.bookbar .brand');
  if (brand) {
    const brandGroup = element('div', 'reader-brand-group');
    brand.before(brandGroup);
    brandGroup.append(toggle, brand);
  } else document.body.prepend(toggle);
  document.body.append(drawer);

  const pager = element('nav', 'reader-pager');
  pager.setAttribute('aria-label', '章节翻页');
  const progress = element('div', 'reader-progress');
  const progressFill = element('div'); progress.append(progressFill);
  progress.setAttribute('aria-hidden', 'true');
  const currentTitle = element('span', 'reader-current-title');
  const pageLabel = element('div', 'reader-page-label');
  pageLabel.append(currentTitle);
  const controls = element('div', 'reader-page-controls');
  const prev = element('button', 'reader-page-prev', '上一页');
  prev.type = 'button';
  const count = element('button', 'reader-page-count');
  count.type = 'button'; count.setAttribute('aria-label', '查看本章全部页面');
  count.setAttribute('aria-haspopup', 'dialog');
  count.setAttribute('aria-controls', 'reader-outline');
  const next = element('button', 'reader-page-next', '下一页');
  next.type = 'button';
  const announce = element('span', 'reader-sr-only');
  announce.setAttribute('role', 'status');
  controls.append(prev, count, next);
  pager.append(progress, pageLabel, controls, announce);
  document.body.append(pager);
  const overflow = element('button', 'reader-more-content', '本页还有内容 · 向下查看');
  overflow.type = 'button'; overflow.hidden = true;
  overflow.addEventListener('click', () => window.scrollBy({top: Math.max(180, innerHeight * .55), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
  pageLabel.append(overflow);
  document.body.classList.add('reader-ready');
  document.documentElement.classList.add('reader-document');
  let current = -1;
  let restoreOutlineFocus = true;
  function updateOverflow() {
    if (current < 0) return;
    const remaining = pages[current].el.getBoundingClientRect().bottom - pager.getBoundingClientRect().top;
    overflow.hidden = remaining < 36 || !!document.querySelector('dialog[open]');
  }
  let scrollFrame = 0;
  window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; updateOverflow(); }); }, {passive: true});
  window.addEventListener('resize', updateOverflow);
  main.addEventListener('toggle', () => requestAnimationFrame(updateOverflow), true);
  new ResizeObserver(updateOverflow).observe(main);
  new MutationObserver(updateOverflow).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['open']});
  function openOutline() {
    if (drawer.open) return;
    drawer.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', '收起本章目录');
    document.body.classList.add('reader-outline-open');
    updateOverflow();
    requestAnimationFrame(() => pages[current].link.scrollIntoView({block: 'nearest'}));
  }
  function closeOutline(restoreFocus = true) { restoreOutlineFocus = restoreFocus; drawer.close(); }
  drawer.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '打开本章目录');
    document.body.classList.remove('reader-outline-open');
    if (restoreOutlineFocus) toggle.focus({preventScroll: true});
    // Chrome releases the modal document's inertness after the closing frame.
    else requestAnimationFrame(() => requestAnimationFrame(() => pages[current].el.focus({preventScroll: true})));
    restoreOutlineFocus = true;
    updateOverflow();
  });
  toggle.addEventListener('click', () => drawer.open ? closeOutline() : openOutline());
  close.addEventListener('click', () => closeOutline());
  count.addEventListener('click', openOutline);
  drawer.addEventListener('click', event => {
    if (event.target !== drawer) return;
    const r = drawer.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeOutline();
  });
  function pageForHash(hash) {
    let id; try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch { return -1; }
    if (!id || id === 'reading') return -1;
    const exact = pages.findIndex(page => page.target === id || page.el.id === id);
    if (exact >= 0) return exact;
    const target = document.getElementById(id);
    if (!target) return -1;
    return pages.findIndex(page => page.el.contains(target) || target.contains(page.el));
  }
  function pausePage(page) {
    page?.el.querySelectorAll('button').forEach(button => {
      if (/^暂停/.test(button.textContent.trim()) && !button.disabled) button.click();
    });
  }
  function navigate(index, {historyMode = 'push', focus = true} = {}) {
    if (index < 0 || index >= pages.length || index === current) return;
    if (current >= 0) pausePage(pages[current]);
    current = index;
    pages.forEach((page, i) => {
      const active = i === current;
      page.el.classList.toggle('is-active', active);
      page.el.inert = !active;
      page.el.setAttribute('aria-hidden', String(!active));
      if (active) page.link.setAttribute('aria-current', 'page');
      else page.link.removeAttribute('aria-current');
    });
    const page = pages[current];
    const hash = `#${encodeURIComponent(page.target)}`;
    if (historyMode !== 'none' && location.hash !== hash) history[historyMode === 'replace' ? 'replaceState' : 'pushState']({reader: page.target}, '', hash);
    try { localStorage.setItem(storageKey, page.target); } catch {}
    count.textContent = `${current + 1} / ${pages.length}`;
    currentTitle.textContent = page.title;
    prev.disabled = current === 0;
    next.disabled = current === pages.length - 1;
    progressFill.style.width = `${(current + 1) / pages.length * 100}%`;
    announce.textContent = `第 ${current + 1} 页，共 ${pages.length} 页。${page.title}`;
    window.scrollTo({top: 0, behavior: 'instant'});
    if (focus) page.el.focus({preventScroll: true});
    document.dispatchEvent(new CustomEvent('reader:pagechange', {detail: {target: page.target, index: current, total: pages.length}}));
    requestAnimationFrame(updateOverflow);
  }
  prev.addEventListener('click', () => navigate(current - 1));
  next.addEventListener('click', () => navigate(current + 1));
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.hash === '#reading') {
      event.preventDefault();
      pages[current].el.focus({preventScroll: true});
      window.scrollTo({top: 0, behavior: 'instant'});
      return;
    }
    const index = pageForHash(link.hash);
    if (index < 0) return;
    event.preventDefault();
    if (drawer.open) closeOutline(false);
    navigate(index);
    if (index === current) pages[current].el.focus({preventScroll: true});
  });
  const followHistory = () => {
    const index = pageForHash(location.hash);
    if (index >= 0) {
      navigate(index, {historyMode: 'none'});
      requestAnimationFrame(() => window.scrollTo({top: 0, behavior: 'instant'}));
    }
  };
  window.addEventListener('popstate', followHistory);
  window.addEventListener('hashchange', followHistory);
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || document.querySelector('dialog[open]')) return;
    if (event.target.closest('input,textarea,select,button,a,summary,[contenteditable="true"],[role="slider"],.typeset-math,[tabindex="0"]') || window.getSelection()?.isCollapsed === false) return;
    if (event.key === 'ArrowRight' && current < pages.length - 1) { event.preventDefault(); navigate(current + 1); }
    if (event.key === 'ArrowLeft' && current > 0) { event.preventDefault(); navigate(current - 1); }
  });
  let initial = pageForHash(location.hash);
  if (initial < 0 && !location.hash) {
    try { initial = pageForHash(`#${localStorage.getItem(storageKey) || ''}`); } catch {}
  }
  navigate(initial < 0 ? 0 : initial, {historyMode: initial < 0 && location.hash ? 'none' : 'replace', focus: false});
  // A native first-load fragment scroll runs after deferred scripts. The
  // fragment selects the page, while the reader starts that page at its top.
  window.addEventListener('load', () => requestAnimationFrame(() => window.scrollTo({top: 0, behavior: 'instant'})), {once: true});
  // Width remains measurable for off-page models; notify the existing plotters
  // once after the shared layout expands into the space freed by the old rail.
  requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
})();
