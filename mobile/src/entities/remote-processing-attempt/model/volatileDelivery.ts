import type { UnverifiedVolatileResponse } from '@/shared/remote-gateway';

export interface VolatileDelivery {
    attemptId: string;
    operationRef: string;
    originalSha256: string;
    bytes: UnverifiedVolatileResponse;
    signal: AbortSignal;
    dispose(): void;
}
let slot: { attemptId: string; cancel(): void; delivery: VolatileDelivery | null; taken: boolean; abort: AbortController } | null = null;

/** Client-memory ownership only. One delivery, including local verification, may be active. */
export function reserveVolatileDelivery(attemptId: string, cancel: () => void): void {
    if (slot) throw new Error('capabilities-unavailable');
    slot = { attemptId, cancel, delivery: null, taken: false, abort: new AbortController() };
}
export function putVolatileDelivery(attemptId: string, operationRef: string, originalSha256: string, bytes: UnverifiedVolatileResponse): void {
    if (!slot || slot.attemptId !== attemptId || slot.delivery) {
        throw new Error('submission-unknown');
    }
    const owned = slot;
    let disposed = false;
    owned.delivery = {
        attemptId,
        operationRef,
        originalSha256,
        bytes,
        signal: owned.abort.signal,
        dispose() {
            if (disposed) return;
            disposed = true;
            bytes.dispose();
            if (slot === owned) slot = null;
        },
    };
}
export function takeVolatileDelivery(attemptId: string): VolatileDelivery | null {
    if (!slot || slot.attemptId !== attemptId || slot.taken || !slot.delivery) return null;
    slot.taken = true;
    return slot.delivery;
}
export function interruptVolatileDelivery(attemptId: string): void {
    const owned = slot;
    if (!owned || owned.attemptId !== attemptId || owned.abort.signal.aborted) return;
    owned.abort.abort();
    owned.cancel();
    if (!owned.taken) {
        owned.delivery?.dispose();
        if (slot === owned) slot = null;
    }
}
