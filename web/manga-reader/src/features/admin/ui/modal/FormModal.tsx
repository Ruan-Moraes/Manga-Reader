import type { FormEvent, ReactNode } from 'react';

import AdminModal from './AdminModal';

type FormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onSubmit: (event: FormEvent) => void;
    submitLabel: string;
    cancelLabel: string;
    submittingLabel?: string;
    isSubmitting?: boolean;
    submitDisabled?: boolean;
    children: ReactNode;
};

const FormModal = ({
    isOpen,
    onClose,
    title,
    onSubmit,
    submitLabel,
    cancelLabel,
    submittingLabel,
    isSubmitting = false,
    submitDisabled = false,
    children,
}: FormModalProps) => {
    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={onSubmit} className="flex flex-col gap-4 p-2">
                <h3 className="text-sm font-bold">{title}</h3>

                {children}

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30">
                        {cancelLabel}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || submitDisabled}
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting ? (submittingLabel ?? submitLabel) : submitLabel}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
};

export default FormModal;
