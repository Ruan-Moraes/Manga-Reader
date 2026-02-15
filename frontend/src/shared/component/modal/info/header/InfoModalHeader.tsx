type InfoModalHeaderProps = {
    title: string;
};

const InfoModalHeader = ({ title }: InfoModalHeaderProps) => {
    return (
        <div className="flex items-center justify-center">
            <h2 className="text-lg font-semibold">{title}</h2>
        </div>
    );
};

export default InfoModalHeader;
