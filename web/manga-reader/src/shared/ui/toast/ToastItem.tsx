import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { IconButton } from '../IconButton';
import type { ToastEntry } from './types';
import { defaultToneIcon, toneIconBg, toneIconColor, toneLeftBorder } from './toastStyles';

interface ToastItemProps {
    item: ToastEntry;
    onDismiss: (id: string) => void;
}

/** Linha única de toast: timer de auto-dismiss (pausado no hover/focus) + conteúdo. */
export function ToastItem({ item, onDismiss }: ToastItemProps) {
    const [paused, setPaused] = useState(false);

    const Icon = item.icon ?? defaultToneIcon[item.tone];
    const multiline = Boolean(item.description);

    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;

    useEffect(() => {
        if (item.duration === 0 || paused) return;

        const timer = setTimeout(() => onDismissRef.current(item.id), item.duration);

        return () => clearTimeout(timer);
    }, [item.id, item.duration, paused]);

    return (
        <div
            role={item.tone === 'danger' ? 'alert' : 'status'}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className={cn(
                'pointer-events-auto flex gap-3 rounded-mr-sm border border-l-[3px] border-mr-border bg-mr-surface py-2.5 pl-3 pr-2 shadow-mr-black animate-mr-toast-in',
                multiline ? 'items-start' : 'items-center',
                toneLeftBorder[item.tone],
            )}
        >
            <span
                className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-mr-xs',
                    toneIconBg[item.tone],
                    multiline && 'mt-0.5',
                )}
            >
                <Icon className={cn('size-4', toneIconColor[item.tone])} aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1 py-px">
                <p className="text-mr-small font-mr-bold leading-snug text-mr-fg">{item.title}</p>
                {item.description && <p className="mt-0.5 text-mr-tiny leading-snug text-mr-fg-muted">{item.description}</p>}
                {item.action && (
                    <button
                        type="button"
                        onClick={() => {
                            item.action!.onClick();
                            onDismiss(item.id);
                        }}
                        className="mt-1.5 text-mr-tiny font-mr-bold text-mr-accent underline underline-offset-2 hover:opacity-80"
                    >
                        {item.action.label}
                    </button>
                )}
            </div>

            <IconButton
                icon={X}
                size="sm"
                variant="ghost"
                aria-label="Dispensar"
                onClick={() => onDismiss(item.id)}
                className={cn('shrink-0 border-transparent !bg-transparent text-mr-fg-subtle hover:!bg-mr-surface-muted hover:text-mr-fg', multiline && 'mt-px')}
            />
        </div>
    );
}

export default ToastItem;
