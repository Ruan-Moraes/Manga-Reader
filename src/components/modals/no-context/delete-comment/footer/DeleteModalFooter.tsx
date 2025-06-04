import BlackButton from "../../../../buttons/BlackButton";

type DeleteModalFooterProps = {
    onConfirm: () => void;
    onCancel: () => void;
}

function DeleteModalFooter({onConfirm, onCancel}: DeleteModalFooterProps) {
    return (
        <div className="flex justify-end gap-2">
            <BlackButton text="Cancelar" onClick={onCancel}/>
            <BlackButton text="Confirmar" onClick={onConfirm}/>
        </div>
    );
}

export default DeleteModalFooter;