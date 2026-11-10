"""Exercise fail-closed bootstrap ordering using stubbed host commands only."""
import os
import pathlib
import subprocess
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).with_name('start-private-test.sh').resolve()


class BootstrapTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = pathlib.Path(self.tmp.name)
        self.data = root / 'data'
        self.bin = root / 'bin'
        self.data.mkdir(); self.bin.mkdir()
        self.log = root / 'calls'
        for name in ['compose.yaml', 'published.json', 'deployment-preflight.mjs', 'deployment-config.mjs', 'metadata-check.mjs']:
            (self.data / name).write_text('fixture')
        (self.data / 'metadata-guard.sh').write_text('#!/bin/sh\necho guard >> "$MOCK_LOG"\n')
        config = self.data / 'settings.env'
        prefix = 'southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103/'
        config.write_text(''.join(f'{key}_IMAGE={prefix}{key.lower()}@sha256:{"a" * 64}\n' for key in ['GATEWAY', 'POSTGRES', 'PROXY', 'RATE']))
        config.chmod(0o600)
        self.stub('id', 'echo 0')
        self.stub('uname', 'echo x86_64')
        self.stub('stat', 'echo 600')
        self.stub('grep', 'exit 0')
        self.stub('curl', 'echo 34.1.2.3')
        self.stub('docker-credential-gcr', 'exit 0')
        self.stub('awk', 'case "$*" in */proc/meminfo*) exit 0;; *) exec /usr/bin/awk "$@";; esac')
        self.stub('iptables', '''echo "iptables $*" >> "$MOCK_LOG"
case "$*" in *" -C "*) exit 1;; esac
exit 0''')
        self.stub('docker', '''echo "docker $*" >> "$MOCK_LOG"
case "$*" in
  "version "*) echo 27.5.1;;
  "info "*LiveRestoreEnabled*) echo "${MOCK_LIVE_RESTORE:-false}";;
  "info "*) echo 2;;
  "ps "*) :;;
  "image inspect "*) echo amd64;;
  "inspect "*toonlira-translation-test_private*) echo 172.30.242.2;;
  "inspect "*toonlira-translation-test_proxy_egress*) echo 172.30.243.2;;
  "network inspect "*) echo false;;
  *deployment-preflight.mjs*) [ "${MOCK_PREFLIGHT_FAIL:-0}" = 0 ] || exit 1;;
  *metadata-check.mjs*deny*) [ "${MOCK_DENY_FAIL:-0}" = 0 ] || exit 1;;
  *" ps -q gateway"*) echo gateway-id;;
  *" ps -q proxy"*) echo proxy-id;;
esac
exit 0''')

    def stub(self, name, body):
        path = self.bin / name
        path.write_text('#!/bin/sh\n' + body + '\n')
        path.chmod(0o755)

    def run_script(self, **flags):
        env = dict(os.environ, PATH=str(self.bin) + ':/usr/bin:/bin', MOCK_LOG=str(self.log), **flags)
        result = subprocess.run(['/bin/bash', str(SCRIPT), str(self.data)], env=env, capture_output=True, text=True)
        return result, self.log.read_text().splitlines()

    def test_preflight_failure_never_starts_services(self):
        result, calls = self.run_script(MOCK_PREFLIGHT_FAIL='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any(' up -d ' in line for line in calls))

    def test_live_restore_enabled_never_starts_services(self):
        result, calls = self.run_script(MOCK_LIVE_RESTORE='true')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any(' up -d ' in line for line in calls))

    def test_failed_metadata_check_stops_proxy_and_keeps_quarantine(self):
        result, calls = self.run_script(MOCK_DENY_FAIL='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(any(' stop proxy' in line for line in calls))
        self.assertFalse(any(line.startswith('iptables -w -D DOCKER-USER') for line in calls))

    def test_quarantine_removed_only_after_both_checks(self):
        result, calls = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(all('--user 0:0' in line for line in calls if 'deployment-preflight.mjs' in line or 'metadata-check.mjs' in line))
        deny = next(i for i, line in enumerate(calls) if 'metadata-check.mjs dns' in line)
        removed = [i for i, line in enumerate(calls) if line.startswith('iptables -w -D DOCKER-USER')]
        self.assertEqual(len(removed), 2)
        self.assertTrue(all(i > deny for i in removed))


if __name__ == '__main__':
    unittest.main()
