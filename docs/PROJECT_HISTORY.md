# GALAXIES · 星系形成与演化

中文交互教材，支持「宇宙余辉」深色与「月白星图」浅色。顶栏右侧切换，当前浏览器记住选择并跨页保持；首次打开默认深色。静态入口：`dist/index.html`。

配色使用共享语义变量与实验绘图色表，SVG 与 canvas 会原位重绘，保留所在阅读页和数值参数。`node scripts/build-themes.cjs` 可单独更新配色资产，完整章节构建也会自动安装。星系图像保留深空曝光背景；Anatomy 仪器保留四层实体明暗。

第 1、4、8、9、10、11、12、13 章开篇包含 8 张 ImageGen 科教插图，包含独立图注、观察线索与原生对话框大图。明确标为 AI 示意，不作为观测或定量模拟。图片位于 `dist/assets/illustrations/`，按 640/960/1536px 提供 WebP；完整提示词、替代文本和生成方式保存在 `content/illustrations.json`。`node scripts/build-illustrations.cjs` 可重建插图嵌入，完整章节构建会自动执行；插图不增加阅读页数。

全书采用主题分页阅读：左侧目录抽屉默认收起，底部前后翻页与页码；讲解、实验、公式及单道理解题分别成页。支持旧锚点、浏览器历史、阅读位置恢复和键盘翻页。布局说明与构建入口见 `docs/reader-layout.md`。

细节复查见 `DETAIL_REVIEW.md`。27个精选实验新增具体任务与可恢复的核对参数，作者源为 `content/lab-guides.json`；共享阅读器将任务传给伴读。公式页可返回实验，长页在底栏提示继续查看，理解题选择可在当前浏览器恢复与清除。增长实验明确D₊、D̂、f与当前物质比例，数学表达式共333条。

- 第 1 章：原创导论、形态观察器、守恒的四组分气体循环、时间尺度计算、历史节点与练习。
- 第 2 章：观测事实，亮度与距离、合成光谱、Sérsic 光度剖面、合成巡天选择，以及 §2.5–2.10 的证据阅读。入口 `dist/chapter-2.html`。
- 第 3 章：宇宙学背景，膨胀格网、Friedmann 组分、红移距离、热历史节点、共动哈勃尺度与四道理解检查。入口 `dist/chapter-3.html`。
- 第 4 章：宇宙学扰动，合成密度场、Jeans 模式、增长因子、Zel’dovich 薄层、BBKS 传递函数，以及相对论与统计导读。入口 `dist/chapter-4.html`。
- 第 5 章：引力坍缩与无碰撞动力学，EdS 球形坍缩、Plummer 轨道、球对称 Jeans 质量约束、二体弛豫时钟、可逆相混合。入口 `dist/chapter-5.html`。
- 第 6 章：探测宇宙密度场，二维成对计数、红移空间映射、点质量透镜、局部剪切与 CMB 宇宙方差。入口 `dist/chapter-6.html`。
- 第 7 章：暗物质晕的形成与结构，8个实验连接一维峰筛选、PS质量函数、首次越障、条件祖先质量份额、峰背景偏置、NFW球壳、200c/200m边界与晕成员配对。入口 `dist/chapter-7.html`。
- 第 8 章：气体晕的形成与演化，9个实验涵盖激波、辐射/Compton冷却、NFW等温气体、浮力、冷却半径、局部热稳定、爆炸与恒功率风泡。入口 `dist/chapter-8.html`。
- 第 9 章：恒星形成，7个实验检查Jeans、维里、磁通、效率、KS、IMF和HII区。
- 第 10 章：恒星族与化学演化，7个实验连接寿命、主序星族、形成史、尘埃和三类化学箱。
- 第 11 章：盘星系，7个页面实验加保留的指数盘/NFW旋转曲线，覆盖盘结构、角动量、频率、局部稳定与缠绕。
- 第 12 章：相互作用与转化，7个实验区分快速加热、潮汐边界、摩擦、轨道衰减与气体供应。
- 第 13 章：椭圆星系，7个实验检查投影、各向异性、中心分辨率、干并合、相空间代理、基本平面和光度加权。
- 第 14 章：活动星系，8个实验覆盖Eddington、薄盘、相对论运动、反响、增长、取向与反馈。
- 第 15 章：星系统计，8个实验连接光度函数、选择、丰度匹配、条件关系、形成率、环境与占据统计。
- 第 16 章：星系际介质，12个实验覆盖透射、电离、21cm、线宽、森林、吸收距离、LLS、中性气体普查与金属温度计。
- 全部16章均开放原创交互导读初版，覆盖原书各主节与精选可解模型；不宣称复刻全部正文、推导或研究级模拟。
- AI 伴读目前生成带参数、出处与模型假设的问题，可复制至 AI 对话；不包含在线模型回答服务。
- 教材原 PDF 未修改、未包含、未上传。原文提取保留在项目之外的本地工作目录。

