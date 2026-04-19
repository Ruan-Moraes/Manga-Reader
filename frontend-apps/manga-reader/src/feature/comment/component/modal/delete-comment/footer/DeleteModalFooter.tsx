type DeleteModalFooterProps = {
    onConfirm: () => void;
    onCancel: () => void;
};

function DeleteModalFooter({ onConfirm, onCancel }: DeleteModalFooterProps) {
    return (
        <div className="flex gap-2">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm border rounded-xs border-tertiary bg-tertiary hover:bg-secondary hover:border-secondary transition-colors"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={onConfirm}
                className="flex-1 px-4 py-2 text-sm border rounded-xs border-quinary-default text-quinary-default hover:bg-quinary-default hover:text-white transition-colors"
            >
                Confirmar
            </button>
        </div>
    );
}

export default DeleteModalFooter;
