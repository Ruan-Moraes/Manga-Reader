import React from 'react';

import { FaSortNumericDown } from 'react-icons/fa';
import { IoSearchSharp } from 'react-icons/io5';

interface ChapterFilterProps {
    onSortClick?: () => void;
    onSearchSubmit?: (searchTerm: string) => void;
}

const ChapterFilter: React.FC<ChapterFilterProps> = ({
    onSortClick,
    onSearchSubmit,
}) => {
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearchSubmit) {
            onSearchSubmit((e.target as HTMLInputElement).value);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div>
                <h3 className="text-xl font-bold leading-none text-shadow-default">
                    Capítulos:
                </h3>
            </div>
            <div className="flex items-stretch gap-2">
                <div>
                    <button
                        className="flex items-center h-full gap-2 p-2 border rounded-xs border-tertiary bg-secondary"
                        onClick={onSortClick}
                    >
                        <span className="text-xs font-bold w-max">
                            Ordenar por:
                        </span>
                        <span>
                            <FaSortNumericDown className="text-lg" />
                        </span>
                    </button>
                </div>
                <div className="flex grow">
                    <div>
                        <input
                            id="chapter-search"
                            name="chapter-search"
                            type="search"
                            placeholder="Pesquisar Capítulo"
                            onKeyDown={handleSearchKeyDown}
                            className="w-full h-full p-2 border rounded-r-none appearance-none rounded-xs 1 border-tertiary bg-secondary"
                        />
                    </div>
                    <div className="flex items-center px-4 py-2 border border-l-0 rounded-r-xs border-tertiary bg-secondary">
                        <IoSearchSharp size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChapterFilter;
