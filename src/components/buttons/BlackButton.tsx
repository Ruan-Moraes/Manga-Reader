type BlackButtonProps = {
    onClick: (...args: never[]) => void;

    text: string;
};

const BlackButton = ({onClick, text}: BlackButtonProps) => {
    return (
        <button
            className={`px-3 py-2 text-xs rounded-xs shadow-lg bg-primary-default`}
            onClick={onClick}
        >
            {text}
        </button>
    );
};

export default BlackButton;
