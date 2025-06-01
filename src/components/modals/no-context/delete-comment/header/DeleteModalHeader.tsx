type DeleteModalHeaderProps = {
    title: string;
};

const DeleteModalHeader = ({ title }: DeleteModalHeaderProps) => {
    return (
        <div>
            <h2 className="text-lg font-bold leading-none text-center text-quinary-default">
                {title}
            </h2>
        </div>
    );
};

export default DeleteModalHeader;
