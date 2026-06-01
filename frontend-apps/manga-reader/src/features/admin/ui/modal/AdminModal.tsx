import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import useFocusTrap from '@shared/hook/useFocusTrap';

type AdminModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

const ADMIN_CONTENT_ID = 'admin-content';

const AdminModal = ({ isOpen, onClose, children }: AdminModalProps) => {
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    useFocusTrap(isOpen && container != null, dialogRef);

    useEffect(() => {
        if (!isOpen) return;
        setContainer(document.getElementById(ADMIN_CONTENT_ID) ?? document.body);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen || !container) return null;

    return createPortal(
        <div className="absolute inset-0 z-30 flex items-start justify-center p-4 overflow-y-auto">
            <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
            <div
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                className="relative z-10 flex flex-col w-full max-w-2xl gap-2 p-2 my-auto border rounded-xs border-tertiary bg-secondary outline-none"
            >
                {children}
            </div>
        </div>,
        container,
    );
};

export default AdminModal;
