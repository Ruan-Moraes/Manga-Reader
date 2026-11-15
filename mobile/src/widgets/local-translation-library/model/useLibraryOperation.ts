import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { showToast } from '@/shared/ui';

export type LibraryOperationMessage = 'error' | 'activeError' | 'cleanup';

export interface LibraryOperationOptions {
    /** Toast shown when the action succeeds (create, rename, move, delete…). */
    success?: string;
}

const MESSAGE_KEY: Record<LibraryOperationMessage, string> = {
    activeError: 'works.activeError',
    cleanup: 'works.cleanup',
    error: 'works.error',
};

/**
 * Serializes library mutations and reloads after each one. The result is reported as a temporary toast (2026-11-10):
 * success when the caller gives a message, the failure (or pending cleanup) always.
 */
export function useLibraryOperation(reload: () => Promise<void>) {
    const { t } = useTranslation('localTranslation');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<LibraryOperationMessage | null>(null);
    const active = useRef(false);

    const run = async (action: () => Promise<{ cleanupPending: boolean } | 'cancelled' | unknown>, options: LibraryOperationOptions = {}) => {
        if (active.current) return false;
        active.current = true;
        setBusy(true);
        setMessage(null);
        let ok = true;
        let outcomeMessage: LibraryOperationMessage | null = null;
        let outcome: unknown;
        try {
            outcome = await action();
            if (outcome && typeof outcome === 'object' && 'cleanupPending' in outcome && outcome.cleanupPending) outcomeMessage = 'cleanup';
        } catch (error) {
            ok = false;
            outcomeMessage = error instanceof Error && error.message === 'localWork.processingActive' ? 'activeError' : 'error';
        } finally {
            await reload().catch(() => undefined);
            active.current = false;
            setBusy(false);
        }
        setMessage(outcomeMessage);
        if (outcomeMessage) showToast({ tone: outcomeMessage === 'cleanup' ? 'warning' : 'danger', title: t(MESSAGE_KEY[outcomeMessage]) });
        // An action may return 'cancelled' (e.g. the picker was dismissed): nothing changed, nothing to report.
        else if (ok && options.success && outcome !== 'cancelled') showToast({ tone: 'success', title: options.success });
        return ok;
    };

    return { busy, message, clearMessage: () => setMessage(null), run };
}
