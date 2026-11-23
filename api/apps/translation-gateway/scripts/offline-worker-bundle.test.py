import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("offline-worker-bundle.py")
SPEC = importlib.util.spec_from_file_location("offline_worker_bundle", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class OfflineWorkerBundleTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(os.path.realpath(self.temporary.name))
        self.bundle = self.root / "bundle"
        self.bundle.mkdir()
        for name in ("jdk", "maven", "repository", "project"):
            (self.bundle / name).mkdir()
        (self.bundle / "settings.xml").write_bytes(MODULE.SETTINGS)
        (self.bundle / "toolchains.xml").write_bytes(MODULE.TOOLCHAINS)
        (self.bundle / "project" / "pom.xml").write_text("source")
        self.lock = self.root / "lock.json"
        MODULE.create(str(self.bundle), str(self.lock), "a" * 64)
        self.lock_hash = hashlib.sha256(self.lock.read_bytes()).hexdigest()

    def test_detects_changed_missing_and_added_files(self):
        MODULE.verify(str(self.bundle), str(self.lock), self.lock_hash)
        target = self.bundle / "project" / "pom.xml"
        target.write_text("changed")
        with self.assertRaises(ValueError):
            MODULE.verify(str(self.bundle), str(self.lock), self.lock_hash)
        target.unlink()
        with self.assertRaises(ValueError):
            MODULE.verify(str(self.bundle), str(self.lock), self.lock_hash)
        target.write_text("source")
        (self.bundle / "repository" / "extra.jar").write_bytes(b"extra")
        with self.assertRaises(ValueError):
            MODULE.verify(str(self.bundle), str(self.lock), self.lock_hash)

    def test_refuses_maven_configuration_with_servers(self):
        (self.bundle / "settings.xml").write_text("<settings><servers/></settings>")
        with self.assertRaises(ValueError):
            MODULE.inventory(str(self.bundle))

    def test_detects_timestamp_change_without_content_change(self):
        target = self.bundle / "project" / "pom.xml"
        metadata = target.stat()
        os.utime(target, ns=(metadata.st_atime_ns, metadata.st_mtime_ns - 1_000_000_000))
        with self.assertRaises(ValueError):
            MODULE.verify(str(self.bundle), str(self.lock), self.lock_hash)

    def test_legacy_lock_still_verifies_without_timestamp_field(self):
        record = json.loads(self.lock.read_text())
        record["format"] = "toonlira-offline-worker-build-1"
        record["entries"] = MODULE.inventory(str(self.bundle))
        self.lock.write_text(json.dumps(record))
        digest = hashlib.sha256(self.lock.read_bytes()).hexdigest()
        MODULE.verify(str(self.bundle), str(self.lock), digest)

    def test_refuses_external_link_and_wrong_lock_hash(self):
        with self.assertRaises(ValueError):
            MODULE.verify(str(self.bundle), str(self.lock), "0" * 64)
        (self.bundle / "jdk" / "outside").symlink_to(self.root / "external")
        with self.assertRaises(ValueError):
            MODULE.inventory(str(self.bundle))

    def test_ignores_only_regular_finder_metadata(self):
        (self.bundle / ".DS_Store").write_bytes(b"finder")
        MODULE.verify(str(self.bundle), str(self.lock), self.lock_hash)
        (self.bundle / "repository" / ".DS_Store").symlink_to(self.root / "outside")
        with self.assertRaises(ValueError):
            MODULE.verify(str(self.bundle), str(self.lock), self.lock_hash)

    def test_preserves_original_lock_and_rejects_destination_in_bundle(self):
        with self.assertRaises(FileExistsError):
            MODULE.create(str(self.bundle), str(self.lock), "a" * 64)
        if MODULE.platform.system() == "Darwin" and MODULE.platform.machine() == "arm64":
            with self.assertRaises(ValueError):
                MODULE.build(str(self.bundle), str(self.lock), self.lock_hash, str(self.bundle / "new"))


if __name__ == "__main__":
    unittest.main()
