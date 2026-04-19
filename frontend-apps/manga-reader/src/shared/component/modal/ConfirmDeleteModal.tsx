import BaseModal from '@shared/component/modal/base/BaseModal';

type ConfirmDeleteModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isSubmitting: boolean;
};

const ConfirmDeleteModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isSubmitting,
}: ConfirmDeleteModalProps) => (
    <BaseModal isModalOpen={isOpen} closeModal={onClose}>
        <div className="flex flex-col gap-3 p-2">
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="text-sm text-tertiary">{message}</p>
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-sm font-semibold text-red-300 rounded-xs bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50"
                >
                    {isSubmitting ? 'Excluindo...' : 'Excluir'}
                </button>
            </div>
        </div>
    </BaseModal>
);

export default ConfirmDeleteModal;
