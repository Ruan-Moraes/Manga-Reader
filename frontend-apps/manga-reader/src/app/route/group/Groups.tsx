import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';
import BaseSelect from '@shared/component/input/BaseSelect';
import SearchInput from '@shared/component/input/SearchInput';

import { GroupCard, useGroups, type GroupStatus } from '@feature/group';

const Groups = () => {
    const { t } = useTranslation('group');
    const [status, setStatus] = useState<'all' | GroupStatus>('all');
    const [genre, setGenre] = useState<'all' | string>('all');
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState<
        'popularity' | 'members' | 'titles' | 'rating'
    >('popularity');

    const { groups, genres, isLoading } = useGroups({
        status,
        genre,
        sortBy,
        query,
    });

    const statusOptions = useMemo(
        () => [
            { value: 'all', label: t('listing.statusAll') },
            { value: 'active', label: t('listing.statusActive') },
            { value: 'hiatus', label: t('listing.statusHiatus') },
            { value: 'inactive', label: t('listing.statusInactive') },
        ],
        [t],
    );

    const genreOptions = useMemo(
        () => [
            { value: 'all', label: t('listing.genreAll') },
            ...genres.map(item => ({ value: item, label: item })),
        ],
        [genres, t],
    );

    const sortOptions = useMemo(
        () => [
            { value: 'popularity', label: t('listing.sortPopularity') },
            { value: 'members', label: t('listing.sortMembers') },
            { value: 'titles', label: t('listing.sortTitles') },
            { value: 'rating', label: t('listing.sortRating') },
        ],
        [t],
    );

    return (
        <>
            <Header />
            <MainContent>
                <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">{t('listing.title')}</h2>
                    <p className="text-sm text-tertiary">
                        {t('listing.subtitle')}
                    </p>

                    <SearchInput
                        value={query}
                        onChange={setQuery}
                        placeholder={t('listing.searchPlaceholder')}
                    />

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <BaseSelect
                            options={statusOptions}
                            value={status}
                            onChange={event =>
                                setStatus(
                                    event.target.value as 'all' | GroupStatus,
                                )
                            }
                            className="w-full p-2 text-sm border rounded-xs border-tertiary bg-secondary"
                        />

                        <BaseSelect
                            options={genreOptions}
                            value={genre}
                            onChange={event => setGenre(event.target.value)}
                            className="w-full p-2 text-sm border rounded-xs border-tertiary bg-secondary"
                        />

                        <BaseSelect
                            options={sortOptions}
                            value={sortBy}
                            onChange={event =>
                                setSortBy(
                                    event.target.value as
                                        | 'popularity'
                                        | 'members'
                                        | 'titles'
                                        | 'rating',
                                )
                            }
                            className="w-full p-2 text-sm border rounded-xs border-tertiary bg-secondary"
                        />
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {isLoading
                        ? Array.from({ length: 8 }).map((_, index) => (
                              <GroupCard
                                  key={`skeleton-${index}`}
                                  group={{} as never}
                                  isLoading
                              />
                          ))
                        : groups.map(group => (
                              <GroupCard key={group.id} group={group} />
                          ))}
                </section>
            </MainContent>
            <Footer />
        </>
    );
};

export default Groups;
