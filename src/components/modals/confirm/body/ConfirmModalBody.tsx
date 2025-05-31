import BaseButton from '../../../buttons/BaseButton';

type Props = {
    message: string;

    onConfirm: () => void;
    onCancel: () => void;
};

const ConfirmModalBody = ({message, onConfirm, onCancel}: Props) => {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="text-sm font-normal text-center">{message}</p>
            </div>
            <div className="flex justify-end gap-2">
                <BaseButton text="Cancelar" onClick={onCancel}/>
                <BaseButton text="Confirmar" onClick={onConfirm}/>
            </div>
        </div>
    );
};

export default ConfirmModalBody;
