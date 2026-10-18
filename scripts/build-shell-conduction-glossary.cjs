const fs=require('fs'),specs=require('../content/shell-conduction-labs-v33.json'),entries=[];
function add(lab,key,title,english,tex,aliases,definition,unit='无量纲',kind='symbol'){entries.push({id:'v33-'+lab.id+'-'+key,kind,chapters:[lab.chapter],contexts:[lab.id+'-lab'],title,english,tex,aliases,definition,unit,scope:'仅按本实验的模型和约定解释；公式页、图表与读数沿用此含义。',source:lab.source});}
const shell=specs[0],thermal=specs[1];
for(const [key,title,en,tex,aliases,def,unit]of [
 ['M','厚球壳总质量','total shell mass','M',['M'],'给定静态厚球壳的全部质量，不等于任意检查半径内的包围质量。','M☉'],
 ['Menc','检查半径内的包围质量','enclosed mass','M(<r)',['M(<r)'],'只积分球心至当前r的质量，等于总质量乘f(x)。空腔内为零。','M☉'],
 ['a','球壳内半径','inner shell radius','a',['a'],'中央空腔的半径，等于qb；q=0时没有有限空腔，退化为实心球。不是宇宙学尺度因子。','kpc'],
 ['b','球壳外半径','outer shell radius','b',['b'],'所有给定质量均位于b以内；图中的长度以b归一，不凭画面大小比较不同参数组。','kpc'],
 ['q','中央空腔的相对大小','cavity ratio','q',['q'],'内半径a除以外半径b，取0到0.9；不是质量比或势。'],
 ['r','检查点或积分的球心距离','spherical radius','r',['r'],"r为当前检查点距离；势积分中的r′是另一积分半径，不是时间导数或空间投影半径。",'kpc'],
 ['x','按外半径归一的检查距离','normalized check radius','x',['x'],'x=r/b。两张定量曲线的横轴与图示检查点使用同一值。'],
 ['rho','壳体中的常体积密度','uniform material density','\\rho',['ρ'],'只指a<r<b的常体积密度。空腔和外部当地密度为零；q=0时实心球中心采用连续极限。','M☉/kpc³'],
 ['f','包围质量份额','enclosed mass fraction','f(x)',['f(x)','f'],'检查半径内质量除以厚球壳总质量。不是分布函数或光份额。'],
 ['g','有符号径向引力加速度','signed radial gravitational acceleration','g_r',['gᵣ','gr','g'],'外向为正，吸引力为负；等于−GM(<r)/r²，球心及空腔内为零。','(km/s)²/kpc'],
 ['Phi','无穷远为零的引力势','gravitational potential','\\Phi',['Φ'],'单位测试质量的势能。来自所有球壳的贡献，空腔内为负常数，外层质量贡献不能遗漏。不是势能总量。','(km/s)²'],
 ['U','正的无量纲势形状','dimensionless potential shape','U(x)',['U'],'由Φ=−(GM/b)U(x)定义；不是体系总势能或内能。'],
 ['G','牛顿引力常数','Newtonian gravitational constant','G',['G'],'本书模型使用4.30091×10⁻⁶ kpc (km/s)²/M☉；密度、半径与速度沿用一致单位。','kpc (km/s)²/M☉'],
 ['escape','测试粒子的逃逸速度','escape speed','v_{\\rm esc}',['vesc'],'取无穷远势为零，sqrt(−2Φ)使粒子最终到无穷远静止。腔内也非零，因为它仍须穿过有引力的壳体。','km/s'],
 ['v','逃逸速率中的速度符号','escape-speed symbol','v',['v'],'本实验公式中的速度只用于带esc下标的逃逸速率，不表示本实验已积分轨道。','km/s']
])add(shell,key,title,en,tex,aliases,def,unit);
for(const [key,title,en,tex,aliases,def,unit]of [
 ['T0','均匀背景温度','background temperature','T_0',['T₀','T0'],'固定为10⁶K，是热平衡背景，不是微波背景温度。','K'],
 ['T','气体温度及其微扰','gas temperature','T',['T'],'T=T₀+δT。模式方程在δT/T₀很小时线性化。','K'],
 ['n0','背景粒子数密度','background particle number density','n_0',['n₀','n0'],'平衡态粒子数密度；用于定义每粒子热容、加热平衡和χ。不是单独的氢核密度。','cm⁻³'],
 ['n','粒子数密度','particle number density','n',['n'],'气体总粒子数密度，固定组成。一阶等压关系为δn/n₀=−δT/T₀。','cm⁻³'],
 ['delta','一阶温度或数密度微扰','first-order perturbation','\\delta',['δ'],'表示相对均匀背景的小变化；δT是有单位的温度改变量，带下标T的δ_T是无量纲温度扰动。'],
 ['deltaT','无量纲温度模式','fractional temperature perturbation','\\delta_T',['δ_T','δT/T₀','δT/T0'],'δ_T=δT/T₀=Aκ cos(2πξ)，不是21cm亮温扰动，也不是密度反差。'],
 ['L0','指定参考长度','reference length','L_0',['L₀','L0'],'固定为100pc；用它归一化波长和热扩散强度。不是光度。','pc'],
 ['tth','指定热时间','thermal time','t_{\\rm th}',['tth'],'本页取100Myr，定义为背景定压热量n₀cpT₀除以背景冷却率C₀。不是等容3/2热时间。','Myr'],
 ['t','自扰动起点的物理时间','physical elapsed time','t',['t'],'t=τtth，演化范围0到200Myr；不是声穿越时间或粒子寿命。','Myr'],
 ['tau','按热时间归一的演化时刻','normalized elapsed time','\\tau',['τ'],'τ=t/tth，取0到2；不是光学深度。'],
 ['alpha','指定冷却系数的温度斜率','cooling coefficient slope','\\alpha',['α'],'Λ(T)∝T^α，须与本页C∝n²及每粒子加热常数Γ的约定一起使用，不是IMF幂律斜率。'],
 ['C','单位体积冷却功率','volumetric cooling power','\\mathcal C',['𝒞','C'],'C=n²Λ₀(T/T₀)^α；C₀为均匀背景值。不是带符号净冷却或定压热容。','erg cm⁻³ s⁻¹'],
 ['H','单位体积加热功率','volumetric heating power','\\mathcal H',['ℋ','H'],'H=nΓ，Γ每粒子保持常数，平衡时Γ=n₀Λ₀。不是哈勃参数。','erg cm⁻³ s⁻¹'],
 ['Lambda','背景冷却系数','background cooling coefficient','\\Lambda_0',['Λ₀','Λ0','Λ'],'Λ₀是T₀下的系数，C₀=n₀²Λ₀；不是宇宙学常数。','erg cm³ s⁻¹'],
 ['Gamma','恒定的每粒子加热率','constant heating per particle','\\Gamma',['Γ'],'本页每粒子加热功率，Γ=n₀Λ₀。不是光电离率；改用别的密度依赖会改变稳定判据。','erg s⁻¹（每粒子）'],
 ['cp','每粒子定压热容','heat capacity at constant pressure per particle','c_{p,\\rm part}',['cp','c_p'],'理想单原子气体为5kB/2；χ分母乘n₀而非质量密度。若按单位质量定义热容才用ρ₀。','erg K⁻¹（每粒子）'],
 ['chi','指定的热扩散率','prescribed thermal diffusivity','\\chi',['χ'],'χ=κ/(n₀cp)，本页为常数、各向同性，不是统计χ²变量。读数pc²/Myr。','pc²/Myr'],
 ['kappa','热传导系数','thermal conductivity','\\kappa',['κ'],'进入热流−κ∇T；χ由它除以单位体积定压热容得到。本页未采用Spitzer标定、磁场各向异性或饱和热流。','erg cm⁻¹ s⁻¹ K⁻¹'],
 ['d','无量纲热扩散强度','dimensionless diffusivity','d',['d'],'χtth/L₀²，范围0到0.05；不是距离微元。χ的物理读数由它换算。'],
 ['k','弧度波数','angular wavenumber','k',['k'],'k=2π/λ。导热衰减项为χk²，不能漏掉2π因子；不是玻尔兹曼常数kB。','pc⁻¹'],
 ['lambda','物理波长及其临界值','physical wavelength','\\lambda',['λ'],'正弦温度模式的一个完整周期长度；λcrit为本页增长率零点，只有α<1才定义。','pc'],
 ['critical','本页增长率为零的临界波长','critical thermal wavelength','\\lambda_{\\rm crit}',['λcrit'],'α<1时等于2π sqrt(χtth/(1−α))。波长更长才增长；d=0时为0，α≥1时没有增长波段，不能把空值写成0。','pc'],
 ['w','按参考长度归一的波长','normalized wavelength','w',['w'],'λ/L₀，范围0.25到4，即25到400pc。'],
 ['sigma','带量纲的线性增长或衰减率','linear modal growth rate','\\sigma',['σ'],'正值增长、负值衰减；σ=s/tth，不是恒星速度弥散或测量误差。','Myr⁻¹'],
 ['s','无量纲线性增长率','dimensionless modal growth rate','s',['s'],'σtth=1−α−4π²d/w²。不是随机种子或短核下标。'],
 ['A','温度模式的相对振幅','fractional mode amplitude','A',['A'],'Aκ为含导热的正振幅，A₀为同一初始扰动的无导热参照；二者用同一显示刻度。'],
 ['Ak','含导热的温度相对振幅','conducting mode amplitude','A_\\kappa',['Aκ'],'ε₀ exp(sτ)，乘cos(2πξ)才是当前位置有符号扰动。百分幅读数乘100。'],
 ['A0','无导热参照的温度相对振幅','nonconducting reference amplitude','A_0',['A₀','A0'],'ε₀ exp((1−α)τ)，只是设同一模式的d=0参照，不是背景温度或初始振幅。'],
 ['epsilon','给定初始相对振幅','initial fractional amplitude','\\epsilon_0',['ε₀','ε0'],'固定为0.001，即0.1%；不是后来时刻的振幅或能量效率。'],
 ['xi','按当前波长归一的检查位置','normalized spatial position','\\xi',['ξ'],'z/λ，屏幕和空间剖面显示0到2，即两个完整波长。不是相关函数。'],
 ['z','模式的空间坐标','spatial coordinate','z',['z'],'ξ=z/λ中的实际空间坐标；不是红移或垂直分层高度。','pc'],
 ['cs','背景绝热声速','background adiabatic sound speed','c_s',['cs','cₛ'],'sqrt(γkBT₀/(μmp))，用于检查等压模式变化慢于声穿越。不是扩散速率。','km/s'],
 ['ts','一个波长的声穿越时间','sound crossing time','t_s',['tₛ','tsound'],'λ/cs；必须以一致长度时间单位换算。t_s|σ|小才支持等压近似，不是第10章的短记忆核时间。','Myr'],
 ['gamma','定压与定容热容比','adiabatic index','\\gamma',['γ'],'理想单原子气体取5/3；不是冷却斜率。'],
 ['mu','指定平均粒子质量因子','mean molecular weight','\\mu',['μ'],'平均每粒子质量为μmp，本实验独立取0.6；与本章其他纯电离氢实验的0.5约定不同。'],
 ['kB','玻尔兹曼常数','Boltzmann constant','k_B',['kB','k_B'],'1.380649×10⁻¹⁶ erg/K；带B下标，不是模式波数k。','erg/K'],
 ['mp','质子质量','proton mass','m_p',['mp','m_p'],'1.67262192369×10⁻²⁴g；μmp给出平均粒子质量。','g']
])add(thermal,key,title,en,tex,aliases,def,unit);
for(const [lab,key,title,en,aliases,def]of [
 [shell,'shell','牛顿球壳定理','Newton shell theorem',['球壳定理'],'严格球对称时，半径内的物质决定当地引力；半径外物质对当地净力为零，但其势贡献不能忽略。'],
 [thermal,'isobaric','等压线性热模式','isobaric linear thermal mode',['等压'],'声穿越远快于模式变化时使用一阶压力平衡；温密反相，有限幅度的二阶压力项被忽略。'],
 [thermal,'conduction','导热的尺度选择','conductive scale selection',['导热'],'本页常数各向同性热扩散对模式产生−χk²的衰减，较短波长衰减更强；不把它等同于磁化真实气体的完整热输运。'],
 [thermal,'fourier','单一Fourier模式','single Fourier mode',['Fourier'],'一个周期正弦/余弦本征模式；本实验只演化振幅，不模拟非线性云团形成。']
])add(lab,key,title,en,undefined,aliases,def,'术语','term');
for(const e of entries)e.definition=e.definition.replaceAll('δ_T',String.raw`\(\delta_T\)`).replaceAll('t_s',String.raw`\(t_s\)`);
fs.writeFileSync('content/glossary/shell-conduction-v33.json',JSON.stringify(entries,null,2)+'\n');
const p='content/math/inline-vocabulary.json',v=JSON.parse(fs.readFileSync(p));Object.assign(v.tokens,{'gᵣ':'g_r','M(<r)':'M(<r)','vesc':'v_{\\rm esc}','tth':'t_{\\rm th}','tsound':'t_s','Aκ':'A_\\kappa','A₀':'A_0','ε₀':'\\epsilon_0','L₀':'L_0','δT/T₀':'\\delta T/T_0','δn/n₀':'\\delta n/n_0','σtth':'\\sigma t_{\\rm th}','𝒞':'\\mathcal C','ℋ':'\\mathcal H'});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');console.log(entries.length+' scoped definitions.');
