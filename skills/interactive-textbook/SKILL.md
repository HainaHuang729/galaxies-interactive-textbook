---
name: interactive-textbook
description: Create, extend, or scientifically review interactive web textbooks from reference books, lecture notes, or existing chapters. Use for textbook and chapter production that needs source-grounded explanations, independently checked models, consistent formulas/charts/readouts, contextual symbol definitions, accessible experiments, and a unified visual style. Not for ordinary subject Q&A or an unrelated standalone chart.
license: Instructional content and templates CC-BY-4.0; helper code MIT. See LICENSE.txt.
metadata:
  short-description: 科学可核查的交互教材制作与逐章完善
---

# 交互教材制作

把参考资料转成读者可以阅读、观察、操作和复核的原创交互教材。继承GALAXIES项目的质量标准，不继承它的书目、章数、页码偏移、物理参数、技术栈或宇宙学配色。用户明确的要求、既有授权和项目约定优先。

## 先判断这次要做什么

- **新书**：确认书名/版本、读者、语言、合法参考资料、交付范围；核对目录和页码映射，完成来源地图与一个完整样板章，再扩展。缺少关键来源时先做独立于来源的工作，针对缺失信息提问，不编造页码或书中结论。
- **继续章节或完善全书**：先读当前作者源、实验清单、复核记录与既有视觉规则，选择尚未覆盖的学习问题；在已有结构上推进，不从零重建或重复添加同一实验。
- **专项修复/科学审阅**：定位受影响的模型、排版或符号语境，修正相应作者源并做相关回归；单处修复不强制重做整本书。

沿用现有项目的内容格式和构建方式。新建项目需要结构化作者源时，可用 [assets/templates](assets/templates/)；可选初始化命令：

```bash
python3 scripts/init_book.py --output /path/to/new-book --title '下一本书的书名'
```

命令路径相对本技能目录。初始化只生成作者源与核查记录的骨架，不生成一本“已完成”的书。已有非空目录不会被覆盖。

## 保留这些质量标准

1. **来源可追溯。** 原参考文件保持只读；核对版本、印刷页与文件页、公式号和作者勘误。明确区分书中结论、补充材料与新增推导。未核实的出处标待查；提取原文与受限原书不进入公开包。
2. **一个计算模型，多种表现。** 计算层尽量保持纯函数；公式、实际绘制的曲线、检查点、图面标记、动画状态、读数与伴读上下文来自同一组未舍入结果。显示格式不反向进入计算。定义单位、符号、常数、初边值、归一化、输入域和失效条件。
3. **独立科学核查。** 使用不同推导或计算路径验证极限、单位、积分/导数与守恒；覆盖参数端点和关键转变。不要把复制实现的测试当独立证据，也不要把“通过检查”写成科学完备性证明。计算与图表改动前读 [references/scientific-review.md](references/scientific-review.md)。
4. **符号按语境解释。** 每个符号、缩写与专有名词提供当前语境的可点击解释；同字母按章节、实验，必要时按公式角色区分。完整上下标优先于单字母；必须检查实际渲染出的公式、轴标、读数和图内文字。编写或修订时读 [references/math-and-symbols.md](references/math-and-symbols.md)。
5. **交互服务于学习问题。** 每个实验都让读者通过改变参数回答具体问题，数量不限于五个。保留默认值、恢复、手动操作、键盘与可复现参数；动画推进真实模型时间或明确命名的扫描量。暂停离屏、离页和后台动画，尊重减少动态效果设置。
6. **统一、可读、科学诚实。** 沿用书的设计语言，统一颜色语义、字体、公式基线、图表标度、图注和读数格式；新书可另选适合主题的视觉方向。定量图由计算产生；真实观测、程序示意、AI概念图分别标明。图像和交互设计读 [references/visuals-and-interaction.md](references/visuals-and-interaction.md)。

## 每一批内容的完成方式

围绕当前范围执行：来源与学习问题 → 模型契约与独立基准 → 讲解/公式/局部释义 → 图像/图表/实验 → 相关数值和浏览器回归 → 记录证据与适用范围。优先修科学和语义，再补视觉细节。用户要求持续推进时，完成授权范围内的内容，不在每章末重复询问是否继续。

验证要覆盖**数据与可见结果之间的连接**：不只检查返回值，还读取实际图表节点、当前探针、呈现的数字和被点击字形的释义。至少审看桌面和手机布局；沿用或新增主题都要检查。用户要求通书审阅时清点覆盖范围与遗漏；局部修改按风险选相关回归，公共计算/排版/词典变化应扩展到受影响章节。

按 [assets/templates/review-record.json](assets/templates/review-record.json) 的字段记录检查项、方法、证据、误差、未覆盖项与结论。未运行的检查记为未运行，不预填通过。缺少来源、工具或独立基准时交付已完成部分及明确限制；相应内容保留未核实状态。

## 伴读和交付

交付范围包含伴读，或既有项目已有伴读时，至少携带当前章节、实验ID、参数及单位、读数、出处、假设和局部符号解释，支持解释推导、追问、比较与可复现的参数建议。如果只是生成可复制的问题，明确说明，不能伪装成已经接入在线AI回答。实际接入模型时遵循所选服务的工具与凭据流程。

需要打包、开源或上线时读 [references/delivery.md](references/delivery.md)。本技能不自行新增外发消息、公开仓库、部署或新建聊天的授权；按用户本次范围、已有授权与所用工具的规则执行。若没有外部发布要求，交付本地可审阅结果。

最终说明：本批改了哪些章节/问题、科学依据和模型边界、哪些检查实际通过、还有哪些限制，以及可打开的结果或文件。保持报告与实际完成范围一致。
