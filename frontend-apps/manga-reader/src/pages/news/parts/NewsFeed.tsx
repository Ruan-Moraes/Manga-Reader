import { useTranslation } from 'react-i18next';

import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';

import { formatRelativeDate, type NewsItem } from '@features/news';

interface NewsFeedProps {
    items: NewsItem[];
    hasMore: boolean;
    onItemClick: (id: string) => void;
    onLoadMore: () => void;
}

export const NewsFeed = ({ items, hasMore, onItemClick, onLoadMore }: NewsFeedProps) => {
    const { t } = useTranslation('news');

    if (items.length === 0) return null;

    return (
        <>
            <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                }}
            >
                {items.map(item => (
                    <article
                        key={item.id}
                        className="flex cursor-pointer flex-col overflow-hidden rounded-mr-md border border-mr-border bg-mr-surface transition-all duration-mr-default hover:-translate-y-0.5 hover:border-mr-accent-50"
                        onClick={() => onItemClick(item.id)}
                    >
                        <div className="h-1 w-full bg-mr-tertiary" />
                        <div className="flex flex-1 flex-col gap-2 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="neutral">{item.category}</Badge>
                                <span className="text-mr-tiny text-mr-fg-subtle">{formatRelativeDate(item.publishedAt)}</span>
                            </div>
                            <h3 className="text-mr-body font-mr-extrabold leading-snug tracking-mr text-mr-fg">{item.title}</h3>
                            <p className="line-clamp-3 flex-1 text-mr-small text-mr-fg-muted">{item.excerpt}</p>
                            <span className="mt-1 self-start text-mr-tiny text-mr-accent hover:underline underline-offset-2">{t('page.readMoreInline')}</span>
                        </div>
                    </article>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center">
                    <Button variant="raised" onClick={onLoadMore}>
                        {t('page.loadMore')}
                    </Button>
                </div>
            )}
        </>
    );
};
