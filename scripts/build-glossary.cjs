const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),directory=path.join(root,'content/glossary');
const entries=fs.readdirSync(directory).filter(f=>f.endsWith('.json')).sort().flatMap(f=>JSON.parse(fs.readFileSync(path.join(directory,f),'utf8')));
const ids=new Set();
for(const e of entries){
 if(!e.id||ids.has(e.id))throw Error('Duplicate/missing glossary id '+e.id);ids.add(e.id);
 for(const key of ['kind','title','english','definition','unit','scope','source'])if(typeof e[key]!=='string'||!e[key].trim())throw Error(e.id+': missing '+key);
 if(!Array.isArray(e.aliases)||!e.aliases.length||e.aliases.some(a=>!a||typeof a!=='string'))throw Error(e.id+': aliases');
 if(!Array.isArray(e.chapters)||e.chapters.some(c=>c<1||c>16))throw Error(e.id+': chapter');
 if(e.tex)try{require('../dist/assets/katex/katex.min.js').renderToString(e.tex,{throwOnError:true,strict:'error',trust:false});}catch(error){console.error(e.id+': '+error.message);process.exit(1);}
}
const chapters=JSON.parse(fs.readFileSync(path.join(dist,'content-sources.json'),'utf8')).chapters.map(c=>({number:c.number,title:c.title}));
const data={version:1,book:'Mo, van den Bosch & White (2010), Galaxy Formation and Evolution',entries,chapters};
fs.writeFileSync(path.join(dist,'assets/glossary-data.js'),'window.BookGlossaryData='+JSON.stringify(data).replaceAll('</','<\\/')+';\n');
fs.writeFileSync(path.join(dist,'glossary.json'),JSON.stringify(data)+'\n');
fs.writeFileSync(path.join(dist,'glossary.html'),'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="按章节与实验语境查阅星系形成与演化的物理符号、缩写和专业术语。"><title>符号与术语 | GALAXIES · 星系形成与演化</title><script src="assets/book-theme.js"></script><link rel="stylesheet" href="assets/book.css"><link rel="stylesheet" href="assets/theme-tokens.css"><link rel="stylesheet" href="assets/book-theme.css"><link rel="stylesheet" href="assets/katex/katex.min.css"><script src="assets/katex/katex.min.js" defer></script><script src="assets/inline-math-vocabulary.js" defer></script><script src="assets/inline-math.js" defer></script><link rel="stylesheet" href="assets/inline-math.css"></head><body><a class="skip" href="#glossary-index">跳到词典</a><header class="bookbar"><a class="brand" href="index.html">GALAXIES<span>星系形成与演化</span></a><nav aria-label="全书导航"><a href="chapters.html">全书目录</a><a href="experiments.html">实验</a></nav></header><main class="glossary-index-page"><h1>符号与术语</h1><p class="lede">从一个字母读懂一条公式。按中文、英文、缩写或符号查找；同一个字母在不同章节和实验中的含义分别列出。</p><p>释义依据本教材与各模型的明确约定。正文的点线文字与公式中的符号可点击查看本处解释。</p><div id="glossary-index"></div><noscript>词典检索需要启用JavaScript。完整结构化内容见<a href="glossary.json">释义数据</a>。</noscript></main></body></html>');
for(const name of fs.readdirSync(dist).filter(f=>f.endsWith('.html'))){const file=path.join(dist,name);let html=fs.readFileSync(file,'utf8');html=html.replace(/<!-- glossary:assets:start -->[\s\S]*?<!-- glossary:assets:end -->/g,'');html=html.replace('</head>','<!-- glossary:assets:start --><link rel="stylesheet" href="assets/glossary.css"><script src="assets/glossary-data.js" defer></script><script src="assets/glossary.js" defer></script><!-- glossary:assets:end --></head>');fs.writeFileSync(file,html);}
console.log(`Built contextual glossary: ${entries.length} definitions / ${chapters.length} chapters.`);
