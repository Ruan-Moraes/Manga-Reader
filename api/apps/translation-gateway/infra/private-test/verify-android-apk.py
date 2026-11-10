#!/usr/bin/env python3
"""Read-only checks for the manually installed Toonlira Android test APK."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit
from zipfile import ZipFile

OLD_ORIGIN = 'https://translation-api.toonlira.app'
BUNDLE = 'assets/index.android.bundle'


def check_bundle(apk, origin):
    url = urlsplit(origin)
    if url.scheme != 'https' or not url.hostname or url.username or url.password or url.port or url.path or url.query or url.fragment:
        raise ValueError('Expected an HTTPS origin without a path')
    if origin == OLD_ORIGIN:
        raise ValueError('Obsolete origin')
    with ZipFile(apk) as archive:
        entries = [item for item in archive.infolist() if item.filename == BUNDLE]
        if len(entries) != 1 or entries[0].file_size > 64 * 1024 * 1024:
            raise ValueError('Invalid JavaScript bundle')
        data = archive.read(entries[0])
        if origin.encode('ascii') not in data:
            raise ValueError('Expected origin absent from bundle')
        if OLD_ORIGIN.encode('ascii') in data:
            raise ValueError('Obsolete origin remains in bundle')


def verify(apk, origin, aapt, apksigner):
    path = Path(apk)
    if not path.is_file() or path.is_symlink():
        raise ValueError('Invalid APK file')
    check_bundle(path, origin)
    badging = subprocess.run([aapt, 'dump', 'badging', str(path)], capture_output=True, text=True, check=True).stdout
    package = re.search(r"^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'", badging, re.M)
    minimum = re.search(r"^sdkVersion:'(\d+)'", badging, re.M)
    target = re.search(r"^targetSdkVersion:'(\d+)'", badging, re.M)
    if not package or package.group(1) != 'com.toonlira.app' or not minimum or not target:
        raise ValueError('Unexpected Android package or SDK metadata')
    verification = subprocess.run([apksigner, 'verify', '--print-certs', str(path)], capture_output=True, text=True, check=True).stdout
    fingerprint = re.search(r'^Signer #1 certificate SHA-256 digest: ([0-9a-fA-F]{64})$', verification, re.M)
    signers = re.findall(r'^Signer #\d+ certificate SHA-256 digest:', verification, re.M)
    if not fingerprint or len(signers) != 1:
        raise ValueError('Unexpected APK signing certificate')
    return {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'package': package.group(1),
            'versionCode': package.group(2), 'versionName': package.group(3), 'minSdk': int(minimum.group(1)),
            'targetSdk': int(target.group(1)), 'signerSha256': fingerprint.group(1).lower(), 'gatewayOrigin': origin}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--apk', required=True)
    parser.add_argument('--origin', required=True)
    parser.add_argument('--aapt', required=True)
    parser.add_argument('--apksigner', required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(verify(args.apk, args.origin, args.aapt, args.apksigner), indent=2))
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        parser.exit(1, 'APK verification failed: ' + str(error) + '\n')
