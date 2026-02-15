import { FaRegTrashAlt } from 'react-icons/fa';

type DeleteModalHeaderProps = {
    title: string;
};

const DeleteModalHeader = ({ title }: DeleteModalHeaderProps) => {
    return (
        <div>
            <h2 className="flex items-center justify-center gap-2 text-lg font-bold leading-none text-center text-quinary-default">
                <FaRegTrashAlt size={23} fill="#ff784f" /> {title}
            </h2>
        </div>
    );
};

export default DeleteModalHeader;
