import importlib.util
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile

spec = importlib.util.spec_from_file_location('verify_apk', Path(__file__).with_name('verify-android-apk.py'))
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)


class BundleTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.apk = Path(self.tmp.name) / 'fixture.apk'
        self.origin = 'https://toonlira-192-0-2-1.sslip.io'

    def write(self, body):
        with ZipFile(self.apk, 'w') as apk:
            apk.writestr(module.BUNDLE, body)

    def test_accepts_expected_origin(self):
        self.write(b'fixture ' + self.origin.encode())
        module.check_bundle(self.apk, self.origin)

    def test_rejects_stale_or_missing_origin(self):
        for body in (b'fixture', self.origin.encode() + module.OLD_ORIGIN.encode()):
            self.write(body)
            with self.assertRaises(ValueError): module.check_bundle(self.apk, self.origin)

    def test_rejects_insecure_or_non_origin_url(self):
        self.write(self.origin.encode())
        for url in ('http://example.com', 'https://example.com/path', 'https://user@example.com', module.OLD_ORIGIN):
            with self.assertRaises(ValueError): module.check_bundle(self.apk, url)


if __name__ == '__main__':
    unittest.main()
