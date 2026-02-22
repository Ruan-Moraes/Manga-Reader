import { useCallback, useEffect } from 'react';

import BaseModal from '@shared/component/modal/base/BaseModal';

type SynopsisModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    synopsis: string;
};

const SynopsisModal = ({
    isOpen,
    onClose,
    title,
    synopsis,
}: SynopsisModalProps) => {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        },
        [onClose],
    );

    useEffect(() => {
        if (!isOpen) return;

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    return (
        <BaseModal isModalOpen={isOpen} closeModal={onClose}>
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-tertiary">
                    <h3 className="text-sm font-bold leading-tight">
                        Sinopse de {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-xs text-tertiary hover:text-white transition-colors cursor-pointer"
                    >
                        Fechar
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-1">
                    <p className="text-xs text-justify whitespace-pre-line leading-relaxed">
                        {synopsis}
                    </p>
                </div>
            </div>
        </BaseModal>
    );
};

export default SynopsisModal;
