#!/usr/bin/env python3
"""Package the already-verified public snapshot; no source credentials included."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'release'
OUT.mkdir(exist_ok=True)
archive = OUT / 'galaxies-offline.zip'
files = [p for p in (ROOT / 'dist').rglob('*') if p.is_file()]
files += [ROOT / name for name in ['start.py', 'LICENSE', 'LICENSE-CONTENT.md', 'THIRD_PARTY_NOTICES.md']]
for p in files:
    if p.name == 'planck-cmb-2013.jpg':
        raise SystemExit('Run export-public.py first: external-only media must be absent.')
readme = '''GALAXIES · 星系形成与演化 — 离线阅读包

欢迎所有人下载与学习。
运行 python3 start.py（Windows: py start.py），自动打开浏览器。
仅依赖Python标准库，字体、图像与交互脚本已附带；不需要Node或API密钥。
Ctrl+C停止。端口冲突可加 --port 8766。不要直接双击HTML。

原教材PDF与原文未包含。Planck观测图仅提供官方链接；其他媒体许可与完整署名见THIRD_PARTY_NOTICES.md。
代码MIT，原创学习内容CC BY 4.0，第三方素材按各自许可。
源码与制作下一本书的流程：https://github.com/HainaHuang729/galaxies-interactive-textbook
'''
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(files):
        z.write(p, 'galaxies-offline/' + str(p.relative_to(ROOT)))
    z.writestr('galaxies-offline/README.txt', readme)
checksums = f'{hashlib.sha256(archive.read_bytes()).hexdigest()}  {archive.name}\n'
(OUT / 'CHECKSUMS.txt').write_text(checksums)
print(json.dumps({'archive': str(archive), 'files': len(files)+1, 'bytes': archive.stat().st_size}))
