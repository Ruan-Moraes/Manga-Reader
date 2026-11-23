#!/usr/bin/env python3
"""Assemble a pinned local ARM64 worker input archive without Docker or network."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import re
import tarfile

MAX_INPUT = 2 * 1024 * 1024 * 1024
HASH = re.compile(r"[a-f0-9]{64}\Z")


def digest(path):
    result = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(65536), b""):
            result.update(block)
    return result.hexdigest()


class HashingReader:
    def __init__(self, source):
        self.source = source
        self.hash = hashlib.sha256()
        self.size = 0

    def read(self, count=-1):
        block = self.source.read(count)
        self.hash.update(block)
        self.size += len(block)
        return block


def canonical(path):
    path = Path(path)
    if not path.is_absolute() or path.is_symlink() or path.resolve() != path:
        raise ValueError("invalid path")
    return path


def assemble(repo, inputs, lock, expected_lock, destination):
    repo, inputs, lock, destination = map(canonical, (repo, inputs, lock, destination))
    if (not HASH.fullmatch(expected_lock) or not lock.is_file() or lock.stat().st_size > 1024 * 1024
            or digest(lock) != expected_lock):
        raise ValueError("lock mismatch")
    record = json.loads(lock.read_text(encoding="utf8"))
    if record.get("format") != "toonlira-offline-native-arm64-1" or not isinstance(record.get("files"), list):
        raise ValueError("invalid lock")
    entries = []
    seen = set()
    for item in record["files"]:
        root = {"repo": repo, "inputs": inputs}.get(item.get("source"))
        relative, archive_name, expected = item.get("path"), item.get("name"), item.get("sha256")
        if (root is None or not isinstance(relative, str) or not isinstance(archive_name, str)
                or not isinstance(expected, str) or not HASH.fullmatch(expected)):
            raise ValueError("invalid entry")
        for value in (relative, archive_name):
            parts = value.split("/")
            if not value or value.startswith("/") or any(part in ("", ".", "..") for part in parts):
                raise ValueError("invalid name")
        if archive_name in seen:
            raise ValueError("duplicate name")
        seen.add(archive_name)
        path = root / relative
        if (path.is_symlink() or path.resolve() != path or not path.is_file()
                or path.stat().st_size > MAX_INPUT or digest(path) != expected):
            raise ValueError("input mismatch")
        entries.append((archive_name, path, expected, 0o444 if item.get("readonly") is True else 0o644))
    if not entries or not destination.parent.is_dir() or destination.is_relative_to(inputs) or destination.is_relative_to(repo):
        raise ValueError("invalid destination")
    with destination.open("xb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0, compresslevel=6) as compressed:
            with tarfile.open(fileobj=compressed, mode="w|", format=tarfile.USTAR_FORMAT) as archive:
                for name, path, expected, mode in sorted(entries):
                    info = tarfile.TarInfo(name)
                    info.size = path.stat().st_size
                    info.mode, info.uid, info.gid, info.mtime = mode, 0, 0, 0
                    with path.open("rb") as source:
                        checked = HashingReader(source)
                        archive.addfile(info, checked)
                        if checked.size != info.size or checked.read(1) or checked.hash.hexdigest() != expected:
                            raise ValueError("input changed during copy")
                    if digest(path) != expected:
                        raise ValueError("input changed")
    return digest(destination)


def main():
    parser = argparse.ArgumentParser()
    for arg in ("repo", "inputs", "lock", "lock_sha256", "destination"):
        parser.add_argument(arg)
    args = parser.parse_args()
    print(json.dumps({"status": "assembled-not-admitted", "sha256": assemble(
        args.repo, args.inputs, args.lock, args.lock_sha256, args.destination)}))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, TypeError, KeyError, json.JSONDecodeError, tarfile.TarError):
        raise SystemExit("offline-native-assembly-unavailable")
