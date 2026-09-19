#!/usr/bin/env python3
"""Build a new media inventory. Derived from cratejuice's index_crates_light.py.
Does not move media, overwrite a catalogue, install a player or start a service.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import tempfile
from urllib.parse import quote

EXTENSIONS = {'.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.aiff', '.aif'}

def build(source, output):
    source, output = Path(source).resolve(), Path(output).absolute()
    if not source.is_dir():
        raise ValueError('Media directory does not exist')
    if output.exists() or output.is_symlink():
        raise FileExistsError('Choose a new output directory; existing catalogues are never overwritten')
    if not output.parent.is_dir():
        raise ValueError('Output parent directory must already exist')
    tracks = []
    for path in sorted(source.rglob('*')):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        resolved = path.resolve()
        if not resolved.is_relative_to(source):
            raise ValueError('Media symlink escapes the source directory')
        if path.stat().st_size == 0:
            continue
        rel = path.relative_to(source).as_posix()
        tracks.append({'id': hashlib.sha256(rel.encode()).hexdigest()[:20],
                       'title': path.stem, 'artist': '',
                       'file': quote(Path(os.path.relpath(resolved, output)).as_posix(), safe='/.'),
                       'source_path': rel, 'bytes': path.stat().st_size,
                       'media_validation': 'not_decoded'})
    stage = Path(tempfile.mkdtemp(prefix='.juice-index-', dir=output.parent))
    try:
        docs = {'library.json': {'schema_version': 1, 'tracks': {t['id']: t for t in tracks}},
                'playlist_8.json': tracks[:8], 'playlist_16.json': tracks[:16], 'playlist_all.json': tracks}
        for name, data in docs.items():
            (stage / name).write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
        # Reserve destination exclusively, including against a concurrent writer.
        output.mkdir()
        try:
            for name in docs:
                (stage / name).replace(output / name)
        except Exception:
            # Never remove a destination containing possibly concurrent/user files.
            raise
    finally:
        shutil.rmtree(stage)
    return len(tracks)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--media', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    print(f'Indexed {build(args.media, args.output)} media files. Audio decoding remains unverified.')
