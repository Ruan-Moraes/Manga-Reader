"""Ordering and fail-closed checks with an isolated, stubbed host."""
import os
import pathlib
import subprocess
import tempfile
import unittest

SOURCE = pathlib.Path(__file__).with_name('prepare-docker-and-start.sh')


class PrepareTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        base = pathlib.Path(self.tmp.name)
        self.root = base / 'root'; self.root.mkdir()
        self.bin = base / 'bin'; self.bin.mkdir()
        self.config = base / 'docker'; self.config.mkdir()
        (self.config / 'daemon.json').write_text('{"live-restore":true}')
        (self.root / 'configure-docker.mjs').write_text('fixture')
        (self.root / 'start-private-test.sh').write_text('echo start >> "$MOCK_LOG"\n')
        self.script = base / 'prepare.sh'
        self.script.write_text(SOURCE.read_text().replace('/etc/docker', str(self.config)))
        self.log = base / 'log'
        self.stub('id', 'echo 0')
        self.stub('uname', 'echo x86_64')
        self.stub('grep', 'exit 0')
        self.stub('docker-credential-gcr', 'exit 0')
        self.stub('iptables', 'echo "iptables $*" >> "$MOCK_LOG"; case "$*" in *" -C "*) exit 1;; esac; exit 0')
        self.stub('systemctl', 'echo "systemctl $*" >> "$MOCK_LOG"; [ "${MOCK_RESTART_FAIL:-0}" = 0 ]')
        self.stub('docker', '''echo "docker $*" >> "$MOCK_LOG"
case "$*" in
 "version "*) echo 27.5.1;;
 "ps -q") [ "${MOCK_RUNNING:-0}" = 0 ] || echo unrelated;;
 "info "*) echo "${MOCK_LIVE:-false}";;
 "image inspect "*) echo amd64;;
esac
exit 0''')

    def stub(self, name, content):
        p = self.bin / name
        p.write_text('#!/bin/sh\n' + content + '\n'); p.chmod(0o755)

    def run_prepare(self, **flags):
        env = dict(os.environ, PATH=str(self.bin) + ':/usr/bin:/bin', MOCK_LOG=str(self.log), **flags)
        result = subprocess.run(['/bin/bash', str(self.script), str(self.root)], env=env, capture_output=True, text=True)
        return result, self.log.read_text().splitlines()

    def test_restart_precedes_start(self):
        result, calls = self.run_prepare()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertLess(calls.index('systemctl restart docker'), calls.index('start'))
        self.assertTrue(any('/configure.mjs' in c for c in calls))

    def test_hold_proxy_egress_is_installed_before_start(self):
        result, calls = self.run_prepare(TOONLIRA_HOLD_PROXY_EGRESS='1')
        self.assertEqual(result.returncode, 0, result.stderr)
        hold = next(i for i, line in enumerate(calls) if line.startswith('iptables -w -I DOCKER-USER'))
        self.assertLess(hold, calls.index('start'))

    def test_invalid_hold_refuses_start(self):
        result, calls = self.run_prepare(TOONLIRA_HOLD_PROXY_EGRESS='unexpected')
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('start', calls)

    def test_running_container_refuses_to_change_daemon(self):
        result, calls = self.run_prepare(MOCK_RUNNING='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any('/configure.mjs' in c or c == 'start' for c in calls))

    def test_failed_restart_does_not_start_composition(self):
        result, calls = self.run_prepare(MOCK_RESTART_FAIL='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('start', calls)

    def test_live_restore_still_enabled_does_not_start(self):
        result, calls = self.run_prepare(MOCK_LIVE='true')
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('start', calls)


if __name__ == '__main__':
    unittest.main()
