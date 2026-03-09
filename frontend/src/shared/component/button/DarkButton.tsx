type DarkButtonProps = {
    onClick: (...args: never[]) => void;
    text: string;
    className?: string;
};

const DarkButton = ({ onClick, text, className }: DarkButtonProps) => {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-2 text-xs rounded-xs shadow-lg bg-primary-default ${className}`}
        >
            {text}
        </button>
    );
};

export default DarkButton;
