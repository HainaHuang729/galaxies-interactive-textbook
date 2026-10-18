# 观测配图补齐与科学复核

2026-10-17。复查全书 16 章的配图用途，新增四组真实观测产品。现有 30 组程序模型与几何图、12 幅生成示意继续使用；观测从 2 组增至 6 组，共 9 个原始 JPEG。覆盖表见 `chapter-visual-coverage.md`。

| 章节与位置 | 新增内容 | 需要读者区分的量 |
| --- | --- | --- |
| 3 · thermal | Planck 2013 微波背景温度全天图 | 天球投影不表示宇宙外形；处理后的温度场不等于原始三维密度场 |
| 6 · lensing | 宇宙马蹄的 Hubble WFC3 观测 | 蓝色弧为背景源的像，不是物质环；真实延展透镜与理想点质量实验不同 |
| 7 · structure | 子弹星系团光学、X 射线与透镜质量合成 | 粉色编码热气体 X 射线发射，蓝色是重建的投影总质量，不是暗物质直接成像 |
| 15 · environmental-dependence | 后发座星系团局部 Hubble ACS 视场 | 单幅局部照片不是成员目录或完备样本，不能直接计算红色比例或淬火效率 |

四幅均已逐张查看实际图像；宇宙马蹄位于整幅图右侧偏下，图注据此给出定位提示。保留发布方全部 JPEG 字节、显示色、方向和视场，不裁剪、不增画、不套主题色滤镜。下载 URL、原始像素尺寸、精确署名、SHA-256 和使用依据保存在 `content/observation-sources.json`；网页复用相同记录。Planck 观测发布晚于原教材，已明确标为主题补充，没有把 2013 年结果写成 2010 年教材内容。

## 来源

- ESA, [Planck CMB](https://www.esa.int/ESA_Multimedia/Images/2013/03/Planck_CMB), 2013-03-21；ESA and the Planck Collaboration；教育用途按 [ESA 使用说明](https://www.esa.int/ESA_Multimedia/Terms_and_conditions_of_use_of_images_and_videos_available_on_the_esa_website)署名。
- ESA/Hubble, [Hubble captures a lucky galaxy alignment](https://esahubble.org/images/potw1151a/), 2011-12-19；ESA/Hubble & NASA；[CC BY 4.0 使用说明](https://esahubble.org/copyright/)。
- Chandra, [1E 0657-56](https://chandra.harvard.edu/photo/2006/1e0657/), 2006-08-21；完整 X 射线、光学及透镜图署名直接显示在图片下方；[Chandra 图像说明](https://chandra.harvard.edu/photo/image_use.html)。
- ESA/Hubble, [The Coma Galaxy Cluster as seen by Hubble](https://esahubble.org/images/heic0813a/), 2008-06-10；完整 Hubble Heritage 与 Coma ACS Treasury 署名直接显示在图下方；[CC BY 4.0 使用说明](https://esahubble.org/copyright/)。

## 显示与交互

沿用既有深浅主题、衬线图标题与无衬线图注，署名单独成行并链接发布方。观测温度产品和质量反演有各自类型标签。单图保留完整宽高比，多波段对照保留原来的切换与并列方式。放大窗口保留署名链接，并提供适应窗口、2×、4×显示和可滚动的细节视窗；这只是显示倍率，不是角尺度或物理标尺。

书目与署名文字排除自动数学解析，原图与公式字体均不改写。图解索引数量从数据计算，继续按章节列出 36 组图解与观测。

复核还发现自动数学排版可能把 F475W、F814W 这类滤镜名称解释成幂，或把 B/V 波段标签解释成分式。本轮将观测图的仪器与波段名称、署名及显示倍率明确作为文字标签保留；真正的变量、方程和图表坐标仍沿用 KaTeX。

## 最终验证

- 6 组观测 × 1440 / 768 / 320px × 深浅两主题，共 36 个显示状态通过；每组均检查原图加载、完整署名、无横向溢出、2× / 4× 放大、键盘滚动、恢复适应窗口、Esc 关闭和焦点返回。
- 全书 509 个阅读页在 320px 检查，无页面横向溢出、KaTeX 解析错误或数学 SVG 标签越界。
- 1189 项正文图解与 9 个原始 JPEG 哈希检查、1505 项 TeX 记号检查通过；6 组来源记录与页面署名一致。
- 滤镜 F475W / F814W 的原始文字显示及手机 4× 透镜弧细节另行检查通过。
- 全章节重建幂等，git diff --check 通过。结果见 observations-expansion-validation.json；截图与浏览器脚本保留在任务 work/observations-v23-qa/。
