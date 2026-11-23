// In-memory, bounded protection for one test gateway. This does not replace
// the durable provider-attempt quota or protect against volumetric attacks.
export class RequestLimiter {
  constructor({ windowMs = 60000, perClient = 30, global = 180, maxClients = 4096, now = Date.now } = {}) {
    if (![windowMs, perClient, global, maxClients].every(n => Number.isSafeInteger(n) && n > 0)) throw Error('Invalid rate limits');
    this.windowMs = windowMs;
    this.perClient = perClient;
    this.globalLimit = global;
    this.maxClients = maxClients;
    this.now = now;
    this.clients = new Map();
    this.windowStart = now();
    this.globalCount = 0;
  }

  allow(client) {
    if (typeof client !== 'string' || client.length < 2 || client.length > 64) return false;
    const time = this.now();
    // Clock regressions restart the window without expanding memory usage.
    if (time < this.windowStart || time - this.windowStart >= this.windowMs) {
      this.windowStart = time;
      this.globalCount = 0;
      this.clients.clear();
    }
    const count = this.clients.get(client);
    if (this.globalCount >= this.globalLimit || (count ?? 0) >= this.perClient || (count === undefined && this.clients.size >= this.maxClients)) return false;
    this.clients.set(client, (count ?? 0) + 1);
    this.globalCount++;
    return true;
  }
}
