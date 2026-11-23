import { ReadableStream as PonyfillReadableStream } from 'web-streams-polyfill';

/** Expo fetch constructs the response body lazily; Hermes may lack this global. */
export function ensureReadableStream(): void {
    if (typeof globalThis.ReadableStream === 'undefined') {
        globalThis.ReadableStream = PonyfillReadableStream as unknown as typeof globalThis.ReadableStream;
    }
}
