import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { showSuccessToast } from '@shared/service/util/toastService';
import { cn } from '@shared/lib/cn';
import { useTagsFetch, type Tag } from '@entities/catalog-filter/@x/user';
import { updateFavoriteGenres } from '@entities/user';

import { PEField } from './peShared';

const MAX_FAVORITE_GENRES = 10;

type FavoriteGenresFieldProps = {
    initialGenres: string[];
    onSaved: () => void;
};

export const FavoriteGenresField = ({ initialGenres, onSaved }: FavoriteGenresFieldProps) => {
    const { t } = useTranslation('user');
    const [genres, setGenres] = useState<string[]>(initialGenres);
    const { data: tags } = useTagsFetch();

    const saveGenres = async (next: string[]) => {
        const previous = genres;

        setGenres(next);

        try {
            const saved = await updateFavoriteGenres(next);

            setGenres(saved);
            showSuccessToast(t('profile.edit.saved'));
            onSaved();
        } catch {
            setGenres(previous);
        }
    };

    const toggleGenre = (slug: string) => {
        if (genres.includes(slug)) {
            saveGenres(genres.filter(g => g !== slug));
            return;
        }

        if (genres.length >= MAX_FAVORITE_GENRES) return;

        saveGenres([...genres, slug]);
    };

    return (
        <PEField
            label={t('profile.edit.info.genresLabel')}
            hint={t('profile.edit.info.genresHint', { count: genres.length, max: MAX_FAVORITE_GENRES })}
        >
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('profile.edit.info.genresLabel')}>
                {(tags ?? []).map((tag: Tag) => {
                    const selected = genres.includes(tag.slug);
                    const atLimit = !selected && genres.length >= MAX_FAVORITE_GENRES;

                    return (
                        <button
                            key={tag.slug}
                            type="button"
                            aria-pressed={selected}
                            disabled={atLimit}
                            onClick={() => toggleGenre(tag.slug)}
                            className={cn(
                                'mr-focus-ring rounded-mr-xs border px-2.5 py-1 text-[12px] font-mr-bold tracking-mr transition-colors',
                                selected
                                    ? 'border-mr-accent-border bg-mr-accent text-mr-on-accent'
                                    : 'border-mr-gray-700 bg-mr-secondary text-mr-fg-muted hover:border-mr-accent-50',
                                atLimit && 'cursor-not-allowed opacity-mr-disabled',
                            )}
                        >
                            {tag.label}
                        </button>
                    );
                })}
            </div>
        </PEField>
    );
};

export default FavoriteGenresField;
