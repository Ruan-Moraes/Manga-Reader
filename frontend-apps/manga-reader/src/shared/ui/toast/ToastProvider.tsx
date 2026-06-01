import { createContext, useCallback, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

import { ToastItem } from './ToastItem';
import type { ToastApi, ToastConfig, ToastEntry } from './types';

type ToastAction = { type: 'ADD'; toast: ToastEntry } | { type: 'DISMISS'; id: string };

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;

function reducer(state: ToastEntry[], action: ToastAction): ToastEntry[] {
    if (action.type === 'ADD') {
        return [action.toast, ...state].slice(0, MAX_VISIBLE);
    }

    return state.filter(t => t.id !== action.id);
}

const ToastContext = createContext<ToastApi | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, dispatch] = useReducer(reducer, []);

    const dismiss = useCallback((id: string) => {
        dispatch({ type: 'DISMISS', id });
    }, []);

    const toast = useCallback((cfg: ToastConfig): string => {
        const id = cfg.id ?? `toast-${++counter}`;

        dispatch({
            type: 'ADD',
            toast: {
                id,
                tone: cfg.tone ?? 'neutral',
                title: cfg.title,
                description: cfg.description,
                duration: cfg.duration ?? DEFAULT_DURATION,
                action: cfg.action,
                icon: cfg.icon,
            },
        });

        return id;
    }, []);

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            <div
                role="region"
                aria-label="Notificações"
                aria-live="polite"
                className="fixed right-4 top-4 z-mr-toast flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2 max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:right-auto"
            >
                {toasts.map(t => (
                    <ToastItem key={t.id} item={t} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);

    if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');

    return ctx;
}

export default ToastProvider;
