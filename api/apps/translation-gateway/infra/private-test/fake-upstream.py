"""Synthetic loopback-only upstream for exercising the public proxy."""
import json
import select
import socket
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock

state = {"calls": 0, "active": False, "cancelled": False}
lock = Lock()


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *_args):
        pass

    def reply(self, status, body):
        self.send_response(status)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.headers.get("X-Synthetic-Large-Response") == "yes":
            self.send_response(200)
            self.send_header("Content-Length", str(64 * 1024 * 1024))
            self.end_headers()
            for _ in range(1024):
                self.wfile.write(b"x" * 65536)
            return
        with lock:
            body = json.dumps(state).encode()
        self.reply(200, body)

    def do_POST(self):
        mode = self.headers.get("Idempotency-Key", "normal")
        with lock:
            state["calls"] += 1
        if mode == "drop":
            self.rfile.read(1)
            self.connection.shutdown(socket.SHUT_RDWR)
            self.close_connection = True
            return
        length = int(self.headers.get("Content-Length", "0"))
        while length:
            chunk = self.rfile.read(min(length, 65536))
            if not chunk:
                return
            length -= len(chunk)
        if mode == "cancel":
            with lock:
                state["active"] = True
            deadline = time.monotonic() + 10
            while time.monotonic() < deadline:
                ready, _, _ = select.select([self.connection], [], [], 0.1)
                if ready and not self.connection.recv(1, socket.MSG_PEEK):
                    with lock:
                        state["cancelled"] = True
                    return
            self.reply(200, b"late")
            return
        self.reply(200, b"ok")


ThreadingHTTPServer(("127.0.0.1", 8084), Handler).serve_forever()
