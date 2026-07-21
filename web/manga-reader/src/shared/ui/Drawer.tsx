import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { X } from 'lucide-react';

import { IconButton } from './IconButton';
import useFocusTrap from '@shared/hook/useFocusTrap';

export interface DrawerProps {
    open: boolean;
    onClose: () => void;
    side?: 'left' | 'right';
    width?: number;
    top?: number;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export const Drawer = ({ open, onClose, side = 'right', width = 380, top = 0, title, children, footer }: DrawerProps) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useFocusTrap(open, panelRef);

    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', onKey);

        const prevOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);

            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    const slideAnim = side === 'right' ? 'animate-mr-drawer-in-right' : 'animate-mr-drawer-in-left';

    const borderSide = side === 'right' ? 'border-l right-0' : 'border-r left-0';

    return (
        <>
            <div
                className="fixed inset-0 z-mr-drawer animate-mr-overlay bg-mr-overlay backdrop-blur-mr"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`fixed z-mr-drawer flex flex-col overflow-hidden border-mr-border bg-mr-gray-900 outline-none ${borderSide} ${slideAnim}`}
                style={{
                    top,
                    height: `calc(100dvh - ${top}px)`,
                    width: `min(${width}px, 90vw)`,
                }}
            >
                {title && (
                    <header className="flex shrink-0 items-center justify-between border-b border-mr-border-subtle p-3">
                        <h2 className="text-mr-h4 font-mr-extrabold">{title}</h2>
                        <IconButton icon={X} aria-label="Fechar" onClick={onClose} />
                    </header>
                )}
                <div className="flex-1 overflow-y-auto p-4">{children}</div>
                {footer && <footer className="shrink-0 border-t border-mr-border-subtle p-4">{footer}</footer>}
            </div>
        </>
    );
};

export default Drawer;
