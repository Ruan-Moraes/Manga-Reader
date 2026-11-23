import importlib.util
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest
import zipfile


SCRIPT = pathlib.Path(__file__).with_name("worker-jar-inventory.py")
SPEC = importlib.util.spec_from_file_location("worker_jar_inventory", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class WorkerJarInventoryTest(unittest.TestCase):
    def test_inventory_is_stable_and_covers_dependency_and_license(self):
        with tempfile.TemporaryDirectory() as directory:
            directory = os.path.realpath(directory)
            jar = os.path.join(directory, "worker.jar")
            with zipfile.ZipFile(jar, "w") as archive:
                archive.writestr("BOOT-INF/lib/one.jar", b"dependency")
                archive.writestr("BOOT-INF/classes/rendering/fonts/OFL.txt", b"license")
            first = MODULE.inventory(jar)
            self.assertEqual(first, MODULE.inventory(jar))
            self.assertEqual(len(first["entries"]), 2)
            output = subprocess.check_output([sys.executable, str(SCRIPT), jar])
            self.assertEqual(json.loads(output), first)

    def test_rejects_symlink_and_missing_dependencies(self):
        with tempfile.TemporaryDirectory() as directory:
            directory = os.path.realpath(directory)
            jar = os.path.join(directory, "empty.jar")
            with zipfile.ZipFile(jar, "w") as archive:
                archive.writestr("unrelated", b"data")
            link = os.path.join(directory, "link.jar")
            os.symlink(jar, link)
            with self.assertRaises(ValueError):
                MODULE.inventory(link)
            with self.assertRaises(ValueError):
                MODULE.inventory(jar)


if __name__ == "__main__":
    unittest.main()
