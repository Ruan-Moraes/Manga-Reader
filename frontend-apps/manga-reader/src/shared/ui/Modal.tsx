import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import type { ReactNode } from 'react';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    eyebrow?: string;
    size?: 'sm' | 'md' | 'lg';
    hideClose?: boolean;
    children: ReactNode;
    footer?: ReactNode;
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-[400px]',
    md: 'max-w-[560px]',
    lg: 'max-w-[720px]',
};

export const Modal = ({ open, onClose, title, description, eyebrow, size = 'md', hideClose, children, footer }: ModalProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const el = dialogRef.current;
        if (!el) return;
        if (open && !el.open) el.showModal();
        if (!open && el.open) el.close();
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            onClick={e => {
                if (e.target === dialogRef.current) onClose();
            }}
            className={`p-0 ${sizeMap[size]} w-[90vw] rounded-mr-md border border-mr-border bg-mr-surface text-mr-fg shadow-mr-black animate-mr-fade-in`}
            aria-labelledby="modal-title"
        >
            <header className="flex items-start justify-between gap-4 border-b border-mr-border-subtle p-4">
                <div className="min-w-0 flex-1">
                    {eyebrow && <div className="mr-label text-mr-accent mb-1">{eyebrow}</div>}
                    <h2 id="modal-title" className="text-mr-h3 font-mr-extrabold text-mr-fg">
                        {title}
                    </h2>
                    {description && <p className="mt-1 text-mr-small text-mr-fg-subtle">{description}</p>}
                </div>
                {!hideClose && <IconButton icon={X} aria-label="Fechar" onClick={onClose} />}
            </header>
            <div className="max-h-[60vh] overflow-y-auto p-4">{children}</div>
            {footer && <footer className="flex items-center justify-end gap-2 border-t border-mr-border-subtle p-4">{footer}</footer>}
        </dialog>
    );
};

export default Modal;
