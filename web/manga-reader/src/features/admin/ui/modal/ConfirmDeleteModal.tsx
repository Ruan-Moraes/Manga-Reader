import { useTranslation } from 'react-i18next';

import AdminModal from './AdminModal';

type ConfirmDeleteModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isSubmitting: boolean;
};

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message, isSubmitting }: ConfirmDeleteModalProps) => {
    const { t } = useTranslation('admin');

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-3 p-2">
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="text-sm text-tertiary">{message}</p>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30">
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 text-sm font-semibold text-mr-danger rounded-xs bg-mr-danger-15 hover:bg-mr-danger-15 disabled:opacity-50"
                    >
                        {isSubmitting ? t('common.deleting') : t('common.delete')}
                    </button>
                </div>
            </div>
        </AdminModal>
    );
};

export default ConfirmDeleteModal;
