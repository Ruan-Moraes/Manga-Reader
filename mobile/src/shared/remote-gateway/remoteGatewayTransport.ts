import { fetch as expoFetch } from 'expo/fetch';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RESPONSE_BYTES = 64 * 1024;

export interface RemoteGatewayResponse {
    status: number;
    headers: Headers;
    body: unknown;
}

export interface RemoteGatewayMultipartFile {
    uri: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface RemoteGatewayTransport {
    request(
        path: string,
        options?: { method?: 'GET' | 'POST'; token?: string; headers?: Readonly<Record<string, string>>; body?: unknown; signal?: AbortSignal },
    ): Promise<RemoteGatewayResponse>;
    upload(
        path: string,
        fields: Readonly<Record<string, string>>,
        file: RemoteGatewayMultipartFile,
        options: { token: string; headers?: Readonly<Record<string, string>>; signal?: AbortSignal },
    ): Promise<RemoteGatewayResponse>;
}

export class RemoteGatewayTransportError extends Error {
    constructor(readonly code: 'invalid-origin' | 'timeout' | 'network' | 'redirect' | 'response-too-large' | 'invalid-response') {
        super(code);
    }
}

function validatedOrigin(value: string | undefined): URL {
    if (!value) throw new RemoteGatewayTransportError('invalid-origin');
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new RemoteGatewayTransportError('invalid-origin');
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
        throw new RemoteGatewayTransportError('invalid-origin');
    }
    return url;
}

function safePath(path: string): string {
    if (!path.startsWith('/v1/') || path.includes('://')) throw new RemoteGatewayTransportError('invalid-origin');
    return path;
}

function requestUrl(path: string, origin: URL): string {
    const url = new URL(safePath(path), origin);
    if (url.origin !== origin.origin || !url.pathname.startsWith('/v1/')) throw new RemoteGatewayTransportError('invalid-origin');
    return url.toString();
}

function requestSignal(external: AbortSignal | undefined, timeoutMs: number): { signal: AbortSignal; dispose(): void; timedOut(): boolean } {
    const controller = new AbortController();
    let timeout = false;
    const timer = setTimeout(() => {
        timeout = true;
        controller.abort();
    }, timeoutMs);
    const abort = () => controller.abort();
    external?.addEventListener('abort', abort, { once: true });
    if (external?.aborted) controller.abort();
    return {
        signal: controller.signal,
        dispose: () => {
            clearTimeout(timer);
            external?.removeEventListener('abort', abort);
        },
        timedOut: () => timeout,
    };
}

async function parseResponse(response: Response, origin: URL, maxResponseBytes: number): Promise<RemoteGatewayResponse> {
    const reader = response.body?.getReader();
    let consumed = false;
    try {
        if (response.url && new URL(response.url).origin !== origin.origin) throw new RemoteGatewayTransportError('redirect');
        const declaredLength = Number(response.headers.get('content-length'));
        if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) throw new RemoteGatewayTransportError('response-too-large');
        if (!reader) return { status: response.status, headers: response.headers, body: null };

        const bytes = new Uint8Array(maxResponseBytes);
        let length = 0;
        while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            if (chunk.value.byteLength > maxResponseBytes - length) throw new RemoteGatewayTransportError('response-too-large');
            bytes.set(chunk.value, length);
            length += chunk.value.byteLength;
        }
        consumed = true;
        if (length === 0) return { status: response.status, headers: response.headers, body: null };
        try {
            return { status: response.status, headers: response.headers, body: JSON.parse(new TextDecoder().decode(bytes.subarray(0, length))) as unknown };
        } catch {
            throw new RemoteGatewayTransportError('invalid-response');
        }
    } finally {
        // Do not let a transport-specific cancellation promise hide the original error.
        if (reader && !consumed) void reader.cancel().catch(() => undefined);
        reader?.releaseLock();
    }
}

export function createRemoteGatewayTransport(
    options: {
        origin?: string;
        timeoutMs?: number;
        maxResponseBytes?: number;
        fetcher?: typeof fetch;
    } = {},
): RemoteGatewayTransport {
    const origin = validatedOrigin(options.origin ?? process.env.EXPO_PUBLIC_TRANSLATION_GATEWAY_URL);
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
    const fetcher = options.fetcher ?? expoFetch;

    const execute = async (path: string, init: RequestInit, externalSignal?: AbortSignal) => {
        const controlled = requestSignal(externalSignal, timeoutMs);
        try {
            const response = await fetcher(requestUrl(path, origin), {
                ...init,
                redirect: 'error',
                signal: controlled.signal,
            });
            return await parseResponse(response, origin, maxResponseBytes);
        } catch (error) {
            if (error instanceof RemoteGatewayTransportError) throw error;
            if (controlled.timedOut()) throw new RemoteGatewayTransportError('timeout');
            throw new RemoteGatewayTransportError('network');
        } finally {
            controlled.dispose();
        }
    };

    return {
        request(path, request = {}) {
            const headers: Record<string, string> = { Accept: 'application/json', ...request.headers };
            if (request.token) headers.Authorization = `Bearer ${request.token}`;
            if (request.body !== undefined) headers['Content-Type'] = 'application/json';
            return execute(
                path,
                {
                    method: request.method ?? 'GET',
                    headers,
                    body: request.body === undefined ? undefined : JSON.stringify(request.body),
                },
                request.signal,
            );
        },
        upload(path, fields, file, request) {
            const body = new FormData();
            for (const [name, value] of Object.entries(fields)) body.append(name, value);
            body.append('page', { uri: file.uri, type: file.mimeType, name: 'page' } as unknown as Blob);
            return execute(
                path,
                {
                    method: 'POST',
                    headers: { Accept: 'application/json', Authorization: `Bearer ${request.token}`, ...request.headers },
                    body,
                },
                request.signal,
            );
        },
    };
}
