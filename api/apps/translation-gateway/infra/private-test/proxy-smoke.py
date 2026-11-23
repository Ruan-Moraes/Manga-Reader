"""Exercise only synthetic traffic, then remove exactly the containers created here."""
import http.client
import json
import os
import pathlib
import socket
import subprocess
import tempfile
import time
import uuid

HERE = pathlib.Path(__file__).resolve().parent
RUN = "toonlira-proxy-test-" + uuid.uuid4().hex[:12]
created = []


def docker(*args):
    return subprocess.run(["docker", *args], check=True, text=True, capture_output=True, timeout=60).stdout.strip()


def request(port, method, path, body=None, headers=None):
    conn = http.client.HTTPConnection("127.0.0.1", port, timeout=20)
    try:
        conn.request(method, path, body=body, headers=headers or {})
        response = conn.getresponse()
        return response.status, response.read()
    finally:
        conn.close()


def main():
    with tempfile.TemporaryDirectory(prefix="toonlira-proxy-test-") as tmp:
        root = pathlib.Path(tmp)
        (root / "legal/terms").mkdir(parents=True)
        (root / "legal/terms/index.html").write_text("synthetic legal page")
        upstream = docker("run", "-d", "--name", RUN + "-upstream", "--label", "toonlira-test=" + RUN,
                          "-p", "127.0.0.1::8080", "-v", str(HERE / "fake-upstream.py") + ":/probe.py:ro",
                          "python:3.13-alpine", "python", "-u", "/probe.py")
        created.append(upstream)
        proxy = docker("run", "-d", "--name", RUN + "-proxy", "--label", "toonlira-test=" + RUN,
                       "--network", "container:" + upstream, "--read-only", "--tmpfs", "/tmp",
                       "--tmpfs", "/config", "--tmpfs", "/data", "-e", "PUBLIC_HOST=http://:8080",
                       "-v", str(HERE / "Caddyfile") + ":/etc/caddy/Caddyfile:ro", "-v", str(root) + ":/srv:ro",
                       "caddy:2.11.7-alpine", "caddy", "run", "--config", "/etc/caddy/Caddyfile")
        created.append(proxy)
        port = int(docker("port", upstream, "8080/tcp").rsplit(":", 1)[-1])
        for _ in range(100):
            try:
                if request(port, "GET", "/v2/capabilities")[0] == 200:
                    break
            except OSError:
                pass
            time.sleep(0.1)
        else:
            raise AssertionError("proxy did not start")
        baseline_changes = set(docker("diff", proxy).splitlines())
        baseline_temporary_files = docker("exec", proxy, "sh", "-c", "find /tmp /config /data -type f | sort")

        assert request(port, "GET", "/actuator/health")[0] == 404
        assert request(port, "GET", "/legal/terms/") == (200, b"synthetic legal page")
        status, large_response = request(port, "GET", "/v2/capabilities", headers={"X-Synthetic-Large-Response": "yes"})
        assert status == 200 and len(large_response) == 64 * 1024 * 1024
        assert request(port, "POST", "/v2/page-translations", b"x" * (12 * 1024 * 1024))[0] == 200
        try:
            status, _ = request(port, "POST", "/v2/page-translations", b"x" * (12 * 1024 * 1024 + 1))
            assert status != 200, f"oversized request accepted: {status}"
        except (OSError, http.client.HTTPException):
            pass

        before = json.loads(request(port, "GET", "/v2/capabilities")[1])["calls"]
        try:
            status, _ = request(port, "POST", "/v2/page-translations", b"SYNTHETIC_PRIVATE_MARKER", {
                "Idempotency-Key": "drop", "Authorization": "Bearer SYNTHETIC_PRIVATE_MARKER"})
            assert status >= 500
        except (OSError, http.client.HTTPException):
            pass
        after = json.loads(request(port, "GET", "/v2/capabilities")[1])["calls"]
        assert after == before + 1, f"unexpected upstream retries: {before} -> {after}"

        client = socket.create_connection(("127.0.0.1", port), timeout=10)
        client.sendall(b"POST /v2/page-translations HTTP/1.1\r\nHost: localhost\r\nContent-Length: 1\r\nIdempotency-Key: cancel\r\n\r\nx")
        for _ in range(100):
            if json.loads(request(port, "GET", "/v2/capabilities")[1])["active"]:
                break
            time.sleep(0.1)
        else:
            raise AssertionError("upstream never received the cancellation fixture")
        client.close()
        for _ in range(100):
            if json.loads(request(port, "GET", "/v2/capabilities")[1])["cancelled"]:
                break
            time.sleep(0.1)
        else:
            raise AssertionError("client disconnect did not cancel upstream")
        changes = set(docker("diff", proxy).splitlines())
        assert changes == baseline_changes, f"proxy filesystem changed during requests: {changes}"
        temporary_files = docker("exec", proxy, "sh", "-c", "find /tmp /config /data -type f | sort")
        assert temporary_files == baseline_temporary_files, f"unexpected temporary files: {temporary_files}"
        logs = subprocess.run(["docker", "logs", proxy], capture_output=True, text=True, check=True, timeout=60)
        assert "SYNTHETIC_PRIVATE_MARKER" not in logs.stdout + logs.stderr, "sensitive fixture appeared in proxy logs"
        print(json.dumps({"run": RUN, "allowedBytes": 12 * 1024 * 1024, "oversizeRejected": True,
                          "responseBytes": len(large_response), "retryCount": 0, "disconnectPropagated": True,
                          "containerWrites": False, "fixtureAbsentFromLogs": True}))


try:
    main()
finally:
    for container in reversed(created):
        subprocess.run(["docker", "rm", "-f", container], capture_output=True, timeout=60, check=False)
