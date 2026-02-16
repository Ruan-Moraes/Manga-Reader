import DarkButton from '@shared/component/button/DarkButton';

type DeleteModalFooterProps = {
    onConfirm: () => void;
    onCancel: () => void;
};

function DeleteModalFooter({ onConfirm, onCancel }: DeleteModalFooterProps) {
    return (
        <div className="flex justify-end gap-2">
            <DarkButton text="Cancelar" onClick={onCancel} />
            <DarkButton text="Confirmar" onClick={onConfirm} />
        </div>
    );
}

export default DeleteModalFooter;
