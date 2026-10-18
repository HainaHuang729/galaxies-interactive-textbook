#!/usr/bin/env python3
"""Create a source/review scaffold for a new interactive textbook, without overwrites."""
import argparse
import csv
import json
from pathlib import Path
import shutil
import sys

TEMPLATES = Path(__file__).resolve().parents[1] / 'assets' / 'templates'


def load(name):
    return json.loads((TEMPLATES / name).read_text(encoding='utf-8'))


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--title', required=True)
    parser.add_argument('--language', default='zh-CN')
    args = parser.parse_args()
    if not args.title.strip() or not args.language.strip():
        parser.error('Title and language must be non-empty.')
    target = args.output.expanduser().resolve()
    if target.exists() and (not target.is_dir() or any(target.iterdir())):
        parser.error('Output must be a new or empty directory; no files were changed.')
    # Validate the bundled inputs before creating any project files.
    book = load('book.json')
    chapter = load('chapter.json')
    for name in ['model-contract.json', 'symbol.json', 'review-record.json']:
        load(name)
    target.mkdir(parents=True, exist_ok=True)
    for name in ['content/chapters', 'content/models', 'content/symbols', 'docs']:
        (target / name).mkdir(parents=True, exist_ok=True)
    book['project'].update(title=args.title.strip(), language=args.language.strip())
    write_json(target / 'book.json', book)
    chapter.update(id='chapter-01', number=1)
    write_json(target / 'content/chapters/chapter-01.json', chapter)
    for src, dst in [('model-contract.json', 'content/models/model-contract.json'),
                     ('symbol.json', 'content/symbols/symbol-contract.json'),
                     ('review-record.json', 'docs/review-record.json')]:
        shutil.copyfile(TEMPLATES / src, target / dst)
    tables = {
        'source-register.csv': ['source_id', 'reference', 'edition', 'section', 'printed_pages', 'file_pages', 'equation', 'errata', 'rights', 'verified', 'notes'],
        'chapter-map.csv': ['chapter_id', 'title', 'learning_question', 'prerequisites', 'source_ids', 'model_ids', 'figure_ids', 'review_status']
    }
    for name, header in tables.items():
        with (target / 'docs' / name).open('w', encoding='utf-8', newline='') as file:
            csv.writer(file).writerow(header)
    (target / '.gitignore').write_text('private/\n.env\n.env.*\n!.env.example\nnode_modules/\n.venv/\n__pycache__/\n.DS_Store\n', encoding='utf-8')
    (target / 'START_HERE.md').write_text('''# 交互教材项目骨架

此处只有作者源与复核记录，尚无已核实的正文、模型或网站。

先填写book.json的真实书目、受众与页码映射；在docs/source-register.csv和chapter-map.csv建立来源与章节地图。
选择一个样板章，在现有技术栈中贯通讲解、LaTeX、纯模型、图表、实验、局部符号与理解题。
模型需独立基准；复核结果填docs/review-record.json，未运行的检查保留not-run。
source-register不保存受限原文。私有参考资料和提取文本放在公开作者源之外；不要将它们复制进仓库。
后续调用 $interactive-textbook 继续按章节制作或做专项核查。
''', encoding='utf-8')
    print(json.dumps({'output': str(target), 'status': 'scaffold-only', 'files': sum(p.is_file() for p in target.rglob('*'))}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
