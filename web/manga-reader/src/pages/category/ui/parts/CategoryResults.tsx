import { useTranslation } from 'react-i18next';

import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { MangaCard } from '@entities/manga';
import { Skeleton } from '@ui/Skeleton';

type Layout = 'grid' | 'list';

export interface CategoryResultItem {
    id: string;
    name: string;
    author?: string;
    cover?: string;
    ratingAverage?: number;
    latestChapterNumber?: string | number;
}

interface CategoryResultsProps {
    items: CategoryResultItem[];
    isLoading: boolean;
    layout: Layout;
    onNavigate: (id: string) => void;
    onClearAll: () => void;
}

const CategoryResults = ({ items, isLoading, layout, onNavigate, onClearAll }: CategoryResultsProps) => {
    const { t } = useTranslation('manga');

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} variant="rect" height={260} className="rounded-mr-xs" />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <EmptyState
                illustration="duvida"
                title={t('filters.emptyTitle')}
                description={t('filters.emptyDesc')}
                action={
                    <Button variant="raised" onClick={onClearAll}>
                        {t('filters.clearFilters')}
                    </Button>
                }
            />
        );
    }

    if (layout === 'grid') {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map(m => (
                    <MangaCard
                        key={m.id}
                        manga={{
                            id: m.id,
                            title: m.name,
                            author: m.author,
                            cover: m.cover,
                            rating: m.ratingAverage,
                            chapter: m.latestChapterNumber ? Number(m.latestChapterNumber) : undefined,
                        }}
                        onClick={() => onNavigate(m.id)}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {items.map(m => (
                <button
                    key={m.id}
                    type="button"
                    onClick={() => onNavigate(m.id)}
                    className="flex items-center gap-3 rounded-mr-xs border border-mr-border bg-mr-surface px-4 py-3 text-left transition-colors hover:border-mr-accent"
                >
                    <div
                        className="size-12 shrink-0 rounded-mr-xs bg-cover bg-center bg-mr-tertiary/20"
                        style={
                            m.cover
                                ? {
                                      backgroundImage: `url(${m.cover})`,
                                  }
                                : undefined
                        }
                    />
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-mr-body font-mr-bold text-mr-fg">{m.name}</p>
                        <p className="text-mr-tiny text-mr-fg-muted">{m.author}</p>
                    </div>
                    {m.latestChapterNumber && <Badge variant="neutral">Cap. {m.latestChapterNumber}</Badge>}
                </button>
            ))}
        </div>
    );
};

export default CategoryResults;
