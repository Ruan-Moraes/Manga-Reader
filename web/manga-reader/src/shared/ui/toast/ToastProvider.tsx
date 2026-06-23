import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import { ToastItem } from './ToastItem';
import { dismissToast, getToastsSnapshot, pushToast, subscribeToasts } from './toastStore';
import type { ToastApi } from './types';

/**
 * Monta o viewport único de toasts (canto inferior direito, acima do header e da tab bar móvel)
 * e reflete o {@link toastStore}. Os dados vêm do store externo, então toasts disparados fora de
 * componentes React (serviços/mutations) também aparecem aqui.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
    const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot);

    return (
        <>
            {children}
            <div
                role="region"
                aria-label="Notificações"
                aria-live="polite"
                className="pointer-events-none fixed bottom-4 right-4 z-mr-toast flex w-[360px] max-w-[calc(100vw-2rem)] flex-col-reverse gap-2.5 max-sm:bottom-20 max-sm:left-1/2 max-sm:right-auto max-sm:-translate-x-1/2"
            >
                {toasts.map(t => (
                    <ToastItem key={t.id} item={t} onDismiss={dismissToast} />
                ))}
            </div>
        </>
    );
}

export function useToast(): ToastApi {
    return { toast: pushToast, dismiss: dismissToast };
}

export default ToastProvider;
