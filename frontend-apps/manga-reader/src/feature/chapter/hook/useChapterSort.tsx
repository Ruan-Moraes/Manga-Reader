import { useCallback, useMemo, useState } from 'react';
import type { Chapter } from '@feature/chapter';

const useChapterSort = (chapters: Chapter[]) => {
    const [isAscending, setIsAscending] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSortClick = useCallback(() => {
        setIsAscending(prev => !prev);
    }, []);

    const filteredAndSortedChapters = useMemo(() => {
        return [...chapters]
            .filter(chapter => {
                if (!searchTerm.trim()) return true;

                const searchLower = searchTerm.toLowerCase();

                return (
                    chapter.number.toLowerCase().includes(searchLower) ||
                    chapter.title.toLowerCase().includes(searchLower)
                );
            })
            .sort((a, b) => {
                const numA = parseFloat(a.number);
                const numB = parseFloat(b.number);

                if (isNaN(numA) && isNaN(numB)) return 0;
                if (isNaN(numA)) return isAscending ? 1 : -1;
                if (isNaN(numB)) return isAscending ? -1 : 1;

                return isAscending ? numA - numB : numB - numA;
            });
    }, [chapters, searchTerm, isAscending]);

    return {
        isAscending,
        searchTerm,
        setSearchTerm,
        handleSortClick,
        filteredAndSortedChapters,
    };
};

export default useChapterSort;
