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
    accent: 'border-l-ui-accent',
    success: 'border-l-ui-accent',
    danger: 'border-l-ui-danger',
    neutral: 'border-l-ui-tertiary',
};

export const toneIconColor: Record<ToastTone, string> = {
    accent: 'text-ui-accent-fg',
    success: 'text-ui-accent-fg',
    danger: 'text-ui-danger',
    neutral: 'text-ui-fg-muted',
};

/** Fundo tonal do "chip" do ícone, para dar peso visual ao toast. */
export const toneIconBg: Record<ToastTone, string> = {
    accent: 'bg-ui-accent-25',
    success: 'bg-ui-accent-25',
    danger: 'bg-ui-danger-15',
    neutral: 'bg-ui-surface-muted',
};
