#!/usr/bin/env python3
"""Emit a deterministic, bounded inventory of the dependencies and fonts in a Boot JAR."""
import hashlib
import json
import os
import sys
import zipfile


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inventory(path):
    if not os.path.isabs(path) or os.path.islink(path) or os.path.realpath(path) != path:
        raise ValueError("invalid archive path")
    if not os.path.isfile(path) or not 0 < os.path.getsize(path) <= 512 * 1024 * 1024:
        raise ValueError("invalid archive size")
    with open(path, "rb") as source:
        hasher = hashlib.sha256()
        for block in iter(lambda: source.read(65536), b""):
            hasher.update(block)
        archive_hash = hasher.hexdigest()
    with zipfile.ZipFile(path) as archive:
        selected = [entry for entry in archive.infolist() if not entry.is_dir() and (
            entry.filename.startswith("BOOT-INF/lib/") or
            entry.filename.startswith("BOOT-INF/classes/rendering/fonts/"))]
        names = [entry.filename for entry in selected]
        if len(names) != len(set(names)) or len(names) > 1000:
            raise ValueError("invalid archive inventory")
        entries = {}
        for entry in sorted(selected, key=lambda item: item.filename):
            if entry.file_size <= 0 or entry.file_size > 128 * 1024 * 1024:
                raise ValueError("invalid archive entry")
            entries[entry.filename] = digest(archive.read(entry))
    if not any(name.startswith("BOOT-INF/lib/") for name in entries):
        raise ValueError("archive has no dependencies")
    return {"format": "toonlira-worker-jar-inventory-1", "jarSha256": archive_hash, "entries": entries}


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("expected one archive")
        print(json.dumps(inventory(sys.argv[1]), indent=2, sort_keys=True))
    except (OSError, ValueError, zipfile.BadZipFile):
        print("worker-inventory-unavailable", file=sys.stderr)
        sys.exit(1)
