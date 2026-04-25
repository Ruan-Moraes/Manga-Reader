import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IoSearchSharp } from 'react-icons/io5';

const MainSearchInput = () => {
    const { t } = useTranslation('layout');
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
            navigate(`/Manga-Reader/search?q=${encodeURIComponent(trimmed)}`);
        }
    };

    return (
        <div className="w-full">
            <form role="search" onSubmit={handleSubmit}>
                <div className="flex items-center h-10 px-4 transition-shadow duration-300 rounded-xs bg-tertiary shadow-default focus:shadow-inside hover:shadow-inside">
                    <input
                        name="search"
                        type="search"
                        aria-label={t('search.ariaLabel')}
                        placeholder={t('search.placeholder')}
                        className="w-full truncate bg-transparent border-none outline-none appearance-none placeholder-primary-default placeholder:text-sm grow"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <div className="flex items-center justify-center">
                        <div className="w-[0.0625rem] h-[1.875rem] bg-secondary"></div>
                        <button type="submit" className="pl-4">
                            <IoSearchSharp size={24} />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default MainSearchInput;
