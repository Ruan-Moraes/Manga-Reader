import { createRateProxy } from './rate-proxy.mjs';

const server = createRateProxy();
server.requestTimeout = 240000;
server.headersTimeout = 10000;
server.listen(8085, '0.0.0.0');
