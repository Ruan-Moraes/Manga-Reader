import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('prepare_bundle', Path(__file__).with_name('prepare-bundle.py'))
bundle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bundle)


class BundleTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.receipt = self.root / 'receipt.json'
        prefix = 'southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103/'
        self.data = {name: {'digest': prefix + name + '@sha256:' + 'a' * 64} for name in ('gateway', 'postgres', 'proxy', 'rate')}
        self.data['unrelated'] = {'secret': 'must-not-copy'}
        self.receipt.write_text(json.dumps(self.data))

    def test_bundle_contains_only_expected_files_and_matches_manifest(self):
        destination = self.root / 'bundle'
        bundle.create_bundle(destination, self.receipt)
        expected = set(bundle.FILES) | {'published.json', 'SHA256SUMS'}
        self.assertEqual({p.name for p in destination.iterdir()}, expected)
        for line in (destination / 'SHA256SUMS').read_text().splitlines():
            value, name = line.split('  ')
            self.assertEqual(value, bundle.digest(destination / name))
        self.assertNotIn('settings.env', expected)
        self.assertNotIn('must-not-copy', (destination / 'published.json').read_text())

    def test_invalid_receipt_never_creates_destination(self):
        self.data['gateway']['digest'] = 'unexpected'
        self.receipt.write_text(json.dumps(self.data))
        with self.assertRaises(ValueError):
            bundle.create_bundle(self.root / 'bundle', self.receipt)
        self.assertFalse((self.root / 'bundle').exists())

    def test_refuses_to_replace_existing_destination(self):
        existing = self.root / 'bundle'; existing.mkdir()
        (existing / 'preserve').write_text('data')
        with self.assertRaises(FileExistsError):
            bundle.create_bundle(existing, self.receipt)
        self.assertEqual((existing / 'preserve').read_text(), 'data')


if __name__ == '__main__':
    unittest.main()
