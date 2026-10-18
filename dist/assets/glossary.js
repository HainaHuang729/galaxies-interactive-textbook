/* Contextual scientific definitions. Numerical models and typesetting are unchanged. */
((root, factory) => {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.BookGlossary = factory(root.BookGlossaryData, root);
})(globalThis, (data, root) => {
  'use strict';
  root ||= {};
  const greek = {alpha:'α',beta:'β',gamma:'γ',delta:'δ',epsilon:'ε',zeta:'ζ',eta:'η',theta:'θ',iota:'ι',kappa:'κ',lambda:'λ',mu:'μ',nu:'ν',xi:'ξ',pi:'π',rho:'ρ',sigma:'σ',tau:'τ',phi:'φ',chi:'χ',psi:'ψ',omega:'ω',Gamma:'Γ',Delta:'Δ',Theta:'Θ',Lambda:'Λ',Xi:'Ξ',Pi:'Π',Sigma:'Σ',Phi:'Φ',Psi:'Ψ',Omega:'Ω'};
  const scriptLetters = new Map([...'𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵'].map((c,i)=>[c,String.fromCharCode(65+i)]));
  const normalize = value => [...String(value ?? '')].map(c=>scriptLetters.has(c)?'⟦cal'+scriptLetters.get(c)+'⟧':c).join('')
    .replace(/\\mathcal\s*\{?([A-Za-z])\}?/g, (_, c) => '⟦cal' + c + '⟧')
    .replace(/\\(ddot|dot|bar|overline|hat|widehat|tilde|widetilde)\s*\{?\s*\\([A-Za-z]+)\s*\}?/g, (raw, accent, c) => greek[c] ? greek[c]+({dot:'\u0307',ddot:'\u0308',bar:'\u0304',overline:'\u0304',hat:'\u0302',widehat:'\u0302',tilde:'\u0303',widetilde:'\u0303'}[accent]) : raw)
    .replace(/\\(ddot|dot|bar|overline|hat|widehat|tilde|widetilde)\s*\{?([A-Za-zα-ωΑ-Ω])\}?/g, (_, accent, c) => c + ({dot:'\u0307',ddot:'\u0308',bar:'\u0304',overline:'\u0304',hat:'\u0302',widehat:'\u0302',tilde:'\u0303',widetilde:'\u0303'}[accent]))
    .replace(/\\([A-Za-z]+)/g, (all, command) => greek[command] || ({star:'*',odot:'⊙'}[command]) || (['mathrm','rm','text','operatorname','mathit','mathbf','boldsymbol'].includes(command) ? '' : all))
    .normalize('NFKD').replace(/[\s{}_^\u200b-\u200d\u2061\u2062]/g, '').replace(/˙/g, '\u0307').replace(/[ˉ¯]/g, '\u0304').replace(/[ˆ^]/g, '\u0302')
    .replace(/ϕ/g, 'φ').replace(/ϵ/g, 'ε').replace(/ϑ/g, 'θ').replace(/ϱ/g, 'ρ').replace(/[⋆★∗]/g, '*').replace(/☉/g, '⊙').replace(/∣/g, '|').replace(/⟶/g, '→').replace(/[−–]/g, '-');
  const entries = data.entries, byId = new Map(entries.map(e => [e.id, e])), byAlias = new Map();
  for (const entry of entries) for (const alias of [...entry.aliases, ...(entry.tex && entry.matchTex !== false ? [entry.tex] : [])]) {
    const key = normalize(alias);
    if (!byAlias.has(key)) byAlias.set(key, []);
    if (!byAlias.get(key).includes(entry)) byAlias.get(key).push(entry);
  }
  const matchesContext = (actual, expected) => actual === expected || actual.startsWith(expected + '-') || expected.replace(/-lab$/, '') === actual.replace(/-lab$/, '');
  function resolve(alias, context = {}) {
    const candidates = byAlias.get(normalize(alias)) || [], ranked = [];
    for (const entry of candidates) {
      if (entry.chapters?.length && !entry.chapters.includes(+context.chapter)) continue;
      let rank = entry.chapters?.length ? 100 : 0;
      if (entry.contexts?.length) {
        const matched = entry.contexts.flatMap(want => (context.contexts || []).flatMap((actual,index) => matchesContext(actual,want) ? [{want,index}] : []));
        if (!matched.length) continue;
        // A local experiment outranks an ancestor section even when its ID is shorter.
        const nearest = Math.min(...matched.map(m => m.index));
        rank += 100000 - nearest * 100 + Math.max(...matched.filter(m => m.index === nearest).map(m => m.want.length));
      }
      ranked.push({entry, rank});
    }
    const best = Math.max(-1, ...ranked.map(r => r.rank));
    return ranked.filter(r => r.rank === best).map(r => r.entry);
  }
  const keys = [...new Set(entries.flatMap(e => e.aliases))].filter(k => k && !/^\s+$/.test(k)).sort((a, b) => b.length - a.length || a.localeCompare(b));
  const mathKeys = [...byAlias.keys()].sort((a,b) => b.length-a.length), mathByFirst = new Map();
  for (const key of mathKeys) {if (!mathByFirst.has(key[0])) mathByFirst.set(key[0], []); mathByFirst.get(key[0]).push(key);}
  const escaped = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(keys.map(escaped).join('|'), 'gu');
  function scan(text, context) {
    const results = []; pattern.lastIndex = 0;
    for (const match of String(text).matchAll(pattern)) {
      const value = match[0], before = text[match.index - 1] || '', after = text[match.index + value.length] || '';
      if (/^[A-Za-z0-9_]/.test(value) && /[A-Za-z0-9_]/.test(before) || /[A-Za-z0-9_]$/.test(value) && /[A-Za-z0-9_]/.test(after)) continue;
      const found = resolve(value, context);
      if (found.length) results.push({value, index: match.index, entries: found});
    }
    return results;
  }
  if (!root.document) return {normalize, resolve, scan, entries, byId};
  const document = root.document;
  const chapter = +document.body.dataset.chapter || (/rotation/.test(location.pathname) ? 11 : /(?:^|\/)index(?:\.html)?$/.test(location.pathname) || location.pathname === '/' ? 1 : 0);
  let observer, timer, dialog, opener, currentIds = [], searchMode = false, expressionNotes = new Map();
  const create = (tag, cls, text) => {const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el;};
  function contextOf(element) {
    const contexts = [];
    for (let el = element?.nodeType === 3 ? element.parentElement : element; el && el !== document.body; el = el.parentElement) {
      // Explicit author bindings on an element precede its generic HTML ID.
      if (el.dataset.glossaryContext) contexts.push(...el.dataset.glossaryContext.split('|'));
      if (el.id && !/^reader-page-\d+$/.test(el.id)) contexts.push(el.id);
      if (el.dataset.pageTarget) contexts.push(el.dataset.pageTarget.replace(/-model$/, ''));
      if (el.dataset.lab) contexts.push(el.dataset.lab);
    }
    return {chapter, contexts: [...new Set(contexts)]};
  }
  function bind(el, found, label, math = false) {
    const ids = [...new Set(found.map(e => e.id))]; if (!ids.length) return;
    el.dataset.glossaryIds = ids.join(' '); el.dataset.glossaryLabel = label;
    el.classList.add(math ? 'glossary-symbol' : 'glossary-term');
    el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('aria-haspopup', 'dialog');
    el.setAttribute('aria-label', label + '：查看' + found.map(e => e.title).join('、') + '解释');
    el.title = found.map(e => e.title).join(' / ') + ' · 点击解释';
  }
  const excluded = 'script,style,textarea,input,select,option,code,pre,math,.katex,.inline-math,.typeset-math,.math-measure,.canvas-math-overlay,.glossary-ui,[data-glossary-ids],button,a,nav,header,[data-no-glossary]';
  function annotateText(container) {
    if (container.closest?.(excluded)) return;
    // SVG <text> is handled below, but foreignObject contains ordinary HTML:
    // its prose labels (He, instrument names, …) need ordinary term binding.
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {acceptNode: node => node.parentElement?.closest(excluded) || node.parentElement?.namespaceURI==='http://www.w3.org/2000/svg' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const found = scan(node.data, contextOf(node.parentElement)); if (!found.length) continue;
      const fragment = document.createDocumentFragment(); let offset = 0;
      for (const item of found) {
        fragment.append(document.createTextNode(node.data.slice(offset, item.index)));
        const term = create('span', '', item.value); bind(term, item.entries, item.value); fragment.append(term); offset = item.index + item.value.length;
      }
      fragment.append(document.createTextNode(node.data.slice(offset))); node.replaceWith(fragment);
    }
  }
  function resolveVisual(label,node,context) {
    const key=normalize(label), expression=node.closest('.inline-math,.math-line .katex'), tex=expression?.querySelector('annotation')?.textContent||'';
    // Upright unit glyphs retain their meaning even where the same italic
    // letter names a local physical variable (notably entropy K).
    const unitIds={K:'common-unit-K',s:'tools-second',m:'supp-unit-metre',g:'supp-unit-gram',km:'tools-km',cm:'common-unit-cm',Hz:'common-unit-Hz',mK:'common-unit-mK',eV:'common-unit-eV',keV:'common-unit-keV',erg:'common-unit-erg'};
    if(unitIds[key]&&(node.matches('.mathrm')||node.closest('.mathrm')||node.querySelector('.mathrm')))return [byId.get(unitIds[key])];
    if(key==='p' && /\bp\.?\s*\d/.test(expression?.dataset.inlineRaw||''))return [byId.get('common-page-ref')];
    if(key==='d'&&!node.closest('.msupsub')&&/(?:\\frac\s*\{?d|\\mathrm\s*\{?d|\\,d[ A-Za-z\\]|d\\ln)/.test(tex))return [byId.get('common-differential')];
    if(key==='s'&&(node.closest('.mathrm')||/\\mathrm\s*\{?cm\}?[^=]*\/\s*s(?:\b|$)/.test(tex)))return [byId.get('tools-second')];
    if(key==='x'&&context.chapter===4&&context.contexts.includes('statistics'))return [byId.get(/(?:W[^()=]{0,50}\(\s*x|\\sin\s*\(?x|^x\s*=\s*k)/.test(tex)?'c4-x-window':'c4-spatial-x')];
    if(['Re','Im'].includes(key)&&node.closest('.mop'))return [byId.get('common-'+key)];
    if(key==='e'&&context.chapter===16&&context.contexts.some(c=>/absorption-line|curve-of-growth/.test(c))){
      const group=node.closest('.mord:has(>.msupsub)');
      return [byId.get(group&&normalize(group.textContent)==='e2'?'common-charge':'common-e')];
    }
    return resolve(label,context);
  }
  // Read the visual atom without losing accents. DOM textContent places a
  // hat after its base, whereas the glossary keeps it as a combining mark.
  function atomLabel(node,tex='') {
    const copy=node.cloneNode(true),holder=create('span');holder.append(copy);
    for(const cal of copy.querySelectorAll('.mathcal'))cal.replaceWith(document.createTextNode('\\mathcal{'+cal.textContent+'}'));
    if(copy.matches('.mathcal'))return '\\mathcal{'+copy.textContent+'}';
    for(const accent of [...holder.querySelectorAll('.katex-accent')].reverse()) {
      const body=accent.querySelector('.accent-body'),glyph=body?.textContent.trim()||'';body?.remove();
      const base=accent.textContent.replace(/[\u200b-\u200d]/g,'');
      let mark=({'^':'\u0302','˙':'\u0307','ˊ':'\u0301','¨':'\u0308','ˉ':'\u0304','¯':'\u0304','~':'\u0303','˜':'\u0303'}[glyph]);
      if(!mark){const names=[escaped(base[0]||''),...Object.entries(greek).filter(([,value])=>value===base[0]).map(([name])=>'\\\\'+name)].join('|');const command=tex.match(new RegExp('\\\\(widehat|hat|ddot|dot|bar|overline|tilde|widetilde)\\s*\\{?\\s*(?:'+names+')(?:\\b|[ }_])'));mark=command&&({widehat:'\u0302',hat:'\u0302',ddot:'\u0308',dot:'\u0307',bar:'\u0304',overline:'\u0304',tilde:'\u0303',widetilde:'\u0303'}[command[1]]);}
      accent.replaceWith(document.createTextNode(base[0]+(mark||'')+base.slice(1)));
    }
    return holder.textContent;
  }
  function numericPowerBases(expression) {
    const bases=new Map();
    for(const power of expression.querySelectorAll('math msup,math msubsup')) {
      const parts=[...power.children],exp=parts.at(-1)?.textContent||'';
      if(!/^[+−-]?\d+(?:\.\d+)?$/.test(exp))continue;
      const plain=node=>node.localName==='mover'?plain(node.children[0])+({'^':'\u0302','˙':'\u0307','¨':'\u0308','¯':'\u0304','~':'\u0303'}[node.children[1]?.textContent]||''):node.localName==='mi'&&node.getAttribute('mathvariant')==='script'?'\\mathcal{'+node.textContent+'}':[...node.children].length?[...node.children].map(plain).join(''):node.textContent;
      const base=parts.slice(0,-1).map(plain).join('');bases.set(normalize(base+exp),base);
    }
    return bases;
  }
  function annotateMath(container) {
    for (const expression of container.querySelectorAll('.inline-math,.math-line .katex')) {
      if (expression.closest('[data-glossary-ids],button,a,.glossary-ui,.math-measure,.math-select-preview')) continue;
      const html = expression.querySelector('.katex-html'); if (!html) continue;
      const label = atomLabel(html,expression.querySelector('annotation')?.textContent||'');
      // A function's argument is an independent quantity. An alias such as
      // I(R) may aid search but must not turn the R glyph into intensity.
      if(/[()=+→]/.test(label))continue;
      const whole = resolveVisual(label,html,contextOf(expression));
      if (whole.length) {bind(expression, whole, normalize(label), true); expression.dataset.glossaryWhole = 'true'; expression.classList.add('glossary-math-root');}
    }
    // Bind compound atoms before their individual leaves: R_e^2 is a power
    // of effective radius, never Euler's e plus a generic R.
    for(const expression of container.querySelectorAll('.inline-math,.math-line .katex')){
      if(expression.dataset.glossaryWhole||expression.closest('button,a,.glossary-ui,.math-measure,.math-select-preview'))continue;
      const tex=expression.querySelector('annotation')?.textContent||'',powers=numericPowerBases(expression),context=contextOf(expression);
      for(const node of expression.querySelectorAll('.katex-html .mord:has(>.msupsub),.katex-html .katex-accent')){
        if(node.closest('[data-glossary-ids]')||node.querySelector('.mfrac,.sqrt'))continue;
        // In \mathrm{cm^3}, KaTeX attaches the power only to the final m.
        // Leave that group for the complete unit match (cm³), not metre³.
        if(node.querySelector('.mathrm')&&node.previousElementSibling?.matches('.mathrm'))continue;
        const label=atomLabel(node,tex);let found=resolveVisual(label,node,context);
        if(!found.length&&powers.has(normalize(label)))found=resolveVisual(powers.get(normalize(label)),node,context);
        if(found.length)bind(node,found,label,true);
      }
    }
    // KaTeX may merge adjacent identifiers (GM) or separate a named atom
    // (Ly + alpha). Match complete semantic aliases across visual text leaves.
    for (const expression of container.querySelectorAll('.inline-math,.math-line .katex')) {
      if (expression.dataset.glossaryWhole || expression.closest('button,a,.glossary-ui,.math-measure,.math-select-preview')) continue;
      const html = expression.querySelector('.katex-html'); if (!html) continue;
      const walker = document.createTreeWalker(html, NodeFilter.SHOW_TEXT), runs = []; let text = '';
      while (walker.nextNode()) {
        const leaf = walker.currentNode, node = leaf.parentElement.closest('.mord,.mop,.mrel,.mbin,.mopen,.mclose');
        if (!node || node.closest('.text')) continue;
        const pieces=node.closest('[data-glossary-ids]')?['\uffff']:node.closest('.mathcal')?['\\mathcal{'+leaf.data+'}']:node.matches('.mop,.mathrm')?[leaf.data]:[...leaf.data];
        for(const raw of pieces){const key=normalize(raw);if(!key)continue;runs.push({node,start:text.length,end:text.length+key.length,key});text+=key;}
      }
      const starts = new Set(runs.map(r=>r.start)), ends = new Set(runs.map(r=>r.end)), context = contextOf(expression);
      const assignments=new Map();
      for (let i=0;i<text.length;) {
        let hit = false;
        if (starts.has(i)) for (const key of mathByFirst.get(text[i]) || []) {
          if(/[()=+→/|]/.test(key))continue;
          if (!text.startsWith(key,i) || !ends.has(i+key.length)) continue;
          const range=runs.filter(r=>r.start>=i&&r.end<=i+key.length);
          if(range.some(r=>r.node.matches('.mop')&&r.key!==key))continue;
          const found = resolveVisual(key,range[0]?.node||expression,context); if (!found.length) continue;
          if(found.every(e=>e.kind==='unit')&&!range.some(r=>r.node.matches('.mathrm')||r.node.closest('.mathrm'))&&/^[A-Za-z]{2,}$/.test(key))continue;
          for (const run of range) if (!run.node.closest('[data-glossary-ids]')) {if(!assignments.has(run.node))assignments.set(run.node,new Map());for(const entry of found)assignments.get(run.node).set(entry.id,entry);}
          i += key.length; hit=true; break;
        }
        if (!hit) i++;
      }
      for(const [node,found] of assignments)bind(node,[...found.values()],normalize(node.textContent),true);
    }
    const list = [...container.querySelectorAll('.katex-html .mord,.katex-html .mop,.katex-html .mrel,.katex-html .mbin,.katex-html .mopen,.katex-html .mclose')];
    for (const node of list) {
      if (node.closest('[data-glossary-ids],button,a,.glossary-ui,.math-measure,.math-select-preview') || node.querySelector('[data-glossary-ids]')) continue;
      if (node.querySelector('.mfrac,.sqrt,.op-symbol,.delimsizing') || node.textContent.length > 35) continue;
      // Composite variables (M_BH, T_s, ...) take precedence over their base letter.
      let label = node.textContent;
      const cal = node.matches('.mathcal') ? node : node.querySelector('.mathcal');
      if (cal) label = label.replace(cal.textContent, '\\mathcal{' + cal.textContent + '}');
      const context = contextOf(node);
      const tex = node.closest('.katex')?.querySelector('annotation[encoding="application/x-tex"]')?.textContent || '';
      const differential = normalize(label) === 'd' && !node.closest('.msupsub') && /(?:\\frac\s*\{?d|\\mathrm\s*\{?d|\\,d[ A-Za-z\\]|d\\ln)/.test(tex);
      const upright = node.matches('.mathrm') || node.querySelector(':scope>.mathrm');
      const unit = upright && normalize(label) === 's' ? byId.get('tools-second') : null;
      const operator = node.matches('.mop') && ['Re','Im'].includes(normalize(label)) ? byId.get('common-'+normalize(label)) : null;
      let found = differential ? [byId.get('common-differential')] : unit ? [unit] : operator ? [operator] : resolveVisual(label,node,context);
      if (!found.length && node.matches('.mathnormal') && /^[A-Za-zα-ωΑ-Ω]{2,6}$/.test(label)) {
        const product = [...label].map(c=>resolve(c,context)); if (product.every(list=>list.length)) found = [...new Map(product.flat().map(e=>[e.id,e])).values()];
      }
      if (found.length) bind(node, found, normalize(label), true);
    }
    for (const expression of container.querySelectorAll('.inline-math,.math-line .katex')) {
      if (expression.closest('button,a,.glossary-ui,.math-measure,.math-select-preview')) continue;
      const inner = [...expression.querySelectorAll('.katex-html [data-glossary-ids]')]; if (!inner.length) continue;
      const ids = [...new Set(inner.flatMap(el => el.dataset.glossaryIds.split(' ')))];
      bind(expression, ids.map(id => byId.get(id)), '公式中的符号', true); expression.classList.add('glossary-math-root');
      // One accessible focus stop opens the equation's complete variable list.
      // Mouse/touch readers can still choose an individual visible glyph.
      for (const symbol of inner) for (const attr of ['role','tabindex','aria-label','aria-haspopup']) symbol.removeAttribute(attr);
    }
    for (const label of container.querySelectorAll('svg text:not(.math-svg-source)')) {
      if (label.closest('[data-glossary-ids],.glossary-ui,defs')) continue;
      const found = scan(label.textContent, contextOf(label)).flatMap(m => m.entries);
      if (found.length) bind(label, found, label.textContent, true);
    }
    for (const overlay of container.querySelectorAll('.canvas-math-overlay')) {
      if (overlay.querySelector('[data-glossary-ids]')) overlay.removeAttribute('aria-hidden');
    }
  }
  function pageEntries(page) {
    const found = new Map();
    for (const el of page.querySelectorAll('[data-glossary-ids]')) for (const id of el.dataset.glossaryIds.split(' ')) if (byId.has(id)) found.set(id, byId.get(id));
    // Include text in native options, original SVG labels and canvas captions.
    for (const node of page.querySelectorAll('button:not(.glossary-ui),a,option,[data-math-label],[data-glossary-canvas-text]')) {
      const text = node.dataset.mathLabel || node.dataset.glossaryCanvasText || node.textContent;
      for (const match of scan(text, contextOf(node))) for (const entry of match.entries) found.set(entry.id, entry);
    }
    for (const canvas of page.querySelectorAll('canvas')) for (const label of canvas.__glossaryLabels || []) for (const entry of scan(label, contextOf(canvas)).flatMap(m => m.entries)) found.set(entry.id, entry);
    return [...found.values()];
  }
  const controlHelp=new WeakMap();
  function readableText(el){const copy=el.cloneNode(true);copy.querySelectorAll('.inline-math[data-inline-raw]').forEach(n=>n.replaceWith(document.createTextNode(n.dataset.inlineRaw)));copy.querySelectorAll('.katex').forEach(n=>n.replaceWith(document.createTextNode(n.querySelector('.katex-html')?.textContent||'')));return copy.textContent;}
  function explainControls(container){
    const controls=[...container.querySelectorAll('.segmented,.two-choice,.preset-buttons,.scenario-tabs,select')];
    for(const control of controls){
      if(control.closest('.glossary-ui'))continue;
      const labels=control.matches('select')?[...control.options]:[...control.querySelectorAll('button')];
      const entries=[...new Map(labels.flatMap(el=>scan(readableText(el),contextOf(control)).flatMap(m=>m.entries)).filter(e=>e.kind!=='notation').map(e=>[e.id,e])).values()];
      if(!entries.length)continue;
      let help=controlHelp.get(control);
      if(!help){help=create('button','glossary-control-help glossary-ui','选项释义');help.type='button';help.setAttribute('aria-haspopup','dialog');const anchor=control.closest('.math-select-wrap')||control;anchor.after(help);controlHelp.set(control,help);}
      help.onclick=()=>openEntries(entries.map(e=>e.id),help);
    }
  }
  const canvasLayers = new WeakMap();
  function clearCanvas(canvas) {
    canvas.__glossaryLabels = [];
    canvasLayers.get(canvas)?.replaceChildren();
  }
  function captureCanvas(ctx, raw, x, y, maxWidth) {
    const canvas = ctx.canvas, text = String(raw);
    if (!canvas.isConnected || canvas.closest('.math-measure,.glossary-ui')) return;
    const found = scan(text, contextOf(canvas)).flatMap(m => m.entries); if (!found.length) return;
    if(!canvas.__glossaryCapturePending){clearCanvas(canvas);canvas.__glossaryCapturePending=true;requestAnimationFrame(()=>{canvas.__glossaryCapturePending=false;});}
    (canvas.__glossaryLabels ||= []).push(text);
    // Existing mathematical overlays already carry the exact rendered glyphs.
    if (root.BookMath?.has(text)) return;
    const matrix = ctx.getTransform(); if (matrix.b || matrix.c) return;
    let layer = canvasLayers.get(canvas);
    if (!layer) {
      const parent = canvas.parentElement; if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      layer = create('div', 'glossary-canvas-overlay'); parent.append(layer); canvasLayers.set(canvas, layer);
    }
    const rect = canvas.getBoundingClientRect(), parent = layer.parentElement.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const sx = rect.width / canvas.width, sy = rect.height / canvas.height, metrics = ctx.measureText(text), font = parseFloat(ctx.font.match(/([\d.]+)px/)?.[1]) || 12;
    const ascent = metrics.actualBoundingBoxAscent ?? font * .8, descent = metrics.actualBoundingBoxDescent ?? font * .2;
    const button = create('span', 'glossary-canvas-hit'); bind(button, found, text);
    const width = Math.min(metrics.width, maxWidth ?? Infinity) * Math.abs(matrix.a) * sx;
    const px = (matrix.a * x + matrix.e) * sx + rect.left - parent.left, py = (matrix.d * y + matrix.f) * sy + rect.top - parent.top;
    const align = ctx.textAlign, shift = align === 'center' ? width / 2 : align === 'right' || align === 'end' ? width : 0;
    button.style.cssText = `left:${px-shift}px;top:${py-ascent*Math.abs(matrix.d)*sy}px;width:${Math.max(width,8)}px;height:${Math.max(12,(ascent+descent)*Math.abs(matrix.d)*sy)}px`;
    layer.append(button);
  }
  function enhance(container = document.querySelector('.reader-slide.is-active') || document.querySelector('main') || document.body) {
    if (!container?.isConnected || container.closest('.glossary-ui')) return;
    observer?.disconnect();
    // Dynamic captions may arrive before the math observer's next flush.
    // Typeset the complete source first, so term spans cannot split \(...\).
    root.BookMath?.typeset(container);
    annotateText(container); annotateMath(container); explainControls(container);
    for (const svg of container.querySelectorAll('svg')) if (!svg.dataset.glossaryContext) svg.dataset.glossaryContext = contextOf(svg).contexts.join('|');
    const page = container.closest('.reader-slide') || container;
    if (page.matches('.reader-slide') && !page.querySelector('.glossary-page-open')) {
      const button = create('button', 'glossary-page-open glossary-ui', '本页符号与术语'); button.type = 'button';
      button.setAttribute('aria-haspopup', 'dialog'); button.onclick = () => openEntries(pageEntries(page).map(e => e.id), button, true);
      const context = page.querySelector('.reader-context'); if (context) context.append(button); else page.append(button);
    }
    observe();
  }
  function sourceNode(source) {
    const p = create('p', 'glossary-source'), raw = String(source || ''), url = raw.match(/https:\/\/[^\s]+/);
    if (!url) {p.textContent = raw; return p;}
    p.append(document.createTextNode(raw.slice(0, url.index)));
    const a = create('a', '', '查看依据'); a.href = url[0]; a.target = '_blank'; a.rel = 'noopener'; p.append(a); return p;
  }
  function scopeLabel(entry) {
    const place = entry.chapters?.length ? '第 ' + entry.chapters.join('、') + ' 章' : '全书通用';
    return place + (entry.contexts?.length ? ' · 指定模型' : '');
  }
  function symbolNode(entry) {
    const node = create('span', 'glossary-entry-symbol');
    if (entry.tex && root.katex) {
      try {node.innerHTML = root.katex.renderToString(entry.tex, {throwOnError: true, output: 'htmlAndMathml', trust: false});} catch {node.textContent = entry.aliases[0];}
    } else node.textContent = entry.kind === 'term' ? '' : entry.aliases[0];
    return node;
  }
  function card(entry) {
    const article = create('article', 'glossary-card'); article.dataset.entryId = entry.id;
    const identity = create('div', 'glossary-identity'); identity.append(symbolNode(entry), create('span', 'glossary-scope', scopeLabel(entry))); article.append(identity);
    article.append(create('h3', '', entry.title), create('p', 'glossary-english', entry.english || ''));
    if(expressionNotes.has(entry.id))article.append(create('p','glossary-expression-note',expressionNotes.get(entry.id)));
    const dl = create('dl');
    for (const [label, value] of [['含义', entry.definition], ['单位与量纲', entry.unit], ['使用条件', entry.scope]]) {
      if (!value) continue; dl.append(create('dt', '', label), create('dd', '', value));
    }
    article.append(dl, sourceNode(entry.source));
    const others = entries.filter(e => e.id !== entry.id && e.aliases.some(alias => entry.aliases.some(a => normalize(a) === normalize(alias))) && e.title !== entry.title);
    if (others.length) {
      const details = create('details', 'glossary-other-meanings'), summary = create('summary', '', '同符号／同名称在其他位置的含义'); details.append(summary);
      for (const other of others) {
        const button = create('button', 'glossary-other', scopeLabel(other) + '：' + other.title); button.type = 'button'; button.onclick = () => renderCards([other.id]); details.append(button);
      }
      article.append(details);
    }
    return article;
  }
  function ensureDialog() {
    if (dialog) return dialog;
    dialog = create('dialog', 'glossary-dialog glossary-ui'); dialog.id = 'glossary-dialog'; dialog.setAttribute('aria-labelledby', 'glossary-dialog-title');
    dialog.innerHTML = '<div class="glossary-dialog-head"><div><p class="glossary-place"></p><h2 id="glossary-dialog-title">符号与术语</h2></div><button type="button" class="glossary-close" aria-label="关闭释义">关闭 ×</button></div><div class="glossary-dialog-tools"><button type="button" class="glossary-search-toggle">检索全书</button><a href="glossary.html">打开词典页</a></div><div class="glossary-search-area" hidden></div><div class="glossary-results" aria-live="polite"></div>';
    dialog.querySelector('.glossary-close').onclick = () => dialog.close();
    dialog.querySelector('.glossary-search-toggle').onclick = () => showSearch();
    dialog.addEventListener('close', () => {if (opener?.isConnected) opener.focus({preventScroll: true});});
    dialog.addEventListener('keydown', event => event.stopPropagation());
    dialog.addEventListener('click', event => {if (event.target === dialog) {const b = dialog.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close();}});
    document.body.append(dialog); return dialog;
  }
  function renderCards(ids) {
    currentIds = ids; searchMode = false;
    const pane = dialog.querySelector('.glossary-results'); pane.replaceChildren(...ids.filter(id => byId.has(id)).map(id => card(byId.get(id))));
    if (!pane.childElementCount) pane.append(create('p', '', '本页没有独立符号条目，可使用全书检索查找相关概念。'));
    dialog.querySelector('.glossary-search-area').hidden = true;
    dialog.querySelector('.glossary-search-toggle').hidden = false;
    dialog.querySelector('#glossary-dialog-title').textContent = ids.length === 1 && byId.has(ids[0]) ? byId.get(ids[0]).title : '本处符号与术语';
    pane.scrollTop = 0;
  }
  function renderChoices(ids, page) {
    renderCards([]); dialog.querySelector('#glossary-dialog-title').textContent=page?'本页符号与术语':'这条公式的符号';
    const pane=dialog.querySelector('.glossary-results');pane.replaceChildren(create('p','glossary-search-count','选择一个符号或术语，查看它在本处的含义。'));
    const ordered=ids.map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>Number(a.kind==='notation')-Number(b.kind==='notation'));
    for(const entry of ordered){const button=create('button','glossary-search-result');button.type='button';button.append(symbolNode(entry));const text=create('span','glossary-result-text');text.append(create('strong','',entry.title),create('span','',entry.english||''));button.append(text);button.onclick=()=>renderCards([entry.id]);pane.append(button);}
  }
  function powerNotes(target,ids){
    const notes=new Map(),math=target?.closest?.('.katex')||target?.querySelector?.('.katex');if(!math)return notes;
    for(const power of math.querySelectorAll('math msup,math msubsup')){
      const children=[...power.children],exponent=children.at(-1)?.textContent||'';
      if(!/^[+−-]?\d+(?:\.\d+)?$/.test(exponent))continue;
      const base=power.localName==='msubsup'?children.slice(0,2).map(n=>n.textContent).join(''):children[0]?.textContent||'';
      for(const id of ids){const entry=byId.get(id);if(entry?.aliases.some(a=>normalize(a)===normalize(base+exponent)))continue;if(entry?.aliases.some(a=>normalize(a)===normalize(base)))notes.set(id,`此处 ${base} 的幂次为 ${exponent}。下方解释基本量；幂次同时作用于它的单位。`);}
    }
    return notes;
  }
  function openEntries(ids, target, page = false) {
    ensureDialog(); if(!dialog.open||!dialog.contains(target))opener=target?.hasAttribute?.('tabindex')?target:(target?.closest?.('.glossary-math-root')||target);
    expressionNotes=powerNotes(target,ids);dialog.querySelector('.glossary-place').textContent = chapter ? `第 ${chapter} 章${page ? ' · 当前阅读页' : ' · 当前语境'}` : '全书词典';
    const unique=[...new Set(ids)];if(page||unique.length>6)renderChoices(unique,page);else renderCards(unique);
    if (!dialog.open) dialog.showModal(); dialog.querySelector('.glossary-close').focus({preventScroll: true});
  }
  function searchControls(container, results, initialChapter = 0) {
    const row = create('div', 'glossary-search-row');
    const label = create('label', 'glossary-search-label', '查符号、中文或英文');
    const input = create('input'); input.type = 'search'; input.placeholder = '例如 κ、会聚、IMF'; label.append(input);
    const selectLabel = create('label', 'glossary-filter-label', '范围'); const select = create('select'); select.append(new Option('全书', '0'));
    for (const ch of data.chapters) select.append(new Option(`第 ${ch.number} 章 · ${ch.title}`, ch.number)); select.value = String(initialChapter); selectLabel.append(select); row.append(label, selectLabel);
    const count = create('p', 'glossary-search-count'); container.replaceChildren(row, count);
    let shown = 0, filtered = [];
    function more() {
      const oldMore = results.querySelector('.glossary-load-more'); oldMore?.remove();
      for (const entry of filtered.slice(shown, shown + 60)) {
        const button = create('button', 'glossary-search-result'); button.type = 'button';
        button.append(symbolNode(entry)); const text = create('span', 'glossary-result-text'); text.append(create('strong', '', entry.title), create('span', '', (entry.english ? entry.english + ' · ' : '') + scopeLabel(entry))); button.append(text);
        button.onclick = () => {openEntries([entry.id], button);}; results.append(button);
      }
      shown = Math.min(filtered.length, shown + 60);
      if (shown < filtered.length) {const next = create('button', 'glossary-load-more', `再显示 ${Math.min(60, filtered.length - shown)} 条`); next.type = 'button'; next.onclick = more; results.append(next);}
    }
    function update() {
      const q = normalize(input.value).toLocaleLowerCase(), ch = +select.value;
      filtered = entries.filter(e => (!ch || !e.chapters.length || e.chapters.includes(ch)) && (!q || normalize([e.title, e.english, ...e.aliases].join(' ')).toLocaleLowerCase().includes(q)));
      // Exact alias matches appear first; case is retained by the actual contextual resolver.
      filtered.sort((a, b) => Number(b.aliases.some(x => normalize(x) === normalize(input.value))) - Number(a.aliases.some(x => normalize(x) === normalize(input.value))) || (a.chapters[0] || 0) - (b.chapters[0] || 0) || a.title.localeCompare(b.title, 'zh'));
      count.textContent = `${filtered.length} 条释义；同符号的不同含义分别列出。`; shown = 0; results.replaceChildren();
      if (!filtered.length) results.append(create('p', '', '未找到匹配条目。可换用中文全称、英文缩写或更短的符号名称。')); else more();
    }
    input.oninput = update; select.onchange = update; update(); return input;
  }
  function showSearch() {
    ensureDialog(); searchMode = true; dialog.querySelector('#glossary-dialog-title').textContent = '查全书符号与术语';
    dialog.querySelector('.glossary-search-toggle').hidden = true; const area = dialog.querySelector('.glossary-search-area'); area.hidden = false;
    const input = searchControls(area, dialog.querySelector('.glossary-results')); if (!dialog.open) dialog.showModal(); input.focus();
  }
  function activate(event) {
    const target = event.target.closest?.('[data-glossary-ids]'); if (!target || target.closest('.glossary-ui')) return;
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    event.preventDefault(); event.stopImmediatePropagation(); openEntries(target.dataset.glossaryIds.split(' '), target);
  }
  // Capture before chart/label handlers so explaining a symbol never changes a slider or probe.
  document.addEventListener('click', activate, true); document.addEventListener('keydown', activate, true);
  document.addEventListener('click',event=>{const source=event.target.closest?.('[data-source],.question-link');if(!source)return;for(const modal of document.querySelectorAll('#source-dialog,#tutor-dialog'))modal.dataset.glossaryContext=contextOf(source).contexts.join('|');},true);
  const activeRoot = () => document.querySelector('dialog[open]:not(.glossary-ui)') || document.querySelector('.reader-slide.is-active') || document.querySelector('main') || document.body;
  function observe() {observer?.observe(document.body, {subtree: true, childList: true, characterData: true});}
  function schedule() {if (!timer) timer = setTimeout(() => {timer = undefined; enhance(activeRoot());}, 65);}
  function start() {
    const nav = document.querySelector('.bookbar nav');
    if (nav && !nav.querySelector('.glossary-nav-open')) {const button = create('button', 'glossary-nav-open quiet glossary-ui', '符号与术语'); button.type = 'button'; button.setAttribute('aria-haspopup', 'dialog'); button.onclick = () => {opener = button; showSearch();}; nav.append(button);}
    const index = document.getElementById('glossary-index'); if (index) {index.classList.add('glossary-ui'); const controls = create('div', 'glossary-index-controls'), results = create('div', 'glossary-index-results'); index.append(controls, results); searchControls(controls, results);}
    observer = new MutationObserver(changes => {
      if (changes.some(change => {
        const el = change.target.nodeType === 3 ? change.target.parentElement : change.target;
        return !el.closest?.('.glossary-ui,[data-glossary-ids],.katex-mathml,.math-measure,script,style') && activeRoot().contains(el);
      })) schedule();
    });
    enhance(activeRoot()); document.addEventListener('reader:pagechange', schedule);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true}); else start();
  return {normalize, resolve, scan, entries, byId, contextOf, enhance, pageEntries, openEntries, showSearch, captureCanvas, clearCanvas};
});
