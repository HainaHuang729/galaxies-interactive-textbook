// Run the actual model and notation regressions; stop at the first failure.
const {spawnSync}=require('node:child_process');
const checks=['check-halo-physics','check-gas-physics','check-advanced-physics','check-precision-physics','check-body-figures','check-cmb-sampling','check-calculation-v28','check-chapter-expansion','check-measurement-physics','check-tide-selection','check-population-response','check-shell-conduction','check-photometry-drift','check-glossary','check-inline-math'];
for(const test of checks){console.log('\n'+test);const r=spawnSync(process.execPath,[__dirname+'/'+test+'.cjs'],{cwd:require('node:path').resolve(__dirname,'..'),stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
