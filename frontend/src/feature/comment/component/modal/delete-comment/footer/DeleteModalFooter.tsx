import DarkButton from '@shared/component/button/DarkButton';

type DeleteModalFooterProps = {
    onConfirm: () => void;
    onCancel: () => void;
};

function DeleteModalFooter({ onConfirm, onCancel }: DeleteModalFooterProps) {
    return (
        <div className="flex justify-end gap-2">
            <DarkButton onClick={onCancel} text="Cancelar" />
            <DarkButton onClick={onConfirm} text="Confirmar" />
        </div>
    );
}

export default DeleteModalFooter;
