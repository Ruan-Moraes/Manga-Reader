/** Uses server capability time, never changes an existing attempt key during reconciliation. */
export function createVolatileIdempotencyKey(serverTime: string, entropyUuid: string): string {
    const time = Date.parse(serverTime);
    const entropy = entropyUuid.replaceAll('-', '');
    if (!Number.isSafeInteger(time) || time < 0 || time > 0xffffffffffff || !/^[0-9a-f]{32}$/i.test(entropy)) throw new Error('capabilities-unavailable');
    const timestamp = time.toString(16).padStart(12, '0');
    const variant = (8 | (parseInt(entropy[16]!, 16) & 3)).toString(16);
    return `${timestamp.slice(0, 8)}-${timestamp.slice(8)}-7${entropy.slice(0, 3)}-${variant}${entropy.slice(17, 20)}-${entropy.slice(20)}`.toLowerCase();
}
