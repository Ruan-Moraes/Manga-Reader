import { Chapter } from '../model/chapter.types';

import { formatDate } from '@shared/util/formatters';

import ChapterItem from './ChapterItem';
import ChapterPagination from './ChapterPagination';

type ChapterListProps = {
    chapters: Chapter[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onChapterClick?: (chapterNumber: string) => void;
};

const ChapterList = ({ chapters, currentPage, totalPages, onPageChange, onChapterClick }: ChapterListProps) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 text-xs">
                {chapters.map((chapter, index) => (
                    <ChapterItem
                        key={`${chapter.number}-${index}`}
                        chapterNumber={chapter.number}
                        title={chapter.title}
                        date={formatDate(chapter.releaseDate, {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        })}
                        pages={chapter.pages}
                        onClick={() => onChapterClick && onChapterClick(chapter.number)}
                    />
                ))}
            </div>
            {totalPages > 1 && <ChapterPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />}
        </div>
    );
};

export default ChapterList;
