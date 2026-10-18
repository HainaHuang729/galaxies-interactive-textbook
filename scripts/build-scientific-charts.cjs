const fs=require('node:fs'),path=require('node:path'),dist=path.resolve(__dirname,'../dist');
for(const page of ['index.html',...Array.from({length:15},(_,i)=>`chapter-${i+2}.html`),'rotation.html']){
 const file=path.join(dist,page);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<link rel="stylesheet" href="assets\/scientific-charts\.css">|<script src="assets\/scientific-charts\.js" defer><\/script>/g,'');
 const index=html.indexOf('<script ',html.indexOf('<head'));
 html=html.slice(0,index)+'<script src="assets/scientific-charts.js" defer></script>'+html.slice(index);
 html=html.replace('</head>','<link rel="stylesheet" href="assets/scientific-charts.css"></head>');fs.writeFileSync(file,html);
}
console.log('Installed scientific chart presentation on all chapters and rotation experiment.');
