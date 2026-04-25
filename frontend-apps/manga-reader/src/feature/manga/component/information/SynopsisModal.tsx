import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('manga');

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
                <div className="flex items-center justify-center pb-2 border-b border-tertiary">
                    <h3 className="text-sm font-bold leading-tight">
                        {t('synopsisModalTitle', { name: title })}
                    </h3>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-1">
                    <p className="text-xs text-justify whitespace-pre-line leading-relaxed">
                        {synopsis}
                    </p>
                </div>
                <div className="pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full px-4 py-2 text-sm border rounded-xs border-tertiary bg-tertiary hover:bg-secondary hover:border-secondary transition-colors cursor-pointer"
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </BaseModal>
    );
};

export default SynopsisModal;
