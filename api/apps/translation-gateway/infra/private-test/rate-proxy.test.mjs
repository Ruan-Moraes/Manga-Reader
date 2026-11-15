import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { RequestLimiter } from './request-limiter.mjs';
import { createRateProxy } from './rate-proxy.mjs';

test('streams requests without forwarding the private identity header and applies the limit', async t => {
  let count = 0;
  const upstream = http.createServer((request, response) => {
    count++;
    assert.equal(request.headers['x-toonlira-client'], undefined);
    request.pipe(response);
  });
  upstream.listen(0, '127.0.0.1'); await once(upstream, 'listening');
  t.after(() => upstream.close());
  const proxy = createRateProxy({ upstreamHost: '127.0.0.1', upstreamPort: upstream.address().port,
    limiter: new RequestLimiter({ perClient: 1 }) });
  proxy.listen(0, '127.0.0.1'); await once(proxy, 'listening');
  t.after(() => proxy.close());
  const url = `http://127.0.0.1:${proxy.address().port}/v2/page-translations`;
  const options = { method: 'POST', headers: { 'x-toonlira-client': '192.0.2.1' }, body: 'synthetic' };
  const first = await fetch(url, options);
  assert.equal(await first.text(), 'synthetic');
  assert.equal((await fetch(url, options)).status, 429);
  assert.equal((await fetch(url, { method: 'POST', body: 'synthetic' })).status, 429);
  assert.equal(count, 1);
});

test('streams a large response and propagates client cancellation without retry', async t => {
  let count = 0;
  let disconnected;
  const disconnect = new Promise(resolve => { disconnected = resolve; });
  const upstream = http.createServer((request, response) => {
    count++;
    if (request.url === '/cancel') {
      response.writeHead(200); response.write('start');
      response.on('close', disconnected);
      return;
    }
    response.writeHead(200, { 'content-length': String(64 * 1024 * 1024) });
    const chunk = Buffer.alloc(1024 * 1024);
    let sent = 0;
    const send = () => {
      while (sent < 64) { sent++; if (!response.write(chunk)) return response.once('drain', send); }
      response.end();
    };
    send();
  });
  upstream.listen(0, '127.0.0.1'); await once(upstream, 'listening');
  t.after(() => upstream.close());
  const proxy = createRateProxy({ upstreamHost: '127.0.0.1', upstreamPort: upstream.address().port });
  proxy.listen(0, '127.0.0.1'); await once(proxy, 'listening');
  t.after(() => proxy.close());
  const root = `http://127.0.0.1:${proxy.address().port}`;
  const options = { headers: { 'x-toonlira-client': '192.0.2.1' } };
  const large = await fetch(root + '/large', options);
  let total = 0;
  for await (const chunk of large.body) total += chunk.byteLength;
  assert.equal(total, 64 * 1024 * 1024);
  const abort = new AbortController();
  const ongoing = await fetch(root + '/cancel', { ...options, signal: abort.signal });
  await ongoing.body.getReader().read();
  abort.abort();
  await Promise.race([disconnect, new Promise((_, reject) => setTimeout(() => reject(Error('Disconnect not propagated')), 5000))]);
  assert.equal(count, 2);
});
