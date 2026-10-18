const fs=require('fs'),specs=require('../content/photometry-drift-labs-v34.json'),entries=[];
function add(lab,key,title,english,tex,aliases,definition,unit='无量纲',kind='symbol'){entries.push({id:'v34-'+lab.id+'-'+key,kind,chapters:[lab.chapter],contexts:[lab.id+'-lab'],title,english,tex,aliases,definition,unit,scope:'仅按本实验的模型和约定解释；公式页、图表与读数沿用此含义。',source:lab.source});}
const photo=specs[0],drift=specs[1];
for(const [key,title,en,tex,aliases,def,unit]of [
 ['S','点源总探测计数率','total detected source count rate','S',['S'],'全点源积分后的已探测电子率，不是光度、能量通量或每单位面积的亮度；孔径只接收其f份额。','e⁻/s'],
 ['B','天空探测计数率面密度','detected sky count rate per angular area','B',['B'],'单位平方角秒均匀天空背景的已探测电子率，不是B波段或磁场。','e⁻/s/arcsec²'],
 ['I','高斯点源的计数率角面密度','Gaussian image intensity','I(R)',['I'],'二维圆高斯的面分布，积分整个像面得到S。不能直接把径向曲线的面积当总计数，须乘环面积2πR dR。','e⁻/s/arcsec²'],
 ['R','像面上的积分角半径','image-plane angular radial coordinate','R',['R'],'高斯强度分布中的角距离；小写r是测光孔径的外半径，不是本征物理尺度。','arcsec'],
 ['r','圆形测光孔径的角半径','angular aperture radius','r',['r'],'从点源中心到测光圆边缘的角距离；不是望远镜主镜口径或天体物理半径。','arcsec'],
 ['theta','点像全宽半高','image full width at half maximum','\\theta_{\\rm FWHM}',['θFWHM','θ_FWHM'],'高斯点像一维剖面的全宽半高，等于2sqrt(2ln2)σθ。不是滤光片的波长带宽，也不是半宽。','arcsec'],
 ['sigmaTheta','高斯点像的单轴宽度','Gaussian angular standard deviation','\\sigma_\\theta',['σθ'],'圆高斯每个直角角坐标的标准差；不是二维半光半径或噪声σN。','arcsec'],
 ['k','孔径半径相对于像宽的比例','aperture radius in FWHM units','k',['k'],'k=r/θFWHM，输入范围0.05至3。不是波数或玻尔兹曼常数。'],
 ['f','孔径内的点源光份额','encircled signal fraction','f(r)',['f'],'二维高斯在半径r内的积分，1−exp(−4ln2 k²)。只用于此高斯点源，不等于延展星系光度份额。'],
 ['A','测光孔径角面积','aperture angular area','A',['A'],'πr²，决定孔径内均匀天空期望计数。不表示振幅。','arcsec²'],
 ['Asky','独立空白背景区的角面积','independent background-region area','A_{\\rm sky}',['Asky','A_sky'],'固定为100πθFWHM²，与源孔径不重叠且无源污染；其算术均值用于估计天空。改变孔径时此区不变，改变像宽时随之重定义。','arcsec²'],
 ['a','孔径与背景区的面积比','aperture-to-background area ratio','a',['a'],'A/Asky=k²/100，用它缩放空白背景区计数；不是宇宙尺度因子。'],
 ['t','本次曝光时间','exposure duration','t',['t'],'源和天空计数均与此成正比；忽略饱和与读出噪声时SNR随sqrt(t)增加。','s'],
 ['Nsrc','孔径内的期望源电子计数','expected source counts in aperture','N_{\\rm src}',['Nsrc','N_src'],'St f(r)，为理论均值。不是已减背景后某次随机观测的值。','e⁻'],
 ['Nsky','孔径内的期望天空电子计数','expected sky counts in aperture','N_{\\rm sky}',['Nsky','N_sky'],'BtA，在扣背景后均值被消去，但其散粒方差仍存在。','e⁻'],
 ['Nap','孔径中的随机总计数','random total aperture counts','N_{\\rm ap}',['Nap','N_ap'],'源与天空电子计数之和，均值Nsrc+Nsky。计数服从独立Poisson模型，图上显示均值及理论方差。','e⁻'],
 ['Nbg','独立空白区的随机背景计数','random independent background counts','N_{\\rm bg}',['Nbg','N_bg'],'独立空白背景区总电子计数，均值BtAsky；乘面积比a后才是孔径内天空估计。','e⁻'],
 ['Nest','扣背景后的净计数估计量','background-subtracted count estimator','N_{\\rm est}',['Nest','N_est'],'Nap−aNbg，其均值为Nsrc；有限背景区使方差额外增加Nsky a。','e⁻'],
 ['sigmaN','净计数估计量的理论标准差','net-count standard deviation','\\sigma_N',['σN'],'净计数方差的平方根；源、孔径内天空、独立天空均值估计三项方差相加，不能先相加标准差。','e⁻'],
 ['sigma','带下标的标准差','standard deviation symbol','\\sigma',['σ'],'本页σθ是高斯像宽、σN是净计数噪声，两者单位与对象不同；请结合完整下标。','见下标'],
 ['thetaBase','点像角宽符号','angular-width symbol','\\theta',['θ'],'本页用于带FWHM下标的点像宽度或σθ下标；不是光谱波长带宽。','arcsec'],
 ['N','计数符号','electron count symbol','N',['N'],'由完整下标区分源、天空、总孔径和背景区域等计数，不能互换。','e⁻'],
 ['kopt','本页范围内的最佳孔径','maximum-SNR aperture in allowed range','k_{\\rm opt}',['kopt'],'在0.05≤k≤3内最大化有限背景区SNR的孔径比例，数值求解；按钮选最近步长，不将最优解四舍五入后用于曲线。'],
 ['second','秒','second','\\mathrm s',['s'],'本页计数率与曝光中的s表示秒，不是增长率或源计数率S。','s'],
 ['arg','使信噪比最大的自变量','argument of maximum','\\arg',['arg'],'arg max选择使函数最大的孔径比例k；max是函数的最大值，两者不同。'],
 ['expectation','随机量的期望值','statistical expectation','\\mathbb E',['𝔼'],'本测光实验表示多次独立计数的平均期望，不是能量或第3章的无量纲膨胀率E(z)。','与被平均量相同'],
 ['SNR','信噪比','signal-to-noise ratio','\\mathrm{SNR}',['SNR','信噪比'],'期望源计数Nsrc除以扣背景后估计量的标准差σN。未加入实际观测系统误差。']
])add(photo,key,title,en,tex,aliases,def,unit);
for(const [key,title,en,tex,aliases,def,unit]of [
 ['z','首次观测的宇宙学红移','initial cosmological redshift','z',['z'],'同一共动源在首次观测时的红移，范围0至5；红移变化Δz及漂移率ż是另外两个量。'],
 ['zdot','相对观测者时间的红移漂移率','redshift drift rate','\\dot z',['ż'],'dz/dt₀=(1+z)H₀−H(z)。正值表示同一源随后红移变大；不是z本身或本动速度。','yr⁻¹'],
 ['deltaZ','两次观测的红移差','redshift change between observations','\\Delta z',['Δz'],'一阶近似żΔt₀，不等于首次观测红移z；在漂移零点附近应比较绝对误差。'],
 ['deltaV','光谱速度单位的漂移','spectroscopic velocity drift','\\Delta v',['Δv'],'定义为cΔz/(1+z)，读数用cm/s；不是星系真实本动速度变化或总退行速度。','cm/s'],
 ['c','真空光速','speed of light in vacuum','c',['c'],'计算时取299792.458km/s，再乘10⁵换成cm/s。不是浓度参数或热容。','cm/s'],
 ['v','光谱漂移的速度符号','spectroscopic velocity symbol','v',['v'],'只以Δv组合出现在本页，不用于推断真实空间速度或位移。','cm/s'],
 ['a','宇宙尺度因子','cosmic scale factor','a',['a'],'共动距离乘它得到适当距离；红移关系使用观测端与发射端两时刻的尺度因子之比。不是第2章的面积比。'],
 ['t0','观测者的宇宙时间','observer cosmic time','t_0',['t₀','t0'],'本页观察端时间，ż对它求导；下标0标示本次首次观测处的当前值。','yr'],
 ['te','发射端的宇宙时间','emitter cosmic time','t_e',['te'],'给定共动源所发光的发射时刻。两次发射的间隔在一阶为Δt₀/(1+z)。','yr'],
 ['deltaT0','观测者两次接收的间隔','observer time baseline','\\Delta t_0',['Δt₀','Δt0'],'观察端等待1至30年；不是发射端间隔，也不是宇宙回望时间。','yr'],
 ['deltaTe','两次相应发射的间隔','corresponding emission-time interval','\\Delta t_e',['Δte'],'一阶为Δt₀/(1+z)，两行时间示意用同一年的线性刻度。','yr'],
 ['t','宇宙时间符号','cosmic time symbol','t',['t'],'结合0、e下标区分观测端与发射端；本页几十年变化用首次观测处的一阶导数。','yr'],
 ['H0','首次观测处当前哈勃参数','current Hubble parameter','H_0',['H₀','H0'],'输入单位km/s/Mpc，计算漂移前除以每Mpc的千米数换成s⁻¹；不是无量纲h。','km/s/Mpc'],
 ['H','给定红移处的哈勃参数','Hubble parameter at redshift','H(z)',['H'],'H₀E(z)，是发射时刻的宇宙膨胀率；不是本次观测几十年里H₀的直接差。','km/s/Mpc'],
 ['E','无量纲膨胀率','dimensionless expansion rate','E(z)',['E'],'H(z)/H₀，由本页物质和Λ背景给出；不是能量或统计期望算子。'],
 ['matter','当前物质密度参数','current matter density parameter','\\Omega_{m,0}',['Ωm,0'],'物质密度除以当前临界密度，本页取0.05至1。包含全部无压物质，不只重子。'],
 ['Lambda','当前宇宙学常数密度参数','current cosmological-constant density parameter','\\Omega_{\\Lambda,0}',['ΩΛ,0'],'为保持平直并忽略辐射，本页取1−Ωm,0；不是冷却函数。'],
 ['Omega','宇宙学密度参数符号','cosmological density parameter symbol','\\Omega',['Ω'],'完整下标m,0或Λ,0分别表示当前物质和宇宙学常数密度参数；本页无曲率或辐射项。'],
 ['LambdaBase','宇宙学常数','cosmological constant','\\Lambda',['Λ'],'本页代表真空能宇宙学常数，物态方程w=−1；不是热冷却系数。'],
 ['q0','当前减速参数','current deceleration parameter','q_0',['q₀','q0'],'本页平直物质+Λ给出1.5Ωm,0−1，负值为当下加速。不是整个历史的常数，也不是漂移零点红移。'],
 ['q','减速参数符号','deceleration-parameter symbol','q',['q'],'本页仅使用当前q₀；不是球壳空腔比例。'],
 ['zero','正的非零漂移零点','positive nonzero redshift-drift root','z_\\star',['z⋆'],'仅0<Ωm,0<2/3时存在的正根；不是所有模型都有，也不是宇宙加速转变红移。超出0至5时显示域外，不能夹到5。'],
 ['Delta','两次观测量之差','finite observational difference','\\Delta',['Δ'],'与z、v、t结合分别表示红移差、光谱速度漂移、时间间隔。不是拉普拉斯算子。']
])add(drift,key,title,en,tex,aliases,def,unit);
for(const [lab,key,title,en,aliases,def]of [[photo,'PSF','点扩散函数','point-spread function',['PSF','点扩散函数'],'点源在像面上的归一化二维分布；本页理想化为圆高斯，真实大气或仪器常有不同翼部。'],[photo,'FWHM','全宽半高','full width at half maximum',['FWHM','全宽半高'],'此实验特指高斯点像一维剖面的角宽，不是光谱线或滤光片带宽。'],[photo,'Poisson','泊松计数噪声','Poisson counting noise',['Poisson','泊松'],'独立离散电子计数的方差等于其期望计数值；量纲完整写法含单电子计数单位。这里以电子数的数值使用。'],[drift,'FLRW','均匀各向同性宇宙模型','Friedmann–Lemaître–Robertson–Walker model',['FLRW'],'本页使用平直、物质+宇宙学常数的背景；共动源没有额外本动加速度。'],[drift,'drift','红移漂移','redshift drift',['红移漂移'],'同一共动源随观察者时间的红移变化，不是比较不同源的红移。由两端的膨胀率差共同决定。']])add(lab,key,title,en,undefined,aliases,def,'术语','term');
for(const e of entries)if(e.contexts[0]==='aperture-noise-lab')e.unit=e.unit.replaceAll('e⁻','电子');
fs.writeFileSync('content/glossary/photometry-drift-v34.json',JSON.stringify(entries,null,2)+'\n');
const p='content/math/inline-vocabulary.json',v=JSON.parse(fs.readFileSync(p));Object.assign(v.tokens,{'θFWHM':'\\theta_{\\rm FWHM}','σθ':'\\sigma_\\theta','σN':'\\sigma_N','Nsrc':'N_{\\rm src}','Nsky':'N_{\\rm sky}','Nap':'N_{\\rm ap}','Nbg':'N_{\\rm bg}','Nest':'N_{\\rm est}','Asky':'A_{\\rm sky}','kopt':'k_{\\rm opt}','ż':'\\dot z','Δz':'\\Delta z','Δv':'\\Delta v','Δt₀':'\\Delta t_0','Δte':'\\Delta t_e','z⋆':'z_\\star','Ωm,0':'\\Omega_{m,0}','ΩΛ,0':'\\Omega_{\\Lambda,0}'});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');console.log(entries.length+' v34 scoped definitions.');
