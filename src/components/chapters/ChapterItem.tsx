interface ChapterItemProps {
    chapterNumber: string;
    title: string;
    date: string;
    pages: string;
    onClick?: () => void;
}

const ChapterItem: React.FC<ChapterItemProps> = ({
    chapterNumber,
    title,
    date,
    pages,
    onClick,
}) => {
    return (
        <div
            className="flex justify-between px-2 py-2 border rounded-xs border-tertiary duration-300 transition-colors hover:bg-quaternary-opacity-50 cursor-pointer"
            onClick={onClick}
        >
            <div className="flex flex-col gap-1">
                <p>
                    <span className="font-bold">Capítulo:</span>{' '}
                    <span>{chapterNumber}</span>
                </p>
                <p>
                    <span className="font-bold">Título:</span>{' '}
                    <span>{title}</span>
                </p>
            </div>
            <div className="flex flex-col gap-1">
                <p>
                    <span className="font-bold">Data:</span> <span>{date}</span>
                </p>
                <p>
                    <span className="font-bold">Páginas:</span>{' '}
                    <span>{pages}</span>
                </p>
            </div>
        </div>
    );
};

export default ChapterItem;
