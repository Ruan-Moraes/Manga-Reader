import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (p: number) => void;
}

const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            <button
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
                className="p-2 transition-colors rounded disabled:opacity-30 hover:bg-tertiary"
            >
                <FiChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 text-sm rounded transition-colors ${
                        p === page
                            ? 'bg-quaternary-default text-primary-default font-bold'
                            : 'hover:bg-tertiary'
                    }`}
                >
                    {p}
                </button>
            ))}

            <button
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
                className="p-2 transition-colors rounded disabled:opacity-30 hover:bg-tertiary"
            >
                <FiChevronRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;
