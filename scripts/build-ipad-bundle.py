#!/usr/bin/env python3
"""Package current tracked files plus launch/evidence docs; never start or publish a service."""
from pathlib import Path
import hashlib
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root.parent / 'JUICE-Postcard-Maker-iPad-test.zip'
files = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0'))
files.update(['START_HERE.html', 'docs/POSTCARD-QA.md', 'scripts/build-ipad-bundle.py'])
files = sorted(name for name in files if name and not name.startswith('.git'))
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    manifest = []
    for name in files:
        data = (root / name).read_bytes()
        archive.writestr(name, data)
        manifest.append(hashlib.sha256(data).hexdigest() + '  ' + name)
    archive.writestr('SHA256SUMS.txt', '\n'.join(manifest) + '\n')
print(f'{output}: {len(files)} files, {output.stat().st_size} bytes')
print('SHA-256:', hashlib.sha256(output.read_bytes()).hexdigest())
