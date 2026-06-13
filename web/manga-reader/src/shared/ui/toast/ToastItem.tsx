import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { IconButton } from '../IconButton';
import type { ToastEntry } from './types';
import { defaultToneIcon, toneIconColor, toneLeftBorder } from './toastStyles';

interface ToastItemProps {
    item: ToastEntry;
    onDismiss: (id: string) => void;
}

/** Single toast row: auto-dismiss timer (paused on hover/focus) + content. */
export function ToastItem({ item, onDismiss }: ToastItemProps) {
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
                'flex items-start gap-3 rounded-mr-xs border border-l-4 border-mr-border bg-mr-surface p-3 shadow-mr-elevated animate-mr-toast-in',
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

export default ToastItem;
