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

/** A fully-resolved toast held in provider state. */
export interface ToastEntry extends Required<Pick<ToastConfig, 'id' | 'tone' | 'title' | 'duration'>> {
    description?: string;
    action?: ToastConfig['action'];
    icon?: LucideIcon;
}

export interface ToastApi {
    toast: (cfg: ToastConfig) => string;
    dismiss: (id: string) => void;
}
