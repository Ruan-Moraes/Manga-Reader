import http from 'node:http';
import net from 'node:net';
import { RequestLimiter } from './request-limiter.mjs';

// This listener must be reachable only by Caddy on a private network. Caddy
// must overwrite x-toonlira-client with its direct peer address.
export function createRateProxy({ upstreamHost = 'gateway', upstreamPort = 8084, limiter = new RequestLimiter(), timeoutMs = 240000 } = {}) {
  return http.createServer((request, response) => {
    const ip = request.headers['x-toonlira-client'];
    if (typeof ip !== 'string' || !net.isIP(ip) || !limiter.allow(ip)) {
      response.writeHead(429, { 'cache-control': 'no-store', 'content-type': 'application/problem+json' });
      response.end(JSON.stringify({ contractVersion: '2.0', code: 'quota-exceeded', retryable: false }));
      return;
    }
    const headers = { ...request.headers };
    delete headers['x-toonlira-client'];
    delete headers.connection;
    const upstream = http.request({ hostname: upstreamHost, port: upstreamPort, method: request.method, path: request.url, headers }, upstreamResponse => {
      upstreamResponse.on('error', () => response.destroy());
      response.writeHead(upstreamResponse.statusCode, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    });
    upstream.setTimeout(timeoutMs, () => upstream.destroy());
    upstream.on('error', () => {
      if (!response.headersSent) response.writeHead(502, { 'cache-control': 'no-store' });
      response.end();
    });
    request.on('aborted', () => upstream.destroy());
    request.on('error', () => upstream.destroy());
    response.on('close', () => { if (!response.writableFinished) upstream.destroy(); });
    request.pipe(upstream);
  });
}