模型与来源索引见 `dist/content-sources.json`。所有模型为教学简化，页面列出适用范围。

本地运行：在 dist 目录执行 `python3 -m http.server 8765`，打开 http://localhost:8765 。

开发原则：实验数量由章节的物理问题决定，不设“五个实验”的上限。新模型须说明假设、保持公式/动作/读数一致，并通过键盘、手机、离屏暂停和减弱动态检查。

2026-10-16 Anatomy复查：前六章；新增五个有独立学习目标的实验，入口 `dist/experiments.html`。第2章分辨率测试台由63个真形状实体组成，重建命令 `node scripts/build-anatomy.mjs --audit`。Anatomy工具包位于 `vendor/anatomy`，保留MIT许可；生成的SVG和样式放在静态资产中。

第7章独立数值验证：`node scripts/check-halo-physics.cjs`。验证质量积分/边界根、质量函数与首次越障归一化、随机增量统计、质量加权偏置和配对分区。

第8章独立数值验证：`node scripts/check-gas-physics.cjs`。验证激波质量/动量/能量、两类冷却时标、静水剖面、浮力、冷却半径导数、热扰动与爆炸/风泡能量账。

第9–16章的可维护内容位于 `content/chapter-N.json`，执行 `python3 scripts/build-chapters.py` 生成页面、来源与实验索引。独立数值验证：`node scripts/check-advanced-physics.cjs`，包括潮汐能量、质量账、投影积分、薄盘两面光度、累计丰度、光子平衡、等效宽度与ΩHI路径归一化。共享实验控件保存本机参数，并支持重置、键盘、手动推进、减弱动态与离屏暂停。

科学审校：采用作者对第10、11、13、15章的相关勘误；第14章对式14.14独立两面积分得到L=GMṀ/(2Rin)、Rhalf=4Rin，并明确说明与附近文字的不一致。第16章完整范围为pp689–740，附录A始于p741；未将2010年的观测约束冒充当前结果。

2026-10-16 正文配图科学复核：16 章共 32 组图解，当前为 30 组程序科学图解与 2 组真实观测。四组生成场景已用明确公式/几何图替换，另外撤下两张容易误读的概念封面。增长图增加统一色标、背景切换及键盘/指针探针；修正盘投影归一、空间比例与森林平均密度。完整修订见 `docs/figure-science-review.md`；数值检查 `node scripts/check-body-figures.cjs`。

2026-10-16全书Anatomy审查与重写：见 MODEL_AUDIT.md 及 dist/model-audit.html。新增像素积分、有限源透镜、恒星盘零频响应、真实Voigt/生长曲线、有限c恒定源前沿；全书118个公式块改为TeX源与HTML+MathML。新增数值检验：node scripts/check-precision-physics.cjs。

2026-10-16 各章实验与数据图专项优化：复核112个章节交互单元与独立旋转实验。修正有限源透镜像素积分、形成史权重归一、Toomre图域和稳定性措辞、21cm有限光深及示意坐标；常规数据图统一坐标排版，加入放大、SVG导出与键盘坐标探针。完成672个章节屏宽/主题状态、222次首控件端点响应及独立旋转页检查。详见 `docs/interactive-lab-review.md` 和 `docs/interactive-lab-validation.json`。

2026-10-16 数学文字补全：在118个公式块、333条显示公式之外，统一正文、参数、读数、动态说明与图中标注的行内TeX。支持运行时重排、原生选择器数学预览和嵌入字库的SVG导出；详见 `docs/inline-math-review.md`。第10、13章增加内置ImageGen生成的星族/椭圆星系概念图，完整提示词及资产路径保存在 `content/illustrations.json`。

2026-10-17 全书上下文词典：1687条原创释义覆盖16章，含物理符号、术语、缩写、数学记号与单位。正文点线词、公式字形、图表及原生控件的释义入口采用既有双主题；每页可集中查看并检索全书。同字母按章节/节/实验和必要的公式语境区分，保留单位、条件与依据。词典入口 `dist/glossary.html`，作者源 `content/glossary/*.json`，复核 `docs/glossary-review.md`；执行 `node scripts/check-glossary.cjs` 检查。

2026-10-17 语义复审：函数参数、重音/上下标、单位与同字母局部含义进一步分开；修正科学量纲与消光说明。复核见 `docs/glossary-audit-v27.md`，浏览器回归入口 `scripts/check-glossary-browser.cjs`。


本次全书计算、曲线、极端参数与新增实验的说明见 [计算复核 v28](docs/calculation-audit-v28.md)。新增统计与适用条件回归可运行 `node scripts/check-cmb-sampling.cjs` 和 `node scripts/check-calculation-v28.cjs`。

第7、10、14章新增实验与第9、10章配图见 [逐章深化 v29](docs/chapter-expansion-v29.md)。数值验证运行 `node scripts/check-chapter-expansion.cjs`；浏览器回归运行 `PLAYWRIGHT_MODULE=/绝对路径/playwright node scripts/check-chapter-expansion-browser.cjs`。
