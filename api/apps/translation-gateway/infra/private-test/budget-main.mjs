import { createBudgetServer, readBudgetConfig } from './budget-server.mjs';

const config = readBudgetConfig(process.env);
const port = Number(process.env.PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
const server = createBudgetServer(config);
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(port, '0.0.0.0');
