import { useMemo, useState } from 'react';

import { ChapterTypes } from '../../types/ChapterTypes';

import formatDateToBrazilian from '../../services/utils/formatDateToBrazilian';

import ChapterItem from './ChapterItem';
import ChapterPagination from './ChapterPagination';

type ChapterListProps = {
    chapters: ChapterTypes[];
    onChapterClick?: (chapterNumber: string) => void;
};

const ChapterList = ({ chapters, onChapterClick }: ChapterListProps) => {
    const itemsPerPage = useMemo(() => 10, []);
    const totalPages = useMemo(
        () => Math.ceil(chapters.length / itemsPerPage),
        [chapters.length, itemsPerPage],
    );

    const [currentPage, setCurrentPage] = useState<number>(1);

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
                {currentChapters.map((chapter, index) => (
                    <ChapterItem
                        key={`${chapter.number}-${index}`}
                        chapterNumber={chapter.number}
                        title={chapter.title}
                        date={formatDateToBrazilian(chapter.releaseDate)}
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
