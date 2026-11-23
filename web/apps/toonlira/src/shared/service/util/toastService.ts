import { AlertTriangle } from 'lucide-react';

import { pushToast } from '@ui/toast/toastStore';
import type { ToastPosition, ToastTone } from '@ui/toast/types';

/**
 * Notificações transacionais (serviços/mutations) — fachada imperativa sobre o toast unificado da
 * design system (`@ui/Toast`). Mantém a API `showXToast` histórica, agora renderizada pelo mesmo
 * viewport do `useToast`. Não depende mais de bibliotecas externas de toast.
 */
export interface AppToastOptions {
    /** Id estável para deduplicar/atualizar um toast (ex.: 'reply-comment-success'). */
    toastId?: string;
    /** Duração em ms (0 = não fecha sozinho). Padrão do toast: 4000ms. */
    duration?: number;
    /** Viewport onde o toast aparece. Padrão: 'bottom'. */
    position?: ToastPosition;
}

type ToastType = 'info' | 'success' | 'error' | 'warning';

const TONE_BY_TYPE: Record<ToastType, ToastTone> = {
    info: 'neutral',
    success: 'success',
    error: 'danger',
    warning: 'accent',
};

const showToast = (type: ToastType, message: string, options?: AppToastOptions) =>
    pushToast({
        id: options?.toastId ?? `${type}:${message}`,
        tone: TONE_BY_TYPE[type],
        title: message,
        duration: options?.duration,
        position: options?.position,
        // O amarelo accent representa "aviso"; diferencia do sucesso pelo ícone.
        icon: type === 'warning' ? AlertTriangle : undefined,
    });

export const showInfoToast = (message: string, options?: AppToastOptions) => showToast('info', message, options);

export const showSuccessToast = (message: string, options?: AppToastOptions) => showToast('success', message, options);

export const showErrorToast = (message: string, options?: AppToastOptions) => showToast('error', message, options);

export const showWarningToast = (message: string, options?: AppToastOptions) => showToast('warning', message, options);
