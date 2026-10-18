# 全书交互模型与数学排版审查 · 2026-10-16

范围：16章、独立旋转实验、原110项实验与图解及配套交互。采用 Anatomy 的 truth first：检查计算、图形、动作、读数与假设是否相符。源码/数值审查覆盖全部章节；浏览器遍历全部章节和公式，针对改变的测量和场景补充实际操作与截图。本轮新增3项实验，索引共113项实验与图解。“通过”仅指声明的模型内一致，不等于研究级模拟或对实际星系的精确预测。

已修复：恒定气体流入把Z/y误作质量份额的画法；年轻星族空画布；透射混合比例缺少曲线反馈；低质量比潮汐半径被视觉下限夸大；飞掠示意不随模型变化；摩擦大质量比缺少当前失效提示；离散占据数被画成连续折线；探针只检查横轴是否越界；旧章节与旋转页连续播放不统一遵守减弱动态；第5章旧实验数与旋转页“待编写”文案。

本轮精确度提升：

- 第2章：63实体Anatomy台改为Gaussian CDF的像素边界积分，展示±8角秒窗口收集率和损失，固定曝光色标。
- 第6章：有限Gaussian源宽度成为控件；同一源宽同时驱动表面亮度图和完整源面通量积分。有限源放大率与中心点源参照并列。
- 第11章：增加无碰撞恒星盘零频响应，显式计算reduction factor；寻峰得到临界系数3.358282953947≈3.36。不是复数增长率或全局棒判据。
- 第16章：将Doppler-only线升级为真正Voigt卷积，分开绘图区和等效宽度积分域；加入自然宽度、解析远尾和独立生长曲线实验。
- 第16章：增加恒定源的有限c R型前沿，解单调隐式方程，而非把原半径钳为ct。关灯旧模型改称“锐边界等效体积闭合”，没有冒充因果关灯辐射输运。

保留经核对的简化：EdS无压坍缩、固定Plummer势、低重子BBKS、单区气体/化学箱、局部薄盘、SIS摩擦、Gaussian投影、同源干并合、合成族群与森林等。没有用无数据的复杂函数假装精确模型。旋转Bessel表独立4001点对照的速度误差低于0.0038%，保留并记录精度。

数学：118个公式块、333个TeX表达式；KaTeX 0.19.0在构建时输出HTML+MathML，字体本地托管。长式在自身区域横向滚动，保留键盘可达性；修复第7章未转义的 `<r`。TeX源在content/math/legacy.json及各章formulaTex；运行python3 scripts/build-chapters.py，随后可独立运行node scripts/build-math.cjs。

验证：

- node scripts/check-precision-physics.cjs：497项检查，含65位mpmath独立Voigt/I0e参考、等效宽度独立积分、像平面通量积分、光子收支、归一化和极限。参考表由本地独立程序生成，Python参考库不部署。
- node scripts/check-advanced-physics.cjs：更新后的参数端点、有限曲线与独立守恒/投影/积分检查。
- Anatomy build audit：63个真实实体，几何/支撑/深度等问题为0；深浅参考页线端均0/136悬空。
- 浏览器核查全部16章及旋转页的数学、390/320布局、来源、参数保存和伴读；修改后的控件、场景、图表分别进行操作检查。

主要依据：MBW本地只读原书及作者勘误；恒星盘§11.5.2 pp.524–525（书页在本地核对）；[Weideman 1994](https://epubs.siam.org/doi/10.1137/0731077)；[NIST氢原子数据](https://srd.nist.gov/NSRDS/NSRDS-NBS4.pdf)；[Shapiro等2006](https://arxiv.org/html/astro-ph/0507677)；[KaTeX官方文档](https://katex.org/docs/browser)。原书PDF不修改、不上传。

修复前的逐实验审查记录（结论状态以本报告为准）：[第1–6章](docs/audits/chapters-1-6-before.md)、[第7–11章与旋转页](docs/audits/chapters-7-11-before.md)、[第12–16章](docs/audits/chapters-12-16-before.md)。

后续教学细节复查：见[DETAIL_REVIEW.md](DETAIL_REVIEW.md)。新增27项精选实验任务与核对参数，补全增长归一化和读数释义；本轮没有替换物理模型。

最新各章交互与数据图复核见 [interactive-lab-review.md](docs/interactive-lab-review.md)：修正21cm有限光深、形成史解析归一和非均匀采样、Toomre完整不稳定区、有限透镜像素面积积分，以及盘厚/衰减示意的坐标一致性。浏览器覆盖112个章节单元与独立旋转页，672个章节组合状态和222次首控件端点响应无异常；结果与明确测试范围见 [interactive-lab-validation.json](docs/interactive-lab-validation.json)。

行内数学与位图补充审查：此前公式块之外的参数/读数/正文/动态注记存在普通文本数学，现共用本地TeX排版。中性普查求和记号、各类下标与单位同步校正；新增第10/13章概念位图，保留定量图。参见 [inline-math-review.md](docs/inline-math-review.md)。
