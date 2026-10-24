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
                'pointer-events-auto flex gap-3 rounded-ui-sm border border-l-[3px] border-ui-border bg-ui-surface py-2.5 pl-3 pr-2 shadow-ui-black animate-ui-toast-in',
                multiline ? 'items-start' : 'items-center',
                toneLeftBorder[item.tone],
            )}
        >
            <span
                className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-ui-xs',
                    toneIconBg[item.tone],
                    multiline && 'mt-0.5',
                )}
            >
                <Icon className={cn('size-4', toneIconColor[item.tone])} aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1 py-px">
                <p className="text-ui-small font-ui-bold leading-snug text-ui-fg">{item.title}</p>
                {item.description && <p className="mt-0.5 text-ui-tiny leading-snug text-ui-fg-muted">{item.description}</p>}
                {item.action && (
                    <button
                        type="button"
                        onClick={() => {
                            item.action!.onClick();
                            onDismiss(item.id);
                        }}
                        className="mt-1.5 text-ui-tiny font-ui-bold text-ui-accent-fg underline underline-offset-2 hover:opacity-80"
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
                className={cn('shrink-0 border-transparent !bg-transparent text-ui-fg-subtle hover:!bg-ui-surface-muted hover:text-ui-fg', multiline && 'mt-px')}
            />
        </div>
    );
}

export default ToastItem;
