type BaseButtonProps = {
    onClick?: () => void;
    text: string;
};

const BaseButton = ({onClick, text}: BaseButtonProps) => {
    return (
        <button
            {...(onClick && {onClick})}
            className="w-full p-2 font-bold transition duration-300 border rounded-xs bg-secondary border-tertiary text-shadow-highlight hover:bg-quaternary-opacity-25 active:bg-quaternary-opacity-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {text}
        </button>
    );
};

export default BaseButton;
