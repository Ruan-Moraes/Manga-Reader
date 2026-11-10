// Historical test fixture only: retired signed-URL delivery; never import from runtime.
import { fetch as expoFetch } from 'expo/fetch';

import { ensureReadableStream } from '../../src/shared/remote-gateway/webStreams';

const MAX_BYTES = 64 * 1024 * 1024;
const TIMEOUT_MS = 30_000;
export interface PrivateDownload {
    url: string;
    byteSize: number;
    mimeType: string;
}
const unavailable = () => new Error('localTranslation.downloadUnavailable');

/** Signed URLs carry their own authorization; never attach gateway credentials. */
export async function downloadPrivateBytes(
    input: PrivateDownload,
    external?: AbortSignal,
    fetcher: typeof fetch = expoFetch,
): Promise<Uint8Array<ArrayBuffer>> {
    try {
        const url = new URL(input.url);
        if (
            url.protocol !== 'https:' ||
            url.hostname !== 'storage.googleapis.com' ||
            url.port ||
            url.username ||
            url.password ||
            url.hash ||
            !url.search ||
            !Number.isSafeInteger(input.byteSize) ||
            input.byteSize < 1 ||
            input.byteSize > MAX_BYTES ||
            external?.aborted
        )
            throw unavailable();
        const controller = new AbortController();
        const abort = () => controller.abort();
        external?.addEventListener('abort', abort, { once: true });
        const timer = setTimeout(abort, TIMEOUT_MS);
        let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
        let complete = false;
        try {
            ensureReadableStream();
            const response = await fetcher(input.url, { method: 'GET', redirect: 'error', signal: controller.signal, headers: { Accept: input.mimeType } });
            if (
                response.status !== 200 ||
                (response.url && response.url !== input.url) ||
                response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== input.mimeType
            )
                throw unavailable();
            const length = response.headers.get('content-length');
            if (length !== null && (!/^\d+$/.test(length) || Number(length) !== input.byteSize)) throw unavailable();
            reader = response.body?.getReader();
            if (!reader) throw unavailable();
            const bytes = new Uint8Array(input.byteSize);
            let offset = 0;
            while (true) {
                if (controller.signal.aborted) throw unavailable();
                const chunk = await reader.read();
                if (chunk.done) break;
                if (chunk.value.byteLength > bytes.length - offset) throw unavailable();
                bytes.set(chunk.value, offset);
                offset += chunk.value.byteLength;
            }
            if (controller.signal.aborted || offset !== bytes.length) throw unavailable();
            complete = true;
            return bytes;
        } finally {
            clearTimeout(timer);
            external?.removeEventListener('abort', abort);
            if (reader && !complete) await reader.cancel().catch(() => undefined);
            reader?.releaseLock();
        }
    } catch {
        throw unavailable();
    }
}
