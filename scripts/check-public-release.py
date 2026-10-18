#!/usr/bin/env python3
"""Fail closed on accidental private files, credentials or machine-specific paths."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE_DIRS = {'.git', 'node_modules', 'work', 'release', '__pycache__', 'test-results', 'playwright-report'}
# Only report file/category, never the matching value.
PATTERNS = {
    'private-home-path': re.compile(r'(?<![A-Za-z0-9])/(?:Users|home)/[A-Za-z0-9_.-]+/'),
    'site-identity': re.compile(r'appg(?:prj|ver|dep)_[A-Za-z0-9]+'),
    'github-token': re.compile(r'gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}'),
    'api-key': re.compile(r'sk-(?:proj-)?[A-Za-z0-9_-]{30,}'),
    'private-key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')
}
errors = []
count = 0
for p in ROOT.rglob('*'):
    rel = p.relative_to(ROOT)
    if any(part in EXCLUDE_DIRS for part in rel.parts) or not p.is_file():
        continue
    if rel.parts[0] == '.openai':
        errors.append({'file': str(rel), 'reason': 'private-hosting-configuration'})
        continue
    if p.suffix.lower() in {'.pdf', '.epub', '.pem', '.key'} or p.name == '.env' or p.name.startswith('.env.') and p.name != '.env.example':
        errors.append({'file': str(rel), 'reason': 'private-or-reference-file'})
    if str(rel) == 'dist/assets/observations/planck-cmb-2013.jpg':
        errors.append({'file': str(rel), 'reason': 'external-reference-only-media'})
    count += 1
    try:
        s = p.read_text()
    except (UnicodeError, OSError):
        continue
    for label, pattern in PATTERNS.items():
        if pattern.search(s):
            errors.append({'file': str(rel), 'reason': label})
print(json.dumps({'scannedFiles': count, 'errors': errors}, ensure_ascii=False))
sys.exit(bool(errors))
