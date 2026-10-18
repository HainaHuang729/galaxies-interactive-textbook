# Third-party notices / 第三方许可与素材署名

本项目原创代码的MIT许可与原创内容的CC BY 4.0不覆盖下列第三方作品。请保留其许可和完整署名，不暗示机构支持本项目。

## 软件与字库

| 组件 | 原许可与随附文件 | 官方来源 |
| --- | --- | --- |
| D3 | ISC，`dist/assets/D3-LICENSE.txt` | https://github.com/d3/d3 |
| KaTeX | MIT，`dist/assets/katex/LICENSE` | https://github.com/KaTeX/KaTeX |
| KaTeX字体 | 上游字体仓库许可，`dist/assets/katex/fonts/LICENSE` | https://github.com/KaTeX/katex-fonts |
| Lucide图标 | ISC，`dist/assets/LUCIDE-LICENSE.txt` | https://github.com/lucide-icons/lucide |
| Anatomy工具包 | MIT，`vendor/anatomy/LICENSE` | 保留原作者Ryan署名；仓库仅包含实际使用的工具包文件 |
| Playwright（仅开发依赖） | Apache-2.0，npm依赖保留上游许可 | https://github.com/microsoft/playwright |

## 真实观测素材

来自官方发布页的图像保留原显示色、处理说明与完整署名。NASA/Chandra媒体按发布方使用政策提供，不由本项目重新授权；ESA/Hubble和ESA/Webb的对应素材依其CC BY 4.0政策署名使用。Planck图的ESA Standard Licence不同，公开包不包含该JPEG，仅链接至官方页面。

- [NASA图像政策](https://www.nasa.gov/nasa-brand-center/images-and-media/)
- [Chandra图像使用说明](https://chandra.harvard.edu/photo/image_use.html)
- [ESA/Hubble许可](https://esahubble.org/copyright/)
- [ESA/Webb许可](https://esawebb.org/copyright/)
- [ESA Standard Licence](https://www.esa.int/ESA_Multimedia/Terms_and_conditions_of_use_of_images_and_videos_available_on_the_esa_website)

下表逐项列出源页和未经省略的署名。图片内若包含多机构资料，保留所有机构及作者；不能简单写“NASA”。机器可读记录在 `content/observation-sources.json` 和 `content/body-figures.json`。

| 文件 | 完整署名 | 官方发布页 / 分发范围 |
| --- | --- | --- |
| `assets/observations/m51-optical.jpg` | Optical: NASA/STScI | https://chandra.harvard.edu/photo/2015/iyl/more.html  |
| `assets/observations/m51-ultraviolet.jpg` | UV: NASA/JPL-Caltech | https://chandra.harvard.edu/photo/2015/iyl/more.html  |
| `assets/observations/m51-infrared.jpg` | IR: NASA/JPL-Caltech | https://chandra.harvard.edu/photo/2015/iyl/more.html  |
| `assets/observations/perseus-optical.jpg` | NASA/ESA/Hubble Heritage (STScI/AURA) & Univ. of Cambridge/IoA/A. Fabian | https://chandra.harvard.edu/photo/2008/perseus/more.html  |
| `assets/observations/perseus-xray.jpg` | NASA/CXC/IoA/A.Fabian et al | https://chandra.harvard.edu/photo/2008/perseus/more.html  |
| `assets/observations/planck-cmb-2013.jpg` | ESA and the Planck Collaboration (© ESA) | https://www.esa.int/ESA_Multimedia/Images/2013/03/Planck_CMB （仅外链；不随公开包分发） |
| `assets/observations/cosmic-horseshoe.jpg` | ESA/Hubble & NASA | https://esahubble.org/images/potw1151a/  |
| `assets/observations/bullet-cluster-composite.jpg` | X-ray: NASA/CXC/CfA/M.Markevitch et al.; Optical: NASA/STScI; Magellan/U.Arizona/D.Clowe et al.; Lensing Map: NASA/STScI; ESO WFI; Magellan/U.Arizona/D.Clowe et al. | https://chandra.harvard.edu/photo/2006/1e0657/  |
| `assets/observations/coma-cluster-field.jpg` | NASA, ESA, and the Hubble Heritage Team (STScI/AURA). Acknowledgment: D. Carter (Liverpool John Moores University) and the Coma HST ACS Treasury Team. | https://esahubble.org/images/heic0813a/  |
| `assets/observations/hh30-webb-disk-jet.jpg` | ESA/Webb, NASA & CSA, Tazaki et al. | https://esawebb.org/images/potm2501a/  |
| `assets/observations/tycho-remnant-2019.jpg` | X-ray: NASA/CXC/RIKEN & GSFC/T. Sato et al | https://chandra.harvard.edu/photo/2019/tycho/more.html  |
| `assets/observations/ngc1300-stellar-bar.jpg` | NASA, ESA, and The Hubble Heritage Team (STScI/AURA) | https://esahubble.org/images/opo0501a/  |
| `assets/observations/eso137-stripping.jpg` | NASA, ESA. Acknowledgements: Ming Sun (UAH), and Serge Meunier | https://esahubble.org/images/heic1404a/  |
| `assets/observations/eso38112-stellar-shells.jpg` | NASA, ESA, P. Goudfrooij (STScI) | https://esahubble.org/images/heic1516a/  |

## AI概念插图与原创程序图

`dist/assets/illustrations/`中的位图以ImageGen生成，提示词、使用范围和图注见 `content/illustrations.json`。项目对可授权的原创贡献按CC BY 4.0提供，不声称这些图像是观测或数值模拟。定量图表与科学示意的模型和来源分别记录在作者源与复核材料中。

## 参考书、论文与外链

Mo, H., van den Bosch, F. C. & White, S. D. M. (2010), *Galaxy Formation and Evolution*, Cambridge University Press，是知识参考，版权归原权利人。本仓库不含该书PDF、提取正文、扫描插图或受限勘误PDF。书中科学事实、方程与网页新增推导通过章节/页码引用，网页叙述为原创。外链论文、教材和图像仍遵循各自权利与许可。
