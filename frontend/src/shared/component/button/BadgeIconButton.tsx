import clsx from 'clsx';

type IconButtonProps = {
    onClick: () => void;
    className?: string;
    children?: React.ReactNode;
    dislikeCount?: string;
    likeCount?: string;
};

const BadgeIconButton = ({
    onClick,
    className,
    children,
    dislikeCount,
    likeCount,
}: IconButtonProps) => {
    if (dislikeCount && Number(dislikeCount) < 10) {
        dislikeCount = dislikeCount.padStart(2, '0');
    }

    if (likeCount && Number(likeCount) < 10) {
        likeCount = likeCount.padStart(2, '0');
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 transition-colors duration-300 rounded-xs bg-primary-default hover:bg-quaternary-opacity-25
        ${clsx(
            !className && 'py-1',
            className && className,
            (likeCount || dislikeCount) && 'relative',
        )}
        `}
        >
            {children}
            {(likeCount || dislikeCount) && (
                <span
                    className={`flex justify-center items-center text-center absolute top-[-0.25rem] right-[-0.25rem] text-[0.5rem] font-bold text-white p-0.5 border border-tertiary rounded-full ${clsx(
                        dislikeCount && 'bg-red-500',
                        likeCount && 'bg-green-500',
                    )}`}
                >
                    {likeCount && <span>{likeCount}</span>}
                    {dislikeCount && <span>{dislikeCount}</span>}
                </span>
            )}
        </button>
    );
};

export default BadgeIconButton;
