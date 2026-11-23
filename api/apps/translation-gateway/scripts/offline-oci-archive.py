#!/usr/bin/env python3
"""Verify a local Docker-save OCI archive and the graph rooted at a pinned image index."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import tarfile

HASH = re.compile(r"[a-f0-9]{64}\Z")
MAX_ARCHIVE = 2 * 1024 * 1024 * 1024
MAX_JSON = 4 * 1024 * 1024
MAX_ENTRIES = 10000


def digest_stream(stream):
    digest = hashlib.sha256()
    for block in iter(lambda: stream.read(65536), b""):
        digest.update(block)
    return digest.hexdigest()


def verify(path, expected_archive, expected_image):
    path = Path(path)
    if (not path.is_absolute() or path.is_symlink() or path.resolve() != path or not path.is_file()
            or path.stat().st_size > MAX_ARCHIVE or not HASH.fullmatch(expected_archive)
            or not re.fullmatch(r"sha256:[a-f0-9]{64}", expected_image)):
        raise ValueError("invalid archive")
    with path.open("rb") as stream:
        if digest_stream(stream) != expected_archive:
            raise ValueError("archive hash mismatch")
    with tarfile.open(path, "r:*") as archive:
        entries = {}
        for entry in archive:
            if not (entry.isfile() or entry.isdir()) or entry.name in entries or len(entries) >= MAX_ENTRIES:
                raise ValueError("invalid archive entry")
            if entry.isfile():
                entries[entry.name] = entry
        blobs = {}
        for name, entry in entries.items():
            if not name.startswith("blobs/sha256/"):
                continue
            expected = name.removeprefix("blobs/sha256/")
            if not HASH.fullmatch(expected) or digest_stream(archive.extractfile(entry)) != expected:
                raise ValueError("blob hash mismatch")
            blobs["sha256:" + expected] = entry

        def document(entry):
            if entry.size > MAX_JSON:
                raise ValueError("metadata too large")
            return json.load(archive.extractfile(entry))

        index = document(entries["index.json"])
        roots = index.get("manifests", [])
        if not any(item.get("digest") == expected_image for item in roots):
            raise ValueError("image index mismatch")
        pending = [expected_image]
        visited = set()
        bindings = set()
        while pending:
            digest = pending.pop()
            if digest in visited:
                continue
            if digest not in blobs:
                raise ValueError("missing referenced blob")
            visited.add(digest)
            entry = blobs[digest]
            # Only bounded JSON objects can contain OCI descriptors; binary layers are already hash-checked.
            if entry.size > MAX_JSON:
                continue
            stream = archive.extractfile(entry)
            if stream.read(1) != b"{":
                continue
            stream.seek(0)
            try:
                value = json.load(stream)
            except (ValueError, UnicodeError):
                continue
            if not isinstance(value, dict):
                continue
            descriptors = value.get("manifests", []) + value.get("layers", [])
            if isinstance(value.get("config"), dict) and "digest" in value["config"]:
                descriptors.append(value["config"])
                if isinstance(value.get("layers"), list):
                    bindings.add((value["config"]["digest"], tuple(layer.get("digest") for layer in value["layers"])))
            for descriptor in descriptors:
                reference = descriptor.get("digest", "")
                if not re.fullmatch(r"sha256:[a-f0-9]{64}", reference):
                    raise ValueError("invalid descriptor")
                pending.append(reference)
        legacy = document(entries["manifest.json"])
        if (not isinstance(legacy, list) or len(legacy) != 1 or legacy[0].get("Config") not in entries
                or any(layer not in entries for layer in legacy[0].get("Layers", []))):
            raise ValueError("incomplete archive manifest")
        for name in [legacy[0]["Config"], *legacy[0].get("Layers", [])]:
            if not name.startswith("blobs/sha256/") or "sha256:" + name.removeprefix("blobs/sha256/") not in visited:
                raise ValueError("unbound archive manifest")
        binding = ("sha256:" + legacy[0]["Config"].removeprefix("blobs/sha256/"),
                   tuple("sha256:" + name.removeprefix("blobs/sha256/") for name in legacy[0].get("Layers", [])))
        if binding not in bindings:
            raise ValueError("spliced archive manifest")
        config = document(entries[legacy[0]["Config"]])
        if config.get("os") != "linux" or config.get("architecture") != "arm64":
            raise ValueError("wrong platform")
        return {"status": "verified", "imageId": expected_image, "archiveSha256": expected_archive,
                "blobs": len(blobs), "reachable": len(visited)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("archive")
    parser.add_argument("archive_sha256")
    parser.add_argument("image_id")
    args = parser.parse_args()
    try:
        print(json.dumps(verify(args.archive, args.archive_sha256, args.image_id)))
    except (OSError, ValueError, KeyError, TypeError, tarfile.TarError):
        print("offline-oci-archive-unavailable", file=sys.stderr)
        sys.exit(1)
