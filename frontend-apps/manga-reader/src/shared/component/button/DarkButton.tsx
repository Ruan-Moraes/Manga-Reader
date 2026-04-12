type DarkButtonProps = {
    onClick: (...args: never[]) => void;
    text: string;
    className?: string;
    disabled?: boolean;
};

const DarkButton = ({
    onClick,
    text,
    className,
    disabled,
}: DarkButtonProps) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`px-3 py-2 text-xs rounded-xs shadow-lg bg-primary-default border border-tertiary hover:bg-tertiary/20 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {text}
        </button>
    );
};

export default DarkButton;
