import BaseButton from '../../../../buttons/BaseButton';

type DeleteModalBodyProps = {
    message: string;

    onConfirm: () => void;
    onCancel: () => void;
};

const DeleteModalBody = ({
    message,
    onConfirm,
    onCancel,
}: DeleteModalBodyProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="text-sm font-normal text-center">{message}</p>
            </div>
            <div className="flex justify-end gap-2">
                <BaseButton text="Cancelar" onClick={onCancel} />
                <BaseButton text="Confirmar" onClick={onConfirm} />
            </div>
        </div>
    );
};

export default DeleteModalBody;
