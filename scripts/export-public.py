#!/usr/bin/env python3
"""Export an allowlisted source snapshot, without private history or hosting IDs."""
import argparse
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
FOLDERS = ['content', 'dist', 'docs', 'scripts', 'vendor', 'testdata', 'templates', '.github']
FILES = ['README.md', 'LICENSE', 'LICENSE-CONTENT.md', 'THIRD_PARTY_NOTICES.md', 'CONTRIBUTING.md', 'CITATION.cff', '.gitignore', '.gitattributes', 'package.json', 'package-lock.json', 'start.py', 'MODEL_AUDIT.md', 'DETAIL_REVIEW.md']
EXCLUDED = {'dist/assets/observations/planck-cmb-2013.jpg'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    target = args.destination.resolve()
    if target == ROOT or ROOT in target.parents:
        parser.error('Choose a new folder outside this checkout.')
    if target.exists() and any(target.iterdir()):
        parser.error('Destination must be empty; existing files will not be overwritten.')
    target.mkdir(parents=True, exist_ok=True)
    for name in FOLDERS:
        shutil.copytree(ROOT / name, target / name, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', 'node_modules'), dirs_exist_ok=True)
    for name in FILES:
        shutil.copy2(ROOT / name, target / name)
    for name in EXCLUDED:
        (target / name).unlink(missing_ok=True)
    # An absent optional image becomes a source-linked reference card, never a
    # broken image or a synthetic image mislabeled as an observation.
    subprocess.run(['python3', 'scripts/build-chapters.py'], cwd=target, check=True)
    subprocess.run(['python3', 'scripts/check-public-release.py'], cwd=target, check=True)
    print(target)


if __name__ == '__main__':
    main()
