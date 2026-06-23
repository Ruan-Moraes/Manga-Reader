import { Check, AlertTriangle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { ToastTone } from './types';

export const defaultToneIcon: Record<ToastTone, LucideIcon> = {
    accent: Check,
    success: Check,
    danger: AlertTriangle,
    neutral: Info,
};

export const toneLeftBorder: Record<ToastTone, string> = {
    accent: 'border-l-mr-accent',
    success: 'border-l-mr-accent',
    danger: 'border-l-mr-danger',
    neutral: 'border-l-mr-tertiary',
};

export const toneIconColor: Record<ToastTone, string> = {
    accent: 'text-mr-accent',
    success: 'text-mr-accent',
    danger: 'text-mr-danger',
    neutral: 'text-mr-fg-muted',
};

/** Fundo tonal do "chip" do ícone, para dar peso visual ao toast. */
export const toneIconBg: Record<ToastTone, string> = {
    accent: 'bg-mr-accent-25',
    success: 'bg-mr-accent-25',
    danger: 'bg-mr-danger-15',
    neutral: 'bg-mr-surface-muted',
};
