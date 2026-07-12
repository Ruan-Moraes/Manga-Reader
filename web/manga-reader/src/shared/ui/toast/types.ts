import type { LucideIcon } from 'lucide-react';

export type ToastTone = 'accent' | 'success' | 'danger' | 'neutral';
export type ToastPosition = 'top' | 'bottom';

export interface ToastConfig {
    id?: string;
    tone?: ToastTone;
    title: string;
    description?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
    icon?: LucideIcon;
    /** Viewport onde o toast aparece. Padrão: 'bottom'. */
    position?: ToastPosition;
}

/** A fully-resolved toast held in provider state. */
export interface ToastEntry extends Required<Pick<ToastConfig, 'id' | 'tone' | 'title' | 'duration' | 'position'>> {
    description?: string;
    action?: ToastConfig['action'];
    icon?: LucideIcon;
}

export interface ToastApi {
    toast: (cfg: ToastConfig) => string;
    dismiss: (id: string) => void;
}
