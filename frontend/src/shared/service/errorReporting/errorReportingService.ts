import { createHttpClient } from '@shared/service/http/httpClient';
import { API_URLS } from '@shared/constant/API_URLS';

const AUTH_STORAGE_KEY = 'manga-reader:auth-user';
const DEDUP_WINDOW_MS = 5_000;

interface ErrorReport {
    message: string;
    stackTrace: string | null;
    source: 'error-boundary' | 'unhandled-rejection' | 'window-error';
    url: string;
    userAgent: string;
    userId: string | null;
}

/** Cliente HTTP isolado — sem auth, sem toasts, para evitar loops de erro. */
const errorClient = createHttpClient({
    skipAuth: true,
    silentErrors: true,
});

/** Erros recentemente reportados — chave é `message|source`, valor é timestamp. */
const recentErrors = new Map<string, number>();

function getUserId(): string | null {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.userId ?? null;
    } catch {
        return null;
    }
}

function isDuplicate(message: string, source: string): boolean {
    const key = `${message}|${source}`;

    const now = Date.now();

    const lastReported = recentErrors.get(key);

    if (lastReported && now - lastReported < DEDUP_WINDOW_MS) {
        return true;
    }

    recentErrors.set(key, now);

    return false;
}

/**
 * Envia relatório de erro para o backend (fire-and-forget).
 * Nunca lança exceção — erros no envio são silenciosamente ignorados.
 * Deduplicação: ignora erros idênticos reportados nos últimos 5 segundos.
 */
export function reportError(
    message: string,
    stackTrace: string | null,
    source: ErrorReport['source'],
): void {
    if (isDuplicate(message, source)) return;

    const payload: ErrorReport = {
        message,
        stackTrace,
        source,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: getUserId(),
    };

    errorClient.post(API_URLS.ERROR_LOGS, payload).catch(() => {});
}
