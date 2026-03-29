import { reportError } from './errorReportingService';

let errorListener: ((event: ErrorEvent) => void) | null = null;
let rejectionListener: ((event: PromiseRejectionEvent) => void) | null = null;

/**
 * Registra listeners globais para erros não capturados pelo React Error Boundary.
 * Deve ser chamado uma vez na inicialização da aplicação.
 */
export function initGlobalErrorHandler(): void {
    errorListener = (event: ErrorEvent) => {
        const message = event.message || 'Unknown error';

        const stack = event.error?.stack ?? null;

        reportError(message, stack, 'window-error');
    };

    rejectionListener = (event: PromiseRejectionEvent) => {
        const reason = event.reason;

        const message =
            reason instanceof Error
                ? reason.message
                : String(reason ?? 'Unhandled promise rejection');

        const stack = reason instanceof Error ? (reason.stack ?? null) : null;

        reportError(message, stack, 'unhandled-rejection');
    };

    window.addEventListener('error', errorListener);
    window.addEventListener('unhandledrejection', rejectionListener);
}

/**
 * Remove os listeners globais. Útil para cleanup em testes.
 */
export function cleanupGlobalErrorHandler(): void {
    if (errorListener) {
        window.removeEventListener('error', errorListener);

        errorListener = null;
    }

    if (rejectionListener) {
        window.removeEventListener('unhandledrejection', rejectionListener);

        rejectionListener = null;
    }
}
