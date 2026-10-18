# 第 9—13 章物理过程配图复核

2026-10-17。本轮新增五组官方观测，采用现有图框、字体、署名、主题及 2×/4× 细节视窗；没有新增装饰风格、生成像素或用照片替代计算图。逐张核对实际图像、发布页与教材主题，确保结构和读图问题相对应。

| 章 / 锚点 | 配图与用途 | 科学边界 |
| --- | --- | --- |
| 9 / individual | HH 30 红外观测，辨认盘面暗带、喷流及更宽的外流/散射星云 | 亮雾不等于均匀电离球；显示色不能直接测温、读盘质量或认定行星 |
| 10 / feedback | 第谷 Ia 型超新星遗迹，连接爆炸反馈与真实高能遗迹 | 明确 Ia 型白矮星热核爆炸与核心坍缩不同；颜色混合多个能段与部分硅线位移信息，不能当统一温度或速度表 |
| 11 / instability | NGC 1300，比较真实恒星棒与模型的非轴对称结构 | 光不等于质量面密度；不能用照片读出 Toomre Q、模式速度或棒质量份额 |
| 12 / clusters | ESO 137-001，比较主体与单侧延展的蓝色尾迹 | 紫外/可见光不是团内热气体密度图；不能把蓝色尾迹整体当作既有恒星盘被剥离，或从照片求冲压 |
| 13 / tests | ESO 381-12，辨认平滑主体外的淡弱恒星壳层 | 明确是透镜状早型星系，不冒充纯椭圆样本；壳层不唯一给出并合质量比、次数或年代 |

本轮保留五个发布方 JPEG 的全部字节、视场、方向与显示色。完整下载地址、图像尺寸、SHA-256、仪器、波段、署名及使用说明记录于 `content/observation-sources.json`；页面数据使用同一记录。单张照片均只作观测图景与模型的对照，不从网页 RGB/像素估计物理参数。新增来源晚于原教材的已标记为观测补充。

原书主题分别对应 §9.4 pp.429–433、§10.5 pp.492–494、§11.5 pp.521–531、§12.5 pp.568–573、§13.3 pp.594–602。图片不是原书插图，也未声称复制原书模拟结果。原 PDF 未修改或上传。

## 官方来源

- ESA/Webb, [Webb investigates a dusty and dynamic disc](https://esawebb.org/images/potm2501a/), 2025-02-04。选用 NIRCam/MIRI 合成，不使用另一个带 ALMA 图层的拼贴图；完整署名 ESA/Webb, NASA & CSA, Tazaki et al.。使用依据：[ESA/Webb CC BY 4.0](https://esawebb.org/copyright/)。
- Chandra, [Tycho X-ray image](https://chandra.harvard.edu/photo/2019/tycho/more.html), 2019-10-17。选用纯 X 射线图层，完整署名 X-ray: NASA/CXC/RIKEN & GSFC/T. Sato et al。颜色含义同时核对[主发布页](https://chandra.harvard.edu/photo/2019/tycho/)；使用依据：[Chandra 图像说明](https://chandra.harvard.edu/photo/image_use.html)。
- ESA/Hubble, [NGC 1300](https://esahubble.org/images/opo0501a/), 2005-01-11。完整署名 NASA, ESA, and The Hubble Heritage Team (STScI/AURA)。
- ESA/Hubble, [ESO 137-001](https://esahubble.org/images/heic1404a/), 2014-03-04。完整署名 NASA, ESA. Acknowledgements: Ming Sun (UAH), and Serge Meunier。
- ESA/Hubble, [ESO 381-12](https://esahubble.org/images/heic1516a/), 2015-07-09。完整署名 NASA, ESA, P. Goudfrooij (STScI)。三组 Hubble 图使用依据：[CC BY 4.0](https://esahubble.org/copyright/)。

## 验证

五组新增观测 × 1440 / 768 / 320px × 深浅两主题，共 30 个状态通过；检查了加载、完整署名、原图放大、2×/4× 显示、键盘滚动、恢复适应窗口、Esc 与焦点返回。逐张查看实际图像，并检查桌面和手机截图。

全书 514 个阅读页在 320px 无横向溢出、数学解析错误或 SVG 数学标签裁切；基线专项的六个状态与长公式滚动检查通过。1194 项正文图解与 14 个原始 JPEG 哈希检查、1505 项 TeX 检查通过。11 组观测的来源清单与页面数据、完整署名匹配；全章节重建幂等。详细记录见 process-observations-validation.json，浏览器脚本与截图在任务 work/observations-v25-qa/。
