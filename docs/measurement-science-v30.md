# v30：谱线卷积与局部 beam smearing 科学审查

## 教材与一手资料

- **第13章**：MBW (2010) §13.1.1 *Observables*，印刷p.575（PDF p.597），式13.2定义归一化LOSVD，式13.3–13.4介绍Gaussian基线及Gauss–Hermite偏离；该页明确以恒星吸收线谱分析LOSVD。§13.1.3印刷pp.577–578讨论吸收线运动学及旋转／弥散。依据本地 `work/chapter-13-source.txt`。
- **第11章**：§11.1.2 *Rotation Curves*，印刷pp.499–501（PDF pp.521–523）；p.501指出有限空间分辨率可使测得的内部旋转曲线较真实曲线平缓。依据 `work/chapter-11-source.txt`。这里的局部线性速度梯度解析模型属于网页新增推导，不是书中现成方程。
- [ESO XSL DR2官方说明，PDF第6页](https://www.eso.org/rm/api/v1/public/releaseDescriptions/150)：以Gaussian速度线型的FWHM/σ换算重估谱分辨率，并使用R=c/FWHM；[UVES官方分辨率说明](https://www.eso.org/observing/dfo/quality/UVES/qc/resolution_qc1.html)以弧灯谱线Gaussian拟合的FWHM定义R。
- [作者维护的pPXF文档，sigma_diff](https://pypi.org/project/ppxf/)区分星系仪器LSF与模板仪器LSF的差方差；不能把已经过仪器展宽的模板再次当作纯本征谱。[Cappellari (2017)原始论文](https://arxiv.org/abs/1607.08538)讨论LOSVD卷积、对数波长采样与低弥散提取。仪器分辨率不是“低于该宽度一律不可测”的硬物理截止，实际限制还取决于S/N和LSF／模板校准。
- [Davies等(2011)原始论文](https://arxiv.org/abs/1108.0285)研究未分辨速度梯度导致的额外弥散及空间、光谱卷积前向建模；[Graham等(2018)，Appendix C](https://academic.oup.com/mnras/article/477/4/4711/4919618)给出PSF下表面亮度加权的一、二阶速度矩卷积。下文的常亮度、线性梯度闭式是对这些一般原理的独立简化推导。

## 第13章：三重Gaussian卷积

速度坐标u=v−v0，假设窄波段、非相对论Doppler、常分辨率和常连续谱。定义单位面积Gaussian：

\[
G_\sigma(u)=\frac{1}{\sqrt{2\pi}\sigma}\exp\!\left(-\frac{u^2}{2\sigma^2}\right).
\]

σStar为Gaussian LOSVD弥散，σTemplate为**未含仪器LSF的本征模板线宽**，仪器LSF也是Gaussian。R必须注明按**FWHM**定义：

\[
\sigma_{\rm inst}=\frac{c}{2\sqrt{2\ln2}\,R},\qquad
\sigma_{\rm obs}^2=\sigma_\star^2+\sigma_{\rm template}^2+\sigma_{\rm inst}^2.
\]

三卷积核各自归一到1，故卷积保持缺额面积。令EWv为**有速度单位**的吸收等效宽度（不是“面积为1”的无量纲量）：

\[
F(v)=1-\mathrm{EW}_v G_{\sigma_{\rm obs}}(v-v_0),\qquad
D_{\rm center}=\frac{\mathrm{EW}_v}{\sqrt{2\pi}\sigma_{\rm obs}},\qquad
\int(1-F)\,dv=\mathrm{EW}_v.
\]

F的连续谱归一到1。对固定λ0及小速度，`EWλ≈(λ0/c)EWv`；这里不计算跨宽波段、非平坦连续谱或饱和光深的真实辐射输运。

**输入的物理约束**：如果本征模板本身也代表物理吸收谱，须 `0≤EWv≤sqrt(2π)σTemplate`。否则模板线心F<0，即使后续仪器展宽令观察谱变正，原始模型依然不成立。不得把F钳至0后继续宣称等效宽度保持。推荐固定EWv并选择对全部模板宽度都有效的值，或在无效组合中明确报告该约束。σTemplate=0而EWv>0也不构成有限深度的吸收模板。

**模板LSF的区别**：若σTemplate改为实测模板的宽度，且模板仪器宽度为σInstTemplate，则应使用 `σObs²=σStar²+σTemplateMeasured²+σInstGalaxy²−σInstTemplate²`；这是另一种输入定义。本轮建议保持“模板本征线宽（未含仪器）”这个清楚的约定。

### 校准反演

\[
q=\sigma_{\rm obs}^2-\sigma_{\rm template,cal}^2-\sigma_{\rm inst,cal}^2.
\]

q>0才显示 `σStar,inferred=sqrt(q)`；q<0提示校准／该理想模型不相容；q=0是零弥散边界，不能检出正的本征弥散。后两者都应显示“无正值反演／边界”，**不能把反演结果显示成测得的0，也不能画虚数**。允许仅将机器舍入量级的q识别为边界，保留原始差方差供解释。无噪声输入时也不要杜撰置信区间或上限。

LSF主导时，微小校准误差会被差方差放大。例：真σStar=20、σTemplate=25km/s、R=2000，改用Rcal=1500会使q<0；Rcal=3000会高估本征弥散。低于σInst的正q本身仍可有数学解，不应无条件宣判不可测。

### 显示与验证

各条线使用同一个EWv，增加宽度应降低深度、保持面积，线心不漂移。图的横域随最宽线的翼扩展；为窄模板单独增加采样点，并加入v0与每条线±σ节点，避免在低R时把窄线画成单个尖点。EW读数应按完整模型积分，不能未经说明仅积分当前画幅。Gaussian总FWHM为 `2sqrt(2ln2)σObs`，不得把σ当作FWHM。

## 第11章：局部速度梯度＋Gaussian PSF

坐标x是源平面的一个投影方向，y是成像后的观测坐标，使用同一长度单位（例如kpc）；v(x)=v0+g x为**视向速度**，g单位km/s/kpc。局部面亮度恒定、线型本征宽度σ0恒定，空间PSF在此方向的标准差为s。若控件输入seeing FWHM，应先除以2sqrt(2ln2)转成s。

对观测中心的无穷小孔径，源位置权重是Gaussian X~N(0,s²)，于是视向速度随机变量为 `V=v0+gX+E`，E~N(0,σ0²)，且E独立于X：

\[
a^2\equiv\sigma_0^2+(gs)^2.
\]

因此w=0的完整线型是Gaussian G_a，平均值v0，方差a²。

### 有限孔径必须定义在观测坐标

对**PSF卷积后的观测坐标y**，再积分中心对称、全宽w的top-hat孔径 `−w/2≤y≤w/2`。局部亮度恒定使y在该积分内均匀；真实源位置等价于 `X=Y+Z`，Y~Uniform(−w/2,w/2)、Z~N(0,s²)独立：

\[
\sigma_{\rm eff}^2=\sigma_0^2+g^2\left(s^2+\frac{w^2}{12}\right).
\]

这不等于“将源平面的Gaussian PSF截断在±w/2”。后一种截断Gaussian的方差不是s²+w²/12，不能混用。

令 `B=|g|w/2`，Φ为标准正态CDF。a>0、B>0的**完整归一化线型**为：

\[
p(v)=\frac{\Phi[(v-v_0+B)/a]-\Phi[(v-v_0-B)/a]}{2B}.
\]

它是Gaussian与速度区间[−B,B]上均匀分布的卷积。均值仍v0，方差为a²+B²/3，面积为1。w>0且g≠0时一般**不是Gaussian**。若显示 `2.355σEff`，只能称“同二阶矩Gaussian的等效FWHM”；不是真实线型的FWHM。可将真正profile与同方差Gaussian虚线并列，对比孔径主导时的平顶形状。

一个可检验的非Gaussian特征为超额峰度：

\[
\gamma_2=-\frac{2B^4}{15(a^2+B^2/3)^2}.
\]

B≫a时趋向均匀分布的−1.2。它不是负方差或数值错误。

### 窄极限与退化分支

- B=0（g=0或w=0）且a>0：直接返回Gaussian，禁止计算CDF差／0。
- B/a很小时，用稳定小B展开或数值核积分；令z=(v−v0)/a、h=B/a，`p=G_a[1+h²(z²−1)/6+h⁴(z⁴−6z²+3)/120+…]`。该展开必须只在小h使用。
- CDF同侧大尾部的相减易丢精度，采用erfc生存函数差；不能将所有远翼直接裁为负／0后仍宣称精确归一。
- a=0、B>0：纯top-hat（端点单值对积分无影响，可用Gaussian极限的半高值）。
- a=B=0：Dirac单线，无有限峰高；不要生成NaN／Infinity作为可绘密度。

**适用性与图像含义**：这里只包含一维局部、恒亮度、无边界、线性视向速度场和同宽本征线，不是全星系自洽转动模型。真实亮度梯度、非线性速度场、PSF翼、遮挡、盘厚、有限边界会改变权重与形状。极大g、s、w可能超出“局部线性”近似的空间范围，数值有限不保证可解释为真实星系。

尤其注意：在这个无限、均匀亮度、精确线性速度场中，对称PSF／孔径会**增宽谱线，但平均速度仍为v0，平均速度场的梯度仍为g**。不能借此实验画出内部旋转曲线被压平；教材p.501的一般有限分辨率效应需要曲率、亮度变化或边界等额外因素。本轮g已经是投影梯度，不再额外乘sin i。

## 独立数值基准与验收

同目录 `convolution-reference.json` 提供8个光谱案例与10个beam案例，含负差方差、零边界、低／高R、模板负通量、孔径主导、PSF主导、g反号、极窄孔径、纯top-hat及Dirac极限。全部由独立Python标准库生成，未导入仓库模型。

- Gaussian观察谱直接密集积分检查缺额面积和二阶矩。
- beam完整profile在 `±(B+12a)` 直接积分归一与二阶矩。
- 另从源坐标积分：`p(v)=∫W(x)G_sigma0(v−v0−gx)dx`，其中 `W(x)=[Φ((w/2−x)/s)−Φ((−w/2−x)/s)]/w`，与速度空间CDF闭式独立比较。该检查能捕捉把孔径放错平面的错误。
- g改号应保持对称profile与σEff不变；v0只整体平移；g=0时s和w不再增宽；w→0应连续回到a；各方差项的单位必须一致。
- 曲线、读数和仪器图示全部读取同一模型结果；展示“方差组成”时用σ²的条长，不能误用σ的条长再宣称可直接相加。
