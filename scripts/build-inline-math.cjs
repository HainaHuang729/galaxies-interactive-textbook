const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const vocabulary=JSON.parse(fs.readFileSync(path.join(root,'content/math/inline-vocabulary.json'),'utf8'));
// Preserve legacy HTML subscripts as a single mathematical identifier. Treating
// D<sub>L</sub> as two independent text nodes loses both layout and semantics.
function scriptTex(base,index,marker){const key=base+index,known=vocabulary.tokens[key];if(marker==='_'&&known)return known;const b=vocabulary.tokens[base]||base;let part=index.replace(/−/g,'-').replace(/\*/g,'\\star ');part=part.replace(/[α-ωΑ-Ω]/g,c=>vocabulary.tokens[c]||c);if(marker==='_'&&/^[A-Za-z]{2,}$/.test(index))part='\\mathrm{'+index+'}';return b+marker+'{'+part+'}';}
function legacyScripts(html){return html.replace(/([A-Za-zα-ωΑ-Ω])<sub>([^<>]{1,16})<\/sub>/g,(_,b,i)=>'\\('+scriptTex(b,i,'_')+'\\)').replace(/([A-Za-zα-ωΑ-Ω])<sup>([^<>]{1,16})<\/sup>/g,(_,b,i)=>'\\('+scriptTex(b,i,'^')+'\\)');}
fs.writeFileSync(path.join(dist,'assets/inline-math-vocabulary.js'),'window.BookMathVocabulary='+JSON.stringify(vocabulary)+';\n');
for(const page of fs.readdirSync(dist).filter(p=>p.endsWith('.html'))){const file=path.join(dist,page);let html=legacyScripts(fs.readFileSync(file,'utf8'));html=html.replace(/<!-- inline-math:assets:start -->[\s\S]*?<!-- inline-math:assets:end -->/g,'').replace(/<link rel="stylesheet" href="assets\/inline-math.css">/g,'');if(!html.includes('assets/katex/katex.min.css'))html=html.replace('</head>','<link rel="stylesheet" href="assets/katex/katex.min.css"></head>');html=html.replace('<head>','<head><!-- inline-math:assets:start --><script src="assets/katex/katex.min.js" defer></script><script src="assets/inline-math-vocabulary.js" defer></script><script src="assets/inline-math.js" defer></script><!-- inline-math:assets:end -->');html=html.replace('</head>','<link rel="stylesheet" href="assets/inline-math.css"></head>');fs.writeFileSync(file,html);}
for(const file of fs.readdirSync(path.join(dist,'assets')).filter(f=>f.endsWith('.css')&&f!=='inline-math.css')){
  const p=path.join(dist,'assets',file),css=fs.readFileSync(p,'utf8');
  // Isolate element selectors only: `span` is also a valid CSS grid value.
  fs.writeFileSync(p,css.replace(/([^{}]+)\{/g,(_,selector)=>selector.replace(/(?<![\w.#-])span(?![-\w]|:not\(\.inline-math)/g,'span:not(.inline-math, .inline-math *)')+'{'));
}
console.log('Installed shared TeX display on every page: prose, controls, live labels, SVG and canvas captions.');
