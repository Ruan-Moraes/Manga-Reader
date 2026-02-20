type DarkButtonProps = {
    onClick: (...args: never[]) => void;
    text: string;
};

const DarkButton = ({ onClick, text }: DarkButtonProps) => {
    return (
        <button
            className={`px-3 py-2 text-xs rounded-xs shadow-lg bg-primary-default`}
            onClick={onClick}
        >
            {text}
        </button>
    );
};

export default DarkButton;
