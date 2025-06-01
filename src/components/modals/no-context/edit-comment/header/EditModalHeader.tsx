type EditModalHeaderProps = {
    title: string;
};

const EditModalHeader = ({ title }: EditModalHeaderProps) => {
    return (
        <div>
            <h2 className="text-lg font-bold leading-none text-center text-quinary-default">
                {title}
            </h2>
        </div>
    );
};

export default EditModalHeader;
