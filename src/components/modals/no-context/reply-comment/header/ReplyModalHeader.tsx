type ReplyModalHeaderProps = {
    title: string;
};

const ReplyModalHeader = ({ title }: ReplyModalHeaderProps) => {
    return (
        <div>
            <h2 className="text-lg font-bold leading-none text-center text-quaternary-default">
                {title}
            </h2>
        </div>
    );
};

export default ReplyModalHeader;
