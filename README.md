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

已提供可独立复用的 [interactive-textbook 技能](skills/interactive-textbook/SKILL.md)，包含科学核查、统一计算模型、公式/图表/读数一致、局部符号释义、交互实验和视觉标准。支持新书、继续章节和专项修复，不强制重建已有项目。

本机已安装时，在新书任务中输入：

```text
$interactive-textbook 把《书名》制作成中文交互教材。参考资料在……，面向……读者；先核对来源并完成一个样板章。
```

[下载独立技能ZIP](https://github.com/HainaHuang729/galaxies-interactive-textbook/releases/latest/download/interactive-textbook-skill.zip)。其他使用者可以把仓库中的 `skills/interactive-textbook/` 整个文件夹放入其Codex技能目录，保留 `SKILL.md`、`agents/`、`references/`、`assets/`、`scripts/` 的相对结构。若有同名技能，先比较后更新。结构化作者源初始化助手只创建骨架，不包含原书、已核实模型或自动生成的完整网站。

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
