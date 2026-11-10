import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("assemble-offline-native.py")
SPEC = importlib.util.spec_from_file_location("assemble_offline_native", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def sha(data):
    return hashlib.sha256(data).hexdigest()


class OfflineNativeAssemblyTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(os.path.realpath(self.temporary.name))
        self.repo = self.root / "repo"
        self.inputs = self.root / "inputs"
        self.repo.mkdir()
        self.inputs.mkdir()
        (self.repo / "tool").write_bytes(b"tool")
        (self.inputs / "proof").write_bytes(b"proof")
        self.files = [{"source": "repo", "path": "tool", "name": "tools/tool", "sha256": sha(b"tool")},
                      {"source": "inputs", "path": "proof", "name": "base-proof.json",
                       "sha256": sha(b"proof"), "readonly": True}]

    def lock(self):
        path = self.root / "lock.json"
        data = json.dumps({"format": "toonlira-offline-native-arm64-1", "files": self.files}).encode()
        path.write_bytes(data)
        return path, sha(data)

    def test_two_archives_match_and_preserve_readonly_proof(self):
        lock, pin = self.lock()
        first, second = self.root / "one.tar.gz", self.root / "two.tar.gz"
        self.assertEqual(MODULE.assemble(self.repo, self.inputs, lock, pin, first),
                         MODULE.assemble(self.repo, self.inputs, lock, pin, second))
        self.assertEqual(first.read_bytes(), second.read_bytes())
        with tarfile.open(first) as archive:
            self.assertEqual(archive.getnames(), ["base-proof.json", "tools/tool"])
            self.assertEqual(archive.getmember("base-proof.json").mode, 0o444)
            self.assertEqual(archive.extractfile("tools/tool").read(), b"tool")
        with self.assertRaises(FileExistsError):
            MODULE.assemble(self.repo, self.inputs, lock, pin, first)

    def test_rejects_changed_input_untrusted_lock_and_traversal(self):
        lock, pin = self.lock()
        (self.repo / "tool").write_bytes(b"changed")
        with self.assertRaises(ValueError):
            MODULE.assemble(self.repo, self.inputs, lock, pin, self.root / "bad.tar.gz")
        self.assertFalse((self.root / "bad.tar.gz").exists())
        with self.assertRaises(ValueError):
            MODULE.assemble(self.repo, self.inputs, lock, "0" * 64, self.root / "bad.tar.gz")
        self.files[0]["name"] = "../outside"
        lock, pin = self.lock()
        with self.assertRaises(ValueError):
            MODULE.assemble(self.repo, self.inputs, lock, pin, self.root / "bad.tar.gz")

    def test_rejects_bytes_changed_during_copy_even_if_input_is_restored(self):
        lock, pin = self.lock()
        original = tarfile.TarFile.addfile
        tool = self.repo / "tool"

        def change_during_copy(archive, info, source=None):
            if info.name != "tools/tool":
                return original(archive, info, source)
            tool.write_bytes(b"evil")
            try:
                return original(archive, info, source)
            finally:
                tool.write_bytes(b"tool")

        with patch.object(tarfile.TarFile, "addfile", change_during_copy):
            with self.assertRaises(ValueError):
                MODULE.assemble(self.repo, self.inputs, lock, pin, self.root / "race.tar.gz")


if __name__ == "__main__":
    unittest.main()
