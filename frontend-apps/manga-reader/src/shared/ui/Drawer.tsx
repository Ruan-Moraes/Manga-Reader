import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { X } from 'lucide-react';

import { IconButton } from './IconButton';

export interface DrawerProps {
    open: boolean;
    onClose: () => void;
    side?: 'left' | 'right';
    width?: number;
    /** Pixel offset from viewport top — use when a sticky chrome occupies the top. */
    top?: number;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export const Drawer = ({ open, onClose, side = 'right', width = 380, top = 0, title, children, footer }: DrawerProps) => {
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;

        closeBtnRef.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', onKey);

        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const slideAnim = side === 'right' ? 'animate-mr-drawer-in-right' : 'animate-mr-drawer-in-left';

    const borderSide = side === 'right' ? 'border-l right-0' : 'border-r left-0';

    return (
        <>
            <div
                className="fixed inset-0 animate-mr-overlay bg-[rgba(22,22,22,0.75)] backdrop-blur-mr"
                style={{ zIndex: 60 }}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`fixed flex flex-col overflow-hidden border-mr-border bg-mr-gray-900 ${borderSide} ${slideAnim}`}
                style={{
                    top,
                    height: `calc(100dvh - ${top}px)`,
                    width: `min(${width}px, 90vw)`,
                    zIndex: 61,
                }}
            >
                {title && (
                    <header className="flex shrink-0 items-center justify-between border-b border-mr-border-subtle p-3">
                        <h2 className="text-mr-h4 font-mr-extrabold">{title}</h2>
                        <IconButton ref={closeBtnRef} icon={X} aria-label="Fechar" onClick={onClose} />
                    </header>
                )}
                <div className="flex-1 overflow-y-auto p-4">{children}</div>
                {footer && <footer className="shrink-0 border-t border-mr-border-subtle p-4">{footer}</footer>}
            </aside>
        </>
    );
};

export default Drawer;
