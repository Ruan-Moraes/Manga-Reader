import React from 'react';
import { Trans } from 'react-i18next';

interface ChapterPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange?: (page: number) => void;
}

const ChapterPagination: React.FC<ChapterPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    const getPageNumbers = () => {
        const pageNumbers = [];

        pageNumbers.push(1);

        for (
            let i = Math.max(2, currentPage - 2);
            i <= Math.min(totalPages - 1, currentPage + 2);
            i++
        ) {
            pageNumbers.push(i);
        }

        if (totalPages > 1) {
            pageNumbers.push(totalPages);
        }

        return pageNumbers;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex flex-col gap-2">
            <div>
                <ul className="flex text-center rounded-xs">
                    {pageNumbers.map(page => (
                        <li
                            key={page}
                            className={`p-1 border border-tertiary grow ${
                                page === currentPage
                                    ? 'font-bold bg-quaternary-opacity-50 text-shadow-default'
                                    : 'bg-secondary'
                            } ${page === 1 ? 'rounded-l-xs' : ''} ${
                                page === totalPages ? 'rounded-r-xs' : ''
                            }`}
                            onClick={() => onPageChange && onPageChange(page)}
                        >
                            {page}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="text-center">
                <p className="text-sm">
                    <Trans
                        ns="manga"
                        i18nKey="chapter.pagination.pageLabel"
                        values={{ current: currentPage, total: totalPages }}
                        components={{
                            1: <span className="font-bold" />,
                            2: <span className="font-bold" />,
                        }}
                    />
                </p>
            </div>
        </div>
    );
};

export default ChapterPagination;
