#!/usr/bin/env python3
"""Create a new, checksummed bootstrap bundle without deployment secrets."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

SOURCE = Path(__file__).resolve().parent
FILES = (
    'compose.yaml', 'configure-docker.mjs', 'prepare-docker-and-start.sh',
    'start-private-test.sh', 'deployment-config.mjs', 'deployment-preflight.mjs',
    'metadata-check.mjs', 'metadata-guard.sh',
)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def create_bundle(destination, receipt):
    destination = Path(destination)
    receipt = Path(receipt)
    if not receipt.is_file() or receipt.is_symlink():
        raise ValueError('Invalid receipt')
    parsed = json.loads(receipt.read_text())
    prefix = 'southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103/'
    for name in ('gateway', 'postgres', 'proxy', 'rate'):
        value = parsed.get(name, {}).get('digest', '')
        expected = prefix + name + '@sha256:'
        if not isinstance(value, str) or not value.startswith(expected) or len(value) != len(expected) + 64 or any(c not in '0123456789abcdef' for c in value[len(expected):]):
            raise ValueError('Invalid image receipt')
    for name in FILES:
        path = SOURCE / name
        if not path.is_file() or path.is_symlink():
            raise ValueError('Invalid source file')
    destination.mkdir(mode=0o700, parents=False, exist_ok=False)
    try:
        for name in FILES:
            shutil.copyfile(SOURCE / name, destination / name)
            (destination / name).chmod(0o600)
        sanitized = {name: {'digest': parsed[name]['digest']} for name in ('gateway', 'postgres', 'proxy', 'rate')}
        (destination / 'published.json').write_text(json.dumps(sanitized, indent=2, sort_keys=True) + '\n')
        (destination / 'published.json').chmod(0o600)
        names = sorted((*FILES, 'published.json'))
        manifest = ''.join(f'{digest(destination / name)}  {name}\n' for name in names)
        (destination / 'SHA256SUMS').write_text(manifest)
        (destination / 'SHA256SUMS').chmod(0o600)
        return manifest
    except Exception:
        shutil.rmtree(destination)
        raise


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--destination', required=True)
    parser.add_argument('--receipt', required=True)
    args = parser.parse_args()
    print(create_bundle(args.destination, args.receipt), end='')
