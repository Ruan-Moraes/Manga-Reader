type DarkButtonProps = {
    onClick: (...args: never[]) => void;

    children?: React.ReactNode;

    text: string;
};

const DarkButton = ({ onClick, children, text }: DarkButtonProps) => {
    return (
        <button
            className={`px-3 py-2 text-xs rounded-xs shadow-lg bg-primary-default`}
            onClick={onClick}
        >
            {children ? (
                <span className="flex items-center gap-2">
                    {children}
                    {text}
                </span>
            ) : (
                <>{text}</>
            )}
        </button>
    );
};

export default DarkButton;
