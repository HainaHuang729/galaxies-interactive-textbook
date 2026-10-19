# GALAXIES · 星系形成与演化

**欢迎所有人免费下载、学习、Fork 和参与改进。**

一部中文交互教材：从星系观测、宇宙学与引力动力学，到恒星形成、星系演化和星系际介质。以 Mo、van den Bosch 与 White 的 *Galaxy Formation and Evolution*（2010）为知识参考，原创编写导读、图解与教学模型。

[在线阅读](https://galaxies-observatory.xiaoxuesheng729.chatgpt.site/) · [下载离线阅读包](https://github.com/HainaHuang729/galaxies-interactive-textbook/releases/latest/download/galaxies-offline.zip) · [下载源码 ZIP](https://github.com/HainaHuang729/galaxies-interactive-textbook/archive/refs/heads/main.zip) · [制作下一本书](docs/BOOK_PRODUCTION_WORKFLOW.md) · [参与贡献](CONTRIBUTING.md)

## 这是什么

- 16章原创交互导读初版，包含可调物理实验、定量图表、观察图景、练习与学习记录。
- 统一的深色“宇宙余辉”与浅色“月白星图”；分页阅读与可收起的顶部左侧目录。
- LaTeX/KaTeX公式、图表取样和SVG导出；按章节与实验语境区分符号释义，目前2005条。
- 公式、曲线、读数和可视化共用计算模型；显式列出单位、初边值、近似与适用范围。
- 程序科学图解、Anatomy仪器示意、官方观测与AI概念插图分别标注。AI插图不充当观测数据或定量曲线。
- 伴读功能生成包含当前参数、出处与假设的问题，供复制到AI对话；**没有内置在线模型回答服务，不需要API密钥**。

这是原创学习辅助项目，**不含原教材PDF、扫描页或提取正文，也不代表原书作者或出版社的官方版本**。各章是导读与精选可解模型，不宣称覆盖原书全部推导或达到研究级模拟精度。

## 下载后运行

阅读只需要Python 3.9+和现代浏览器。离线包已包含JavaScript、图像与数学字库，不需要安装Node或联网下载依赖。

1. 下载并解压上面的 `galaxies-offline.zip`。
2. 在解压目录运行：

```bash
python3 start.py
```

Windows可使用 `py start.py`。浏览器自动打开 `http://127.0.0.1:8765/`；按Ctrl+C结束。若端口被占用：`python3 start.py --port 8766`。不要直接双击HTML，以免浏览器对本地文件的限制影响交互。外链论文、官方图像页面与GitHub下载需要网络。

第三方图像保留独立许可；ESA Standard Licence的Planck观测图在公开下载中仅提供官方链接，不随包再分发。其他素材出处与完整署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 开发与验证

本地实验增强：在带滑块的章节页面点击右侧“实验工具”，打开“参数扫描与读数对照”侧栏，可在侧栏直接调整所选参数，先记录读数，再改变参数比较差值。关闭侧栏会停止扫描；同一页重新打开仍保留记录，翻页自动收起。可用“恢复记录参数”回到已记录的滑块设置，或“导出对照 CSV”保存参数、两组读数及差值。记录只在本次页面打开期间保留；恢复范围为滑块和下拉选项，不记录播放状态或其他按钮状态。

本机开发可运行 `npm start`，然后访问 `http://127.0.0.1:8765/`。保持服务器运行，在另一个终端执行 `npm run test:workbench`，检查恢复参数、扫描中断、CSV 下载以及两种主题的桌面与手机布局；默认使用系统 Edge，可通过 `PLAYWRIGHT_CHROMIUM_CHANNEL` 选择已安装的其他浏览器。

第 11 章指数盘实验另用新安装的 `interaction` 技能增加半径框选联动：在累计质量曲线上拖选区间，同时高亮场景中的圆环，显示它占整张盘的质量比例。支持边界数值、预设、键盘左右平移与 Esc 清除；改变盘尺度会同步更新物理半径。`npm run test:disk-brush` 用独立面积积分验证质量份额，并检查真实拖拽、重绘中断、触摸、键盘及两主题三视口布局。范围与限制见 `docs/disk-brush-review.md`。

全书已扩展新技能的交互方法：[探索入口](dist/experiments.html#discovery) 提供 16 章的推荐任务。已登记曲线的图表增加可开关的“区间取样”，支持拖选、边界输入、键盘、曲线选择与节点统计。节点极值只是绘制分辨率下的取样值，不是连续函数的解析极值或积分。`npm run test:discovery` 运行全书回归；`node scripts/check-explorer-input-browser.cjs` 额外检查线性/对数轴拖拽、触摸、缩放与既有控件。完整范围见 `docs/discovery-review.md`。

全书图解与图例更新：保留并完善 41 组正文图解，其中 19 组完成重点重绘；第 5、13 章补充速度弥散与投影关系说明。19 幅科教插画覆盖 16 章，均有对象图例与读图线索，其中第 3、6、7 章新增原创 SVG。115 张曲线图的 190 个数据系列使用与实际绘制样式对应的图例，支持固定参照、大图和 SVG 导出。插画原色与观测图来源分别标注。详见 [全书图例验证记录](docs/book-legends-validation.json)。

源码包括已经生成的 `dist/`，下载后可直接运行。修改作者源后，用Node 22+、Python 3.9+构建：

```bash
git clone https://github.com/HainaHuang729/galaxies-interactive-textbook.git
cd galaxies-interactive-textbook
npm ci
npm run build
npm test
npm run check:public
python3 start.py
```

可选CI模板在 `docs/ci/github-actions.yml.example`。启用时将它复制为 `.github/workflows/check.yml`；上传工作流需要具备相应仓库权限。当前公开版本已完成本地构建、数值与离线检查。

基础构建与数值检查依赖Node/Python标准库和已随仓库附带的KaTeX，不依赖专属应用、私有服务或参考书PDF。`npm ci`安装浏览器测试用的Playwright；只做基础构建时可以跳过。

需要浏览器回归时，先安装浏览器并启动本地服务器：

```bash
npx playwright install chromium
BOOK_PREVIEW_URL=http://127.0.0.1:8765 PLAYWRIGHT_CHROMIUM_CHANNEL=chromium npm run test:browser
```

默认浏览器回归使用系统Chrome；其他专项脚本的环境变量与报告路径见脚本头部。数值检查不等于所有科学假设都已被证明；科学复核材料在 `docs/`，本次基础内容见 [v34复核](docs/photometry-drift-review-v34.md)。

本次全书复核与修正见 [v36复核记录](docs/whole-book-review-v36.md)，包括有限分布公式、形成率阈值/峰、实际绘线节点和局部符号语境。

## 下一本书：直接调用 skill

技能已独立维护于 [interactive-textbook-skill](https://github.com/HainaHuang729/interactive-textbook-skill)，完整安装、调用、更新与许可说明见新仓库。建议从[独立发布页](https://github.com/HainaHuang729/interactive-textbook-skill/releases/latest)下载；本仓库保留此前的技能副本和历史发布。

已提供可独立复用的 [interactive-textbook 技能](skills/interactive-textbook/SKILL.md)，包含科学核查、统一计算模型、公式/图表/读数一致、局部符号释义、交互实验和视觉标准。支持新书、继续章节和专项修复，不强制重建已有项目。

v0.2.0已纳入本次全书复核的[问题与检查方法](skills/interactive-textbook/references/review-cases.md)：有限积分与归一化、实际绘线路径和探针、阈值与极值、局部符号优先级、完整数学表达式及可追溯的覆盖记录。下一本书沿用这些方法，重新核对自己的来源和模型。

本机已安装时，在新书任务中输入：

```text
$interactive-textbook 把《书名》制作成中文交互教材。参考资料在……，面向……读者；先核对来源并完成一个样板章。
```

[下载独立技能ZIP（v0.2.0）](https://github.com/HainaHuang729/galaxies-interactive-textbook/releases/download/skill-v0.2.0/interactive-textbook-skill.zip)。其他使用者可以把仓库中的 `skills/interactive-textbook/` 整个文件夹放入其Codex技能目录，保留 `SKILL.md`、`agents/`、`references/`、`assets/`、`scripts/` 的相对结构。若有同名技能，先比较后更新。结构化作者源初始化助手只创建骨架，不包含原书、已核实模型或自动生成的完整网站。

## 项目结构

| 位置 | 用途 |
| --- | --- |
| `dist/` | 完整可运行静态网站，含前8章的手写页面 |
| `content/chapter-N.json` | 第9–16章的结构化作者源 |
| `content/*labs*.json` | 后续增加的教学实验及其假设与出处 |
| `content/glossary/`、`content/math/` | 局部术语与数学排版源 |
| `dist/assets/*physics.js` | 可在浏览器和Node复用的纯模型 |
| `scripts/build-*.cjs`、`scripts/build-chapters.py` | 幂等内容构建与页面集成 |
| `scripts/check-*.cjs`、`scripts/fixtures/` | 数值、语义和浏览器回归与独立夹具 |
| `vendor/anatomy/` | 保留MIT许可的图形构造与几何审查工具 |
| `templates/`、`docs/BOOK_PRODUCTION_WORKFLOW.md` | 下一本书的模板与完整制作流程 |

当前架构包含早期手写页面与后期JSON生成页面，尚未抽象成通用出版引擎。制作下一本书时先建立来源地图和一个样板章，再按模板推进；不要直接批量替换书名后声称完成。

## 许可与署名

- 原创软件代码：**MIT**，见 [LICENSE](LICENSE)。
- 原创文字、释义、图解与文档：**CC BY 4.0**，见 [LICENSE-CONTENT.md](LICENSE-CONTENT.md)。
- 第三方代码、字库和观测图像：按各自许可与署名要求，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。本项目不重新授权第三方作品。

欢迎在保留相应许可和署名的前提下下载、教学、改编与再发布。发现科学错误，请带上章节、参数、公式或来源 [提交Issue](https://github.com/HainaHuang729/galaxies-interactive-textbook/issues/new/choose)。
