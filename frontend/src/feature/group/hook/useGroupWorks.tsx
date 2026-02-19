import { useCallback, useMemo, useState } from 'react';
import type { GroupWork } from '@feature/group';

type WorkSortOption = 'popularity' | 'date' | 'chapters';

const useGroupWorks = (translatedWorks: GroupWork[]) => {
    const [workSort, setWorkSort] = useState<WorkSortOption>('popularity');
    const [activeGenre, setActiveGenre] = useState<string | null>(null);

    const toggleGenre = useCallback((genre: string) => {
        setActiveGenre(prev => (prev === genre ? null : genre));
    }, []);

    const sortedWorks = useMemo(() => {
        const scoped = activeGenre
            ? translatedWorks.filter(work => work.genres.includes(activeGenre))
            : translatedWorks;

        return [...scoped].sort((a, b) => {
            if (workSort === 'date') {
                return (
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
                );
            }

            if (workSort === 'chapters') {
                return b.chapters - a.chapters;
            }

            return b.popularity - a.popularity;
        });
    }, [translatedWorks, activeGenre, workSort]);

    return {
        workSort,
        setWorkSort,
        activeGenre,
        toggleGenre,
        sortedWorks,
    };
};

export type { WorkSortOption };
export default useGroupWorks;
