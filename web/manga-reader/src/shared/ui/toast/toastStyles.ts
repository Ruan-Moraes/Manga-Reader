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
