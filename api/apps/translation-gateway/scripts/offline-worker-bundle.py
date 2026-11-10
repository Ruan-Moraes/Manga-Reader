#!/usr/bin/env python3
"""Seal and exercise an explicitly prepared offline macOS ARM64 worker build bundle."""
import argparse
import hashlib
import json
import os
import platform
import re
import shutil
import stat
import subprocess
import sys
from pathlib import Path

MAX_ENTRIES = 20000
MAX_FILE_BYTES = 512 * 1024 * 1024
HASH = re.compile(r"[a-f0-9]{64}\Z")
ROOT_ITEMS = {"jdk", "maven", "repository", "project", "settings.xml", "toolchains.xml"}
SETTINGS = b'<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"><offline>true</offline></settings>\n'
TOOLCHAINS = b'<toolchains xmlns="http://maven.apache.org/TOOLCHAINS/1.1.0"/>\n'


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def absolute(path):
    result = Path(path)
    if not result.is_absolute() or result.is_symlink() or result.resolve() != result:
        raise ValueError("invalid path")
    return result


def inventory(root, include_mtime=False):
    root = absolute(root)
    if not root.is_dir() or {entry.name for entry in root.iterdir() if entry.name != ".DS_Store"} != ROOT_ITEMS:
        raise ValueError("invalid bundle layout")
    if ((root / "settings.xml").is_symlink() or (root / "toolchains.xml").is_symlink()
            or (root / "settings.xml").read_bytes() != SETTINGS
            or (root / "toolchains.xml").read_bytes() != TOOLCHAINS):
        raise ValueError("invalid offline settings")
    entries = {}
    for directory, dirs, files in os.walk(root, followlinks=False):
        for name in sorted(dirs + files):
            path = Path(directory) / name
            relative = path.relative_to(root).as_posix()
            metadata = path.lstat()
            mode = stat.S_IMODE(metadata.st_mode)
            # Finder may add this non-runtime metadata while inspecting a local bundle.
            if name == ".DS_Store":
                if not stat.S_ISREG(metadata.st_mode) or metadata.st_size > 1024 * 1024:
                    raise ValueError("invalid Finder metadata")
                continue
            if stat.S_ISLNK(metadata.st_mode):
                target = os.readlink(path)
                top = root / path.relative_to(root).parts[0]
                if os.path.isabs(target) or not path.exists() or not path.resolve().is_relative_to(top):
                    raise ValueError("external symbolic link")
                entries[relative] = {"type": "link", "target": target}
                if name in dirs:
                    dirs.remove(name)
            elif stat.S_ISDIR(metadata.st_mode):
                entries[relative] = {"type": "directory", "mode": mode}
            elif stat.S_ISREG(metadata.st_mode):
                if metadata.st_size > MAX_FILE_BYTES:
                    raise ValueError("oversized file")
                entries[relative] = {"type": "file", "mode": mode, "size": metadata.st_size, "sha256": sha256(path)}
                if include_mtime:
                    entries[relative]["mtimeSeconds"] = metadata.st_mtime_ns // 1_000_000_000
            else:
                raise ValueError("invalid bundle entry")
            if len(entries) > MAX_ENTRIES:
                raise ValueError("too many entries")
    return dict(sorted(entries.items()))


def create(root, lock, expected_jar):
    if not HASH.fullmatch(expected_jar):
        raise ValueError("invalid jar hash")
    record = {"format": "toonlira-offline-worker-build-2", "platform": "darwin-arm64",
              "javaVersion": "25.0.5.0.2", "mavenVersion": "3.9.9", "jarSha256": expected_jar,
              "entries": inventory(root, include_mtime=True)}
    with absolute(lock).open("x", encoding="utf8") as output:
        json.dump(record, output, sort_keys=True, indent=2)
        output.write("\n")


