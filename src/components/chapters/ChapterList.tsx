import { useState } from 'react';

import { ChapterTypes } from '../../types/ChapterTypes';

import ChapterItem from './ChapterItem';
import ChapterPagination from './ChapterPagination';

type ChapterListProps = {
    chapters: ChapterTypes[];
    itemsPerPage?: number;
    onChapterClick?: (chapterNumber: string) => void;
};

// TODO: Refatora, provavelmente o backend vai retornar o número de capitulos que um titulo tem, do jeito que está, o frontend está fazendo o calculo com array de capitulos
const ChapterList = ({
    chapters,
    itemsPerPage = 10,
    onChapterClick,
}: ChapterListProps) => {
    const [currentPage, setCurrentPage] = useState<number>(1);

    const totalPages = Math.ceil(chapters.length / itemsPerPage);

    const indexOfLastChapter = currentPage * itemsPerPage;
    const indexOfFirstChapter = indexOfLastChapter - itemsPerPage;

    const currentChapters = chapters.slice(
        indexOfFirstChapter,
        indexOfLastChapter,
    );

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 text-xs">
                {currentChapters.map(chapter => (
                    <ChapterItem
                        key={chapter.number}
                        chapterNumber={chapter.number}
                        title={chapter.title}
                        date={chapter.date}
                        pages={chapter.pages}
                        onClick={() =>
                            onChapterClick && onChapterClick(chapter.number)
                        }
                    />
                ))}
            </div>
            {totalPages > 1 && (
                <ChapterPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

export default ChapterList;
