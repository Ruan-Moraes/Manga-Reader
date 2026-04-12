type InfoModalBodyProps = {
    message: string;
};

const InfoModalBody = ({ message }: InfoModalBodyProps) => {
    return (
        <div className="py-4">
            <p className="text-center text-sm">{message}</p>
        </div>
    );
};

export default InfoModalBody;
