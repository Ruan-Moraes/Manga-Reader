import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { ToastItem } from './ToastItem';
import { dismissToast, getToastsSnapshot, pushToast, subscribeToasts } from './toastStore';
import type { ToastApi } from './types';

/**
 * Monta os viewports de toast (padrão: canto inferior direito, acima do header e da tab bar
 * móvel; opcionalmente canto superior direito via `position: 'top'`, hoje só usado pelo toast de
 * "Limpar cache" disparado com o menu lateral aberto) e reflete o {@link toastStore}. Os dados vêm
 * do store externo, então toasts disparados fora de componentes React (serviços/mutations) também
 * aparecem aqui.
 *
 * Renderizado via portal direto em `document.body`: assim o viewport nunca fica preso a um
 * stacking context isolado por algum ancestral (ex.: `backdrop-filter`/`transform` de um modal),
 * o que já causou toasts aparecendo visualmente atrás do overlay do modal de perfil.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
    const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot);

    const bottomToasts = toasts.filter(t => t.position === 'bottom');
    const topToasts = toasts.filter(t => t.position === 'top');

    return (
        <>
            {children}
            {createPortal(
                <>
                    {!!bottomToasts.length && (
                        <div
                            role="region"
                            aria-label="Notificações"
                            aria-live="polite"
                            className="pointer-events-none fixed bottom-4 right-4 z-mr-toast flex w-[360px] max-w-[calc(100vw-2rem)] flex-col-reverse gap-2.5 max-sm:bottom-20 max-sm:left-1/2 max-sm:right-auto max-sm:-translate-x-1/2"
                        >
                            {bottomToasts.map(t => (
                                <ToastItem key={t.id} item={t} onDismiss={dismissToast} />
                            ))}
                        </div>
                    )}
                    {!!topToasts.length && (
                        <div
                            role="region"
                            aria-label="Notificações"
                            aria-live="polite"
                            className="pointer-events-none fixed top-4 right-4 z-mr-toast flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2.5 max-sm:left-1/2 max-sm:right-auto max-sm:-translate-x-1/2"
                        >
                            {topToasts.map(t => (
                                <ToastItem key={t.id} item={t} onDismiss={dismissToast} />
                            ))}
                        </div>
                    )}
                </>,
                document.body,
            )}
        </>
    );
}

export function useToast(): ToastApi {
    return { toast: pushToast, dismiss: dismissToast };
}

export default ToastProvider;
