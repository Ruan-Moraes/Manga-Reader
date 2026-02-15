type RatingModalHeaderProps = {
    title: string;
};

const RatingModalHeader = ({ title }: RatingModalHeaderProps) => {
    return (
        <div className="flex items-center justify-center border-b border-b-tertiary">
            <h2 className="text-lg font-semibold pb-3 py-1 leading-none">
                {title}
            </h2>
        </div>
    );
};

export default RatingModalHeader;
