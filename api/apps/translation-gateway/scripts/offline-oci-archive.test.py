import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tarfile
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("offline-oci-archive.py")
SPEC = importlib.util.spec_from_file_location("offline_oci_archive", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def fixture(path, corrupt=False, omit_layer=False):
    layer = b"synthetic layer"
    config = encoded({"os": "linux", "architecture": "arm64"})
    config_digest, layer_digest = sha(config), sha(layer)
    manifest = encoded({"schemaVersion": 2, "config": {"digest": "sha256:" + config_digest},
                        "layers": [{"digest": "sha256:" + layer_digest}]})
    manifest_digest = sha(manifest)
    image_index = encoded({"schemaVersion": 2, "manifests": [{"digest": "sha256:" + manifest_digest}]})
    image_digest = sha(image_index)
    items = {
        "index.json": encoded({"manifests": [{"digest": "sha256:" + image_digest}]}),
        "manifest.json": encoded([{"Config": "blobs/sha256/" + config_digest,
                                    "Layers": ["blobs/sha256/" + layer_digest]}]),
        "blobs/sha256/" + image_digest: image_index,
        "blobs/sha256/" + manifest_digest: manifest,
        "blobs/sha256/" + config_digest: config,
    }
    if not omit_layer:
        items["blobs/sha256/" + layer_digest] = b"corrupted" if corrupt else layer
    with tarfile.open(path, "w") as archive:
        for name, data in items.items():
            entry = tarfile.TarInfo(name)
            entry.size = len(data)
            archive.addfile(entry, io.BytesIO(data))
    return "sha256:" + image_digest, sha(path.read_bytes())


class OfflineOciArchiveTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(os.path.realpath(self.temporary.name))

    def test_verifies_index_config_and_referenced_layers(self):
        path = self.root / "image.tar"
        image, archive_hash = fixture(path)
        result = MODULE.verify(str(path), archive_hash, image)
        self.assertEqual(result["reachable"], 4)
        self.assertEqual(result["status"], "verified")

    def test_rejects_corruption_missing_layer_and_wrong_root(self):
        for name, options in (("corrupt", {"corrupt": True}), ("missing", {"omit_layer": True})):
            path = self.root / (name + ".tar")
            image, archive_hash = fixture(path, **options)
            with self.assertRaises(ValueError):
                MODULE.verify(str(path), archive_hash, image)
        path = self.root / "valid.tar"
        image, archive_hash = fixture(path)
        with self.assertRaises(ValueError):
            MODULE.verify(str(path), archive_hash, "sha256:" + "0" * 64)
        with self.assertRaises(ValueError):
            MODULE.verify(str(path), "0" * 64, image)

    def test_rejects_legacy_manifest_splicing_config_and_layer_from_different_manifests(self):
        path = self.root / "spliced.tar"
        config_a = encoded({"os": "linux", "architecture": "arm64", "variant": "a"})
        config_b = encoded({"os": "linux", "architecture": "arm64", "variant": "b"})
        layer_a, layer_b = b"layer-a", b"layer-b"
        manifests = [encoded({"schemaVersion": 2, "config": {"digest": "sha256:" + sha(config)},
                              "layers": [{"digest": "sha256:" + sha(layer)}]})
                     for config, layer in ((config_a, layer_a), (config_b, layer_b))]
        index = encoded({"schemaVersion": 2, "manifests": [{"digest": "sha256:" + sha(value)} for value in manifests]})
        image = "sha256:" + sha(index)
        values = [config_a, config_b, layer_a, layer_b, *manifests, index]
        items = {"blobs/sha256/" + sha(value): value for value in values}
        items["index.json"] = encoded({"manifests": [{"digest": image}]})
        items["manifest.json"] = encoded([{"Config": "blobs/sha256/" + sha(config_a),
                                            "Layers": ["blobs/sha256/" + sha(layer_b)]}])
        with tarfile.open(path, "w") as archive:
            for name, data in items.items():
                entry = tarfile.TarInfo(name)
                entry.size = len(data)
                archive.addfile(entry, io.BytesIO(data))
        with self.assertRaises(ValueError):
            MODULE.verify(str(path), sha(path.read_bytes()), image)


if __name__ == "__main__":
    unittest.main()
