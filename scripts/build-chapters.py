from pathlib import Path
from html import escape as e
import json,re
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'dist'
specs=[json.loads(p.read_text()) for p in sorted((ROOT/'content').glob('chapter-*.json'),key=lambda p:int(p.stem.split('-')[-1]))]
meta=json.loads((D/'content-sources.json').read_text())
ready={1:'index.html',**{n:f'chapter-{n}.html' for n in range(2,9)},**{s['number']:f'chapter-{s["number"]}.html' for s in specs}}
for spec in specs:
 next(c for c in meta['chapters'] if c['number']==spec['number'])['title']=spec['title']
def source_entry(title,pages,section,body):return dict(title=title,pages=f'{pages[0]}–{pages[1]}',pdf=f'{pages[0]+22}–{pages[1]+22}',section=section,body=body)
for s in specs:
 n=s['number'];sources={f'chapter-{n}':source_entry(s['title'],s['pages'],f'第{n}章',s['scope'])};labs={l['id']:l for l in s['labs']}
 for sec in s['sections']:
  sources[sec['id']]=source_entry(sec['title'],sec['pages'],sec['num'], ' '.join(sec['paragraphs'])+' 以上为原创导读，不是原书全文。')
  for lid in sec['labs']:
   labs[lid]['ref']=sec['num']+' · '+labs[lid]['ref']
 for l in s['labs']:
  sources[l['id']]=source_entry(l['title'],l['pages'],l['ref'],l['assumptions'])
  if l.get('references'):sources[l['id']]['references']=l['references']
 payload=json.dumps(s,ensure_ascii=False).replace('</','<\\/')
 (D/'assets'/f'chapter-{n}-content.js').write_text('window.ChapterSpec='+payload+';\nwindow.BookSources='+json.dumps(sources,ensure_ascii=False).replace('</','<\\/')+';\n')
 def labhtml(l):
  lid=l['id'];controls=''.join(f'<label for="{lid}-{p["key"]}">{e(p["label"])}<output id="{lid}-{p["key"]}-value"></output><input type="range" id="{lid}-{p["key"]}" min="{p["min"]}" max="{p["max"]}" step="{p["step"]}" value="{p["value"]}"></label>' for p in l['params'])
  chart=f'<svg class="chart science-chart" id="{lid}-chart" role="img" aria-label="{e(l["title"])}的模型曲线"></svg>'
  if l['scene']:art=f'<div class="advanced-stage"><div class="advanced-scene"><canvas id="{lid}-scene" role="img" aria-label="模型结构示意"></canvas><p id="{lid}-scene-note">{e(l["title"])}的几何或权重示意；非观测，定量结论依据曲线与读数。</p></div>{chart}</div>'
  else:art=chart
  read='<div class="readout-row">'+''.join(f'<div><span>{e(v)}</span><strong id="{lid}-v{i}"></strong></div>' for i,v in enumerate(l['values']))+'</div>'
  play=f'<button id="{lid}-play" class="quiet" aria-pressed="false">推进当前参数</button>' if l.get('sweep') else ''
  return f'<div class="lab advanced-lab" id="{lid}-lab" data-lab="{lid}"><div class="lab-heading"><h3>{e(l["title"])}</h3></div><p>{e(l["intro"])}</p>{art}<div class="advanced-legend" id="{lid}-legend"></div><div class="instrument-controls">{controls}</div><div class="experiment-actions"><button id="{lid}-reset" class="quiet">恢复本实验</button>{play}</div>{read}<p id="{lid}-result" class="experiment-result" aria-live="off"></p><div class="lab-links"><button class="source" data-source="{lid}">{e(l["ref"])}</button><button class="question-link" id="{lid}-question">讨论当前实验</button></div><details class="model-assumptions"><summary>公式、条件与模型边界</summary><div class="formula" data-math-key="{lid}">{l["formula"]}</div><p>{e(l["assumptions"])}</p></details></div>'
 prev=ready[n-1];count=len(s['labs']);extra=' + 1 个旋转实验' if s.get('crosslink') else ''
 head=f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="第{n}章{s["title"]}：原创导读、可操作物理实验、来源与伴读问题。"><title>第 {n} 章 · {s["title"]} | GALAXIES</title><link rel="stylesheet" href="assets/book.css"><link rel="stylesheet" href="assets/chapter-six.css"><link rel="stylesheet" href="assets/advanced-book.css"><link rel="stylesheet" href="assets/review-enhancements.css"><script src="assets/d3.min.js" defer></script><script src="assets/chapter-{n}-content.js" defer></script><script src="assets/common.js" defer></script><script src="assets/halo-physics.js" defer></script><script src="assets/gas-physics.js" defer></script><script src="assets/advanced-physics.js" defer></script><script src="assets/advanced-book.js" defer></script><script src="assets/review-enhancements.js" defer></script></head><body data-chapter="{n}"><a class="skip" href="#reading">跳到正文</a><header class="bookbar"><a class="brand" href="index.html">GALAXIES<span>星系形成与演化</span></a><nav aria-label="全书导航"><a href="chapters.html">全书目录</a><a href="{prev}">上一章</a><button id="tutor-open" class="quiet">伴读</button></nav></header><div class="book-layout"><aside class="chapter-rail"><div class="rail-title">第 {n} 章　{e(s["title"])}</div><nav aria-label="本章目录"><a href="#opening">本章起点</a>'
 for sec in s['sections']:head+=f'<a href="#{sec["id"]}">{e(sec["num"])} {e(sec["title"])}</a>'
 head+=f'<a href="#practice">检验理解</a></nav><div class="rail-footer">依据 MBW，2010<br>原书 pp.{s["pages"][0]}–{s["pages"][1]}<br><span>原创讲解与教学模型</span></div></aside><main id="reading"><section id="opening" class="chapter-opening"><div class="chapter-label">第 {n} 章 / {e(s["title"])}</div><h1>'+e(s['headline']).replace('\n','<br>')+f'</h1><p class="lede">{e(s["lede"])}</p><div class="chapter-meta"><span>{count} 个页面实验{extra}</span><span>{len(s["sections"])} 节导读</span><button class="source" data-source="chapter-{n}">本章依据</button></div>'+labhtml(s['labs'][0])+'</section>'
 for sec in s['sections']:
  head+=f'<section id="{sec["id"]}" class="reading-section"><div class="section-heading"><span>{e(sec["num"])}</span><h2>{e(sec["title"])}</h2><button class="source" data-source="{sec["id"]}">原书与范围</button></div><div class="prose">'+''.join(f'<p>{e(p)}</p>' for p in sec['paragraphs'])+'</div>'
  for lid in sec['labs']:
   if lid==s['labs'][0]['id']:head+=f'<a class="inline-link" href="#{lid}-lab">回到开篇实验</a>'
   else:head+=labhtml(labs[lid])
  if sec is s['sections'][0] and s.get('crosslink'):
   c=s['crosslink'];head+=f'<div class="chapter-crosslink"><h3>{e(c["title"])}</h3><p>{e(c["body"])}</p><a class="inline-link" href="{c["url"]}">进入旋转曲线实验</a></div>'
  head+='</section>'
 if n<16:
  nextTitle=next(c['title'] for c in meta['chapters'] if c['number']==n+1);nextURL=ready.get(n+1,f'chapters.html#chapter-{n+1}');nextText='下一章：'+nextTitle+('（提纲）' if n+1 not in ready else '')
 else:nextURL='chapters.html';nextText='完成本书，回到全书目录'
 head+=f'<section id="practice" class="reading-section"><div class="section-heading"><h2>检验理解</h2></div><div id="chapter-quiz"></div><div class="chapter-finish"><button id="mark-read" class="primary">标记本章已读</button><span id="read-status" aria-live="polite"></span><a href="{nextURL}">{e(nextText)}</a></div></section><footer class="chapter-footer"><a href="experiments.html">查看全部实验与图解</a><a href="model-audit.html">模型审查与精度</a><p>{e(s["scope"])}</p><p>{e(s["errata"])}</p><p>依据 Mo、van den Bosch &amp; White（2010）第{n}章 pp.{s["pages"][0]}–{s["pages"][1]}。文字与图形为原创编写，教材原PDF保持本地只读。</p><a href="https://people.umass.edu/hjmo/book/errata.pdf" target="_blank" rel="noopener">作者勘误</a><a href="{prev}">返回上一章</a><a href="chapters.html">全书目录</a></footer></main></div><dialog id="source-dialog"><button class="dialog-close" aria-label="关闭来源">×</button><span class="small-label">出处与改编说明</span><h2 id="source-title"></h2><div id="source-content"></div></dialog></body></html>'
 (D/f'chapter-{n}.html').write_text(head)
 c=next(c for c in meta['chapters'] if c['number']==n);c.update(status='draft_complete',printed_end_page=s['pages'][1],path=f'chapter-{n}.html',scope=s['scope'],experiment_count=count+(1 if s.get('crosslink') else 0));meta[f'chapter_{n}_models']={'pages':s['pages'],'experiments':[dict(id=l['id'],model=l['model'],pages=l['pages'],scope=l['assumptions'],references=l.get('references',[])) for l in s['labs']],'errata':s['errata']}
