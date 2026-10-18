const fs=require('fs'),specs=require('../content/population-response-labs-v32.json'),entries=[];
function add(lab,key,title,tex,aliases,definition,unit='无量纲',kind='symbol'){entries.push({id:'v32-'+lab.id+'-'+key,kind,chapters:[lab.chapter],contexts:[lab.id+'-lab'],title,english:title,tex,aliases,definition,unit,scope:'仅按本实验定义；同形字母在其他章节需使用当地释义。',source:lab.source});}
const a=specs[0],b=specs[1];
for(const [key,title,tex,aliases,def,unit] of [
 ['alpha','IMF线性质量幂律斜率','\\alpha',['α','alpha'],'数量概率密度p(m)正比于m的负α次幂；不是每对数质量的斜率。'],
 ['m','恒星初生质量','m',['m'],'恒星形成之初的质量，本实验以太阳质量为单位；不是现在质量或视星等。','M☉'],
 ['limits','抽样质量下限与上限','m_l, m_u',['m_l','m_u','mₗ','mᵤ'],'本实验指定0.1和100太阳质量的截断边界，不宣称自然普适边界。','M☉'],
 ['p','按数量归一的质量概率密度','p(m)',['p(m)','p'],'积分p(m)dm为1；不是原书按单位形成质量归一的φ(m)。','M☉⁻¹'],
 ['J','幂律定积分','J(q;a,b)',['J'],'a到b的m^(q−1)积分；q=0采用ln(b/a)的连续极限。q取1−α用于数量，2−α用于质量。','随q与质量单位而定'],
 ['q','幂律积分的指数参数','q',['q'],'J积分中的指数参数；数量矩为1−α，初生质量矩为2−α。'],
 ['a','积分质量下界','a',['a'],'J(q;a,b)积分的下界；不是宇宙学尺度因子。','M☉'],
 ['b','积分上界或质量箱边界','b',['b'],'J(q;a,b)中b是上积分界；带下标的b_j、b_(j+1)是第j质量箱的两边。均为初生质量边界。','M☉'],
 ['N','本次固定抽样的恒星总数','N',['N'],'独立伪随机抽取的恒星数；固定N不固定样本总初生质量，也不是巡天星系数。','颗'],
 ['n','单个质量箱的样本数量','n_j',['nⱼ','n_j','n'],'本次样本落在第j箱的恒星数；各箱n_j相加等于固定N。不是数密度。','颗'],
 ['s','可复现抽样种子','s',['s'],'0至999的整数种子；相同斜率、N、种子复原同一伪随机序列，不代表真实星团观测。'],
 ['u','按恒星数目定义的累积分位','u',['u'],'数目CDF的0到1累积概率；m(u)为逆CDF。不是累计质量份额。扫描它只改变检查点，不改变样本。'],
 ['j','质量箱索引','j',['j'],'八个等对数质量箱的索引；每箱宽0.375dex。'],
 ['k','样本恒星索引','k',['k'],'样本中的第k颗恒星；m_k是其初生质量，不是波数。'],
 ['P','每箱数量概率或至少一次概率','P',['P'],'P_j是第j箱的总体数量份额；P_(≥1)为N次抽样至少有一颗超过20太阳质量的概率。需区分下标。'],
 ['p20','指定20太阳质量阈值的数量尾部概率','p_{20}',['p20'],'总体中m>20太阳质量的数量份额，精确积分20到100得到；20不是箱边界或普适反馈门槛。'],
 ['f','初生质量份额','f_{M,j}',['f'],'第j箱质量积分除以全部初生质量积分；带sample上标时用该次样本箱质量除以该次样本总质量。'],
 ['E','独立抽样的理论期望','\\mathbb E',['E'],'对重复抽样的数学期望；E[n_j]=NP_j，不保证一次样本等于期望。'],
 ['sample','当前有限样本','\\mathrm{sample}',['sample'],'公式上标sample表示该种子的有限样本统计，不是连续总体理论。']
])add(a,key,title,tex,aliases,def,unit);
for(const [key,title,tex,aliases,def,unit] of [
 ['psi','瞬时真实形成率','\\psi(t)',['ψ','psi'],'本教学历史在0≤t<D为(1+B)ψ₀，其他时刻为ψ₀。起止点按右连续定义。','M☉/yr'],
 ['psi0','爆发前的稳态形成率背景','\\psi_0',['ψ₀','ψ0'],'固定为1太阳质量每年；数学上已在爆发前达到稳态，两指示率在t<0也等于此值。','M☉/yr'],
 ['hat','归一化核给出的教学指示率','\\widehat\\psi_i',['ψ̂i','ψ̂'],'对同一ψ(t)与K_i卷积。它是时间平均的教学类比，不是实际Hα或UV标定。','M☉/yr'],
 ['short-hat','短记忆教学指示率','\\widehat\\psi_s',['ψ̂s'],'响应时间为t_s的归一化指数核输出；在爆发结束后快速衰减。','M☉/yr'],
 ['long-hat','长记忆教学指示率','\\widehat\\psi_l',['ψ̂l'],'响应时间为t_l的归一化指数核输出；不把有限显示时间误认为完全回到背景。','M☉/yr'],
 ['B','相对背景的额外爆发强度','B',['B'],'爆发额外率为Bψ₀；爆发期间总率为(1+B)ψ₀。B=0保留背景，不是零形成率。'],
 ['D','额外爆发持续时长','D',['D'],'爆发存在于0≤t<D。t=D时瞬时率回到背景，滤波输出连续达峰。','Myr'],
 ['t','相对爆发起点的时间','t',['t'],'t=0开始，t=D结束；带下标的t_i表示核的响应时间而非当前时刻。','Myr'],
 ['ti','核的响应时间','t_i',['tᵢ','ti'],'指数核的记忆时间；i=s为短核，i=l为长核。不是延迟的单一确定值。','Myr'],
 ['ts','短核响应时间','t_s',['tₛ'],'短记忆核的指数衰减时间；范围1到20Myr。与t_l相等时两路完全一致。','Myr'],
 ['tl','长核响应时间','t_l',['tₗ'],'长记忆核的指数衰减时间；范围20到200Myr。','Myr'],
 ['tau','卷积中的回溯年龄','\\tau',['τ'],'从当前时刻向过去回溯的非负时间，形成率取ψ(t−τ)。不是光学深度。','Myr'],
 ['K','归一化指数响应核','K_i(\\tau)',['K'],'K_i(τ)=exp(−τ/t_i)/t_i，τ≥0，面积为1；不是实际SSP谱。','Myr⁻¹'],
 ['ki','单位额外爆发的响应','k_i(t)',['k'],'无量纲分段函数，使指示率等于ψ₀(1+B k_i)。它不是核K_i，二者量纲不同。'],
 ['Ci','累计额外教学响应面积','C_i(t)',['Ci','Cᵢ','C'],'从0到当前时刻对指示率超出背景部分积分，单位为质量，但不是额外的一份恒星质量或气体存量。','M☉'],
 ['Mburst','爆发已额外形成的初生质量','M_{\\rm burst}',['Mburst','M'],'只计算相对持续背景的额外形成部分。以Myr积分M☉/yr时乘10⁶ yr/Myr；未计回流或演化。','M☉'],
 ['i','两条响应核的索引','i',['i'],'取s或l，分别代表短记忆核和长记忆核。'],
 ['s','短核下标','s',['s'],'响应率、时间或核的下标s表示short短记忆；不是第9章的随机种子。'],
 ['l','长核下标','l',['l'],'响应率、时间或核的下标l表示long长记忆；不是光度或角动量。'],
 ['burst','相对背景的额外爆发标记','\\mathrm{burst}',['burst'],'M_burst的下标：只计超过持续背景形成率的额外部分。']
])add(b,key,title,tex,aliases,def,unit);
for(const [lab,key,title,aliases,definition] of [
 [a,'imf','初生质量函数（本实验数量概率约定）',['IMF','初生质量函数'],'描述刚形成恒星的初生质量分布。本实验按恒星数量概率归一；原书式9.33按单位形成质量归一，两者需换算。'],
 [a,'cdf','累积分布函数',['CDF'],'这里为按恒星数量归一的累积概率；其逆函数把分位u映射到初生质量m。'],
 [a,'salpeter','Salpeter幂律',['Salpeter'],'线性质量密度斜率2.35，对数质量密度斜率1.35。本实验把单幂律截断在0.1到100太阳质量，是教学族而非普适低质量IMF。'],
 [a,'dex','十进对数间隔',['dex'],'两个正质量之比的log10差；本实验每箱0.375dex，相邻边界之比为10^0.375。'],
 [a,'xorshift','可复现伪随机序列',['xorshift32'],'本实验使用32位异或移位序列与逆CDF。种子只控制可复现性，不把生成样本当作观测数据。'],
 [b,'sps','恒星族合成',['SPS','SSP'],'SPS用恒星演化与光谱叠加估计星族光；SSP是共生、同一金属丰度的星族组件。本页指数响应只是卷积教学类比，未运行真实SPS。'],
 [b,'kernel','归一化响应核',['响应核'],'给过去形成率分配年龄权重；面积为1确保持续背景的输出等于输入，不代表任何物理气体储存装置。']
])add(lab,key,title,undefined,aliases,definition,'术语','term');
add(b,'eta','Myr到年的时间换算因子','\\eta_t',['ηt'],'数值为10⁶ yr/Myr；与以Myr计的时间及M☉/yr计的率相乘得到M☉。卷积输出的形成率不另乘它。','yr/Myr');
const english={"alpha":"linear-mass IMF slope","m":"initial stellar mass","limits":"sampling mass limits","p":"number-normalized mass probability density","J":"power-law integral","q":"integral exponent","a":"lower integration mass","b":"upper integration mass and bin boundaries","N":"fixed number of sampled stars","n":"sample count in a mass bin","s":"reproducible sample seed","u":"number quantile","j":"mass-bin index","k":"sampled-star index","P":"bin probability and at-least-one probability","p20":"number probability above the chosen mass threshold","f":"initial-mass fraction","E":"sampling expectation","sample":"finite sample","psi":"instantaneous star formation rate","psi0":"steady background rate","hat":"normalized-kernel teaching indicator","short-hat":"short-memory teaching indicator","long-hat":"long-memory teaching indicator","B":"extra burst amplitude","D":"burst duration","t":"time since burst onset","ti":"response time","ts":"short response time","tl":"long response time","tau":"lookback lag","K":"normalized exponential response kernel","ki":"unit-burst response","Ci":"cumulative excess response area","Mburst":"extra initial mass formed","i":"response-kernel index","l":"long-memory index","burst":"extra burst contribution","imf":"initial mass function","cdf":"cumulative distribution function","salpeter":"Salpeter power law","dex":"decimal logarithmic interval","xorshift":"xorshift32 pseudo-random sequence","sps":"stellar population synthesis","kernel":"normalized response kernel","eta":"Myr-to-year conversion factor"};
for(const e of entries){const key=e.id.replace(/^v32-(?:imf-sampling|response-memory)-/,'');e.english=key==='s'&&e.chapters[0]===10?'short-memory index':english[key];}
for(const e of entries)e.definition=e.definition.replaceAll('b_(j+1)',String.raw`\(b_{j+1}\)`).replaceAll('P_(≥1)',String.raw`\(P_{\ge1}\)`).replace(/([A-Za-z]+)_([A-Za-z]+)/g,(_,a,b)=>'\\('+a+'_{'+b+'}\\)');
fs.writeFileSync('content/glossary/population-response-v32.json',JSON.stringify(entries,null,2)+'\n');
const p='content/math/inline-vocabulary.json',v=JSON.parse(fs.readFileSync(p));Object.assign(v.tokens,{'m(u)':'m(u)','p(m)':'p(m)','ψ̂s':'\\widehat\\psi_s','ψ̂l':'\\widehat\\psi_l','ψ̂i':'\\widehat\\psi_i','tₛ':'t_s','tₗ':'t_l','tᵢ':'t_i','Mburst':'M_{\\rm burst}','Ci':'C_i','nⱼ':'n_j','p20':'p_{20}','ηt':'\\eta_t'});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');console.log(entries.length+' scoped definitions.');
