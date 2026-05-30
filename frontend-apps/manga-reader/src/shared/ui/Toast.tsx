// Todo: Refatorar.

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { X, Check, AlertTriangle, Info } from 'lucide-react';
import { IconButton } from './IconButton';
import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ToastTone = 'accent' | 'success' | 'danger' | 'neutral';

export interface ToastConfig {
    id?: string;
    tone?: ToastTone;
    title: string;
    description?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
    icon?: LucideIcon;
}

interface ToastItem extends Required<Pick<ToastConfig, 'id' | 'tone' | 'title' | 'duration'>> {
    description?: string;
    action?: ToastConfig['action'];
    icon?: LucideIcon;
}

type ToastAction = { type: 'ADD'; toast: ToastItem } | { type: 'DISMISS'; id: string };

function reducer(state: ToastItem[], action: ToastAction): ToastItem[] {
    if (action.type === 'ADD') {
        const next = [action.toast, ...state].slice(0, 3);

        return next;
    }

    return state.filter(t => t.id !== action.id);
}

const defaultToneIcon: Record<ToastTone, LucideIcon> = {
    accent: Check,
    success: Check,
    danger: AlertTriangle,
    neutral: Info,
};

const toneLeftBorder: Record<ToastTone, string> = {
    accent: 'border-l-mr-accent',
    success: 'border-l-mr-accent',
    danger: 'border-l-mr-danger',
    neutral: 'border-l-mr-tertiary',
};

const toneIconColor: Record<ToastTone, string> = {
    accent: 'text-mr-accent',
    success: 'text-mr-accent',
    danger: 'text-mr-danger',
    neutral: 'text-mr-fg-muted',
};

interface ToastApi {
    toast: (cfg: ToastConfig) => string;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let counter = 0;

function ToastItemView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
    const hoverRef = useRef(false);

    const Icon = item.icon ?? defaultToneIcon[item.tone];

    useEffect(() => {
        if (item.duration === 0) return;

        const id = setInterval(() => {
            if (!hoverRef.current) {
                onDismiss(item.id);

                clearInterval(id);
            }
        }, item.duration);

        return () => clearInterval(id);
    }, [item.id, item.duration, onDismiss]);

    return (
        <div
            role={item.tone === 'danger' ? 'alert' : 'status'}
            onMouseEnter={() => {
                hoverRef.current = true;
            }}
            onMouseLeave={() => {
                hoverRef.current = false;
            }}
            onFocus={() => {
                hoverRef.current = true;
            }}
            onBlur={() => {
                hoverRef.current = false;
            }}
            className={cn(
                'flex items-start gap-3 rounded-mr-md border border-l-4 border-mr-border bg-mr-surface p-3 shadow-mr-elevated animate-mr-toast-in',
                toneLeftBorder[item.tone],
            )}
        >
            <Icon className={cn('mt-0.5 size-4 shrink-0', toneIconColor[item.tone])} aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <p className="text-mr-small font-mr-bold text-mr-fg">{item.title}</p>
                {item.description && <p className="mt-0.5 text-mr-tiny text-mr-fg-muted">{item.description}</p>}
                {item.action && (
                    <button
                        type="button"
                        onClick={() => {
                            item.action!.onClick();
                            onDismiss(item.id);
                        }}
                        className="mt-1 text-mr-tiny font-mr-bold text-mr-accent underline"
                    >
                        {item.action.label}
                    </button>
                )}
            </div>
            <IconButton icon={X} size="sm" variant="ghost" aria-label="Dispensar" onClick={() => onDismiss(item.id)} />
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, dispatch] = useReducer(reducer, []);

    const dismiss = useCallback((id: string) => {
        dispatch({ type: 'DISMISS', id });
    }, []);

    const toast = useCallback((cfg: ToastConfig): string => {
        const id = cfg.id ?? `toast-${++counter}`;

        const item: ToastItem = {
            id,
            tone: cfg.tone ?? 'neutral',
            title: cfg.title,
            description: cfg.description,
            duration: cfg.duration ?? 4000,
            action: cfg.action,
            icon: cfg.icon,
        };

        dispatch({ type: 'ADD', toast: item });

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
                    <ToastItemView key={t.id} item={t} onDismiss={dismiss} />
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
