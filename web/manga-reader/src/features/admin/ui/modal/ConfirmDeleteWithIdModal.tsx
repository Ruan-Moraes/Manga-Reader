import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import AdminModal from './AdminModal';

type ConfirmDeleteWithIdModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    entityId: string;
    title: string;
    message: string;
    isSubmitting: boolean;
};

const ConfirmDeleteWithIdModal = ({ isOpen, onClose, onConfirm, entityId, title, message, isSubmitting }: ConfirmDeleteWithIdModalProps) => {
    const { t } = useTranslation('admin');
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (!isOpen) setInputValue('');
    }, [isOpen]);

    const isMatch = inputValue === entityId;

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-3 p-2">
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="text-sm text-tertiary">{message}</p>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-tertiary">{t('common.deleteIdPrompt')}</span>
                    <span className="px-2 py-1 font-mono text-xs rounded-xs bg-tertiary/20 select-all">{entityId}</span>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder={entityId}
                        className="px-3 py-1.5 text-sm border rounded-xs bg-secondary border-tertiary focus:outline-none focus:border-red-500/50"
                        autoComplete="off"
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30">
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!isMatch || isSubmitting}
                        className="px-3 py-1.5 text-sm font-semibold text-red-300 rounded-xs bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? t('common.deleting') : t('common.delete')}
                    </button>
                </div>
            </div>
        </AdminModal>
    );
};

export default ConfirmDeleteWithIdModal;
