import type { ToastConfig, ToastEntry } from './types';

/**
 * Store externo (fora do React) das notificações — fonte única de toasts da aplicação.
 *
 * Permite disparar toasts tanto pelo hook {@link useToast} (em componentes) quanto de forma
 * imperativa em serviços/mutations (via `@shared/service/util/toastService`). O `ToastProvider`
 * apenas assina este store com `useSyncExternalStore` e renderiza o viewport.
 */
const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;

let toasts: ToastEntry[] = [];
let counter = 0;

const listeners = new Set<() => void>();

const emit = () => {
    for (const listener of listeners) listener();
};

export const subscribeToasts = (listener: () => void) => {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
};

export const getToastsSnapshot = () => toasts;

export const pushToast = (cfg: ToastConfig): string => {
    const id = cfg.id ?? `toast-${++counter}`;

    const entry: ToastEntry = {
        id,
        tone: cfg.tone ?? 'neutral',
        title: cfg.title,
        description: cfg.description,
        duration: cfg.duration ?? DEFAULT_DURATION,
        action: cfg.action,
        icon: cfg.icon,
    };

    // Substitui um toast de mesmo id (dedupe) e mantém os mais recentes no topo da pilha.
    toasts = [entry, ...toasts.filter(t => t.id !== id)].slice(0, MAX_VISIBLE);
    emit();

    return id;
};

export const dismissToast = (id: string) => {
    if (!toasts.some(t => t.id === id)) return;

    toasts = toasts.filter(t => t.id !== id);
    emit();
};
