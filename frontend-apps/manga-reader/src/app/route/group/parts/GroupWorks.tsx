import { useState } from 'react';

import { MangaCard } from '@ui/MangaCard';
import { Select } from '@ui/Select';

const SORT_OPTIONS = [
    { value: 'popularity', label: 'Popularidade' },
    { value: 'az', label: 'A–Z' },
    { value: 'chapters', label: 'Capítulos' },
];

interface Work {
    id: string;
    title: string;
    author?: string;
    cover?: string;
    rating?: number;
    chapter?: number;
}

interface GroupWorksProps {
    works: Work[];
    onWorkClick: (id: string) => void;
}

export const GroupWorks = ({ works, onWorkClick }: GroupWorksProps) => {
    const [sort, setSort] = useState('popularity');

    return (
        <>
            <div className="mb-4 flex justify-end">
                <Select value={sort} onChange={e => setSort(e.target.value)} options={SORT_OPTIONS} className="w-44" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {works.map(w => (
                    <MangaCard key={w.id} manga={w} onClick={() => onWorkClick(w.id)} />
                ))}
            </div>
        </>
    );
};