(D/'content-sources.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
# Preserve earlier chapter rows and experiment groups; regenerate only the authored later chapters.
p=D/'chapters.html';text=p.read_text()
for s in specs:
 n=s['number'];start=s['pages'][0];text=re.sub(fr'(<article class="chapter-row" id="chapter-{n}">.*?<h2>).*?(</h2>)',lambda m:m.group(1)+e(s['title'])+m.group(2),text);new=f'<p>原书起始页 {start}</p><a class="row-link" href="chapter-{n}.html">阅读与实验 →</a><small>已完成本章初版 · {len(s["labs"])+(1 if s.get("crosslink") else 0)}个实验</small>'
 text=re.sub(fr'(<article class="chapter-row" id="chapter-{n}">.*?<p>原书起始页 {start}</p>).*?(</div></article>)',lambda m: m.group(1).split(f'<p>原书起始页 {start}</p>')[0]+new+m.group(2),text)
last=max(ready);text=re.sub(r'第 1–\d+ 章已可阅读；第 11 章保留旋转曲线样板，其余章节将在编写后开放。',f'第 1–{last} 章已可阅读。各章按物理问题安排实验，保留来源、假设与带参数的伴读问题。',text)
text=re.sub(r'第 1–\d+ 章已可阅读。',f'第 1–{last} 章已可阅读。',text)
if last<16:
 title=next(c['title'] for c in meta['chapters'] if c['number']==last+1);plan=f'<section class="chapter-plan"><h2>下一章：{e(title)}</h2><p>正在按原书章节推进；实验数量由学习目标决定，不设统一上限。</p></section>'
else:plan='<section class="chapter-plan"><h2>全书交互导读初版已开放</h2><p>16章均包含原创讲解、可操作实验、理解检查和来源。可从章节顺序阅读，也可按物理问题浏览实验索引。各章说明研究模型与教学简化的边界。</p><a class="inline-link" href="experiments.html">按实验浏览</a></section>'
text=re.sub(r'<section class="chapter-plan">.*?</section>',plan,text);p.write_text(text)
p=D/'experiments.html';text=p.read_text()
for n in range(9,17):text=re.sub(fr'<section class="experiment-group" data-chapter="{n}">.*?</section>','',text)
groups=''
for s in sorted(specs,key=lambda s:s['number']):
 n=s['number'];groups+=f'<section class="experiment-group" data-chapter="{n}"><h2>第 {n} 章 · {e(s["title"])}</h2><ul>'+''.join(f'<li><a href="chapter-{n}.html#{l["id"]}-lab">{e(l["title"])}</a><p>{e(l["intro"])}</p></li>' for l in s['labs'])
 if s.get('crosslink'):groups+='<li><a href="rotation.html">指数盘与NFW旋转曲线</a><p>保留并纳入第11章的精细旋转模型。</p></li>'
 groups+='</ul></section>'
text=re.sub(r'<section class="experiment-group"><h2>第 11 章 · 旋转曲线样板</h2>.*?</section>','',text)
text=text.replace('</div><footer class="chapter-footer">',groups+'</div><footer class="chapter-footer">') if '</div><footer class="chapter-footer">' in text else text.replace('</div><section class="experiment-group"><h2>第 11',groups+'</div><section class="experiment-group"><h2>第 11')
# Existing closing index div may precede whitespace or removed sample.
if 'data-chapter="9"' not in text:text=text.replace('</div><footer',groups+'</div><footer')
text=re.sub(r'<p class="review-statement">.*?</p>',f'<p class="review-statement">第1–{last}章已开放。实验按机制组织，无统一数量上限；公式、读数和示意共享模型，各自的假设与来源在页面列出。</p>',text);p.write_text(text)
# Hook chapter8 into the continued book.
p=D/'chapter-8.html';text=p.read_text().replace('href="chapters.html#chapter-9">下一章：恒星形成（提纲）','href="chapter-9.html">下一章：恒星形成');p.write_text(text)
print('Built chapters '+', '.join(str(s['number']) for s in specs))

import subprocess
subprocess.run(["node",str(ROOT/"scripts/build-math.cjs")],check=True)
