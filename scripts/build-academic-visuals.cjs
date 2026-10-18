const fs=require('node:fs'),path=require('node:path'),dist=path.resolve(__dirname,'../dist');
for(const page of fs.readdirSync(dist).filter(name=>name.endsWith('.html'))){
 const file=path.join(dist,page);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<link rel="stylesheet" href="assets\/academic-visuals\.css">/g,'');
 fs.writeFileSync(file,html.replace('</head>','<link rel="stylesheet" href="assets/academic-visuals.css"></head>'));
}
