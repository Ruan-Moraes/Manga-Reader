type DeleteModalBodyProps = {
    message: string;
};

const DeleteModalBody = ({ message }: DeleteModalBodyProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="text-xs font-normal text-center">{message}</p>
            </div>
        </div>
    );
};

export default DeleteModalBody;