def verify(root, lock, lock_hash):
    lock = absolute(lock)
    if not HASH.fullmatch(lock_hash) or not lock.is_file() or lock.stat().st_size > 8 * 1024 * 1024:
        raise ValueError("invalid lock")
    if sha256(lock) != lock_hash:
        raise ValueError("lock hash mismatch")
    record = json.loads(lock.read_text(encoding="utf8"))
    version = record.get("format")
    if (version not in ("toonlira-offline-worker-build-1", "toonlira-offline-worker-build-2")
            or record.get("platform") != "darwin-arm64" or not HASH.fullmatch(record.get("jarSha256", ""))
            or record.get("entries") != inventory(root, include_mtime=version == "toonlira-offline-worker-build-2")):
        raise ValueError("bundle integrity mismatch")
    return record


def build(root, lock, lock_hash, destination, deny_paths=()):
    root = absolute(root)
    record = verify(root, lock, lock_hash)
    if platform.system() != "Darwin" or platform.machine() != "arm64":
        raise ValueError("unsupported build host")
    destination = absolute(destination)
    if destination.is_relative_to(root) or any(character.isspace() for character in str(destination)):
        raise ValueError("invalid destination")
    denied = []
    for value in deny_paths:
        path = absolute(value)
        if not path.exists() or root.is_relative_to(path) or destination.is_relative_to(path):
            raise ValueError("invalid denied path")
        denied.append(path)
    destination.mkdir(mode=0o700)  # Never overwrite an earlier attempt.
    project, home, scratch = (destination / name for name in ("project", "home", "tmp"))
    shutil.copytree(root / "project", project, symlinks=True)
    home.mkdir(mode=0o700)
    scratch.mkdir(mode=0o700)
    environment = {"PATH": "/usr/bin:/bin", "JAVA_HOME": str(root / "jdk"),
                   "MAVEN_OPTS": f"-Duser.home={home} -Djava.io.tmpdir={scratch}"}
    profile = "(version 1) (allow default) (deny network*)" + "".join(
        f"(deny file-read* (subpath {json.dumps(str(path))}))" for path in denied
    )
    command = ["/usr/bin/sandbox-exec", "-p", profile,
               str(root / "maven/bin/mvn"), "-o", "--settings", str(root / "settings.xml"),
               "--global-settings", str(root / "settings.xml"), "--toolchains", str(root / "toolchains.xml"),
               f"-Dmaven.repo.local={root / 'repository'}", "-f", str(project / "pom.xml"),
               "package", "-Dmaven.test.skip=true"]
    with (destination / "maven.log").open("x", encoding="utf8") as output:
        result = subprocess.run(command, cwd=destination, env=environment, stdout=output,
                                stderr=subprocess.STDOUT, timeout=300)
    if result.returncode != 0:
        raise ValueError("offline build failed")
    log = (destination / "maven.log").read_text(encoding="utf8")
    if re.search(r"The POM for .* is missing", log):
        raise ValueError("missing dependency descriptor")
    artifact = project / "target/translation-gateway-0.0.1-SNAPSHOT.jar"
    if not artifact.is_file() or sha256(artifact) != record["jarSha256"]:
        raise ValueError("jar hash mismatch")
    verify(root, lock, lock_hash)
    return {"status": "offline-build-verified", "jarSha256": record["jarSha256"], "lockSha256": lock_hash}


def main():
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    seal = commands.add_parser("seal")
    seal.add_argument("bundle")
    seal.add_argument("lock")
    seal.add_argument("jar_sha256")
    check = commands.add_parser("verify")
    check.add_argument("bundle")
    check.add_argument("lock")
    check.add_argument("lock_sha256")
    run = commands.add_parser("build")
    run.add_argument("bundle")
    run.add_argument("lock")
    run.add_argument("lock_sha256")
    run.add_argument("destination")
    run.add_argument("--deny-path", action="append", default=[])
    args = parser.parse_args()
    if args.command == "seal":
        create(args.bundle, args.lock, args.jar_sha256)
        print(json.dumps({"status": "sealed", "lockSha256": sha256(Path(args.lock))}))
    elif args.command == "verify":
        verify(args.bundle, args.lock, args.lock_sha256)
        print(json.dumps({"status": "verified"}))
    else:
        print(json.dumps(build(args.bundle, args.lock, args.lock_sha256, args.destination, args.deny_path)))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, json.JSONDecodeError, subprocess.TimeoutExpired):
        print("offline-worker-bundle-unavailable", file=sys.stderr)
        sys.exit(1)
