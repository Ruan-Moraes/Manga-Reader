type InfoModalFooterProps = {
    onLinkClick: () => void;
    onClose: () => void;
    linkText: string;
};

const InfoModalFooter = ({
    onLinkClick,
    onClose,
    linkText,
}: InfoModalFooterProps) => {
    return (
        <div className="flex gap-2">
            <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm border rounded-xs border-tertiary bg-tertiary hover:bg-secondary hover:border-secondary transition-colors"
            >
                Fechar
            </button>
            <button
                onClick={onLinkClick}
                className="flex-1 px-4 py-2 text-sm text-white border rounded-xs bg-primary border-primary hover:bg-primary/80 transition-colors"
            >
                {linkText}
            </button>
        </div>
    );
};

export default InfoModalFooter;
