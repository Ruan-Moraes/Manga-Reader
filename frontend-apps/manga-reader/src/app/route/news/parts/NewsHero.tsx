import { useTranslation } from 'react-i18next';
import { ArrowRight, Pin } from 'lucide-react';

import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';

import { formatRelativeDate, type NewsItem } from '@feature/news';

interface NewsHeroProps {
    news: NewsItem;
    onClick: () => void;
}

export const NewsHero = ({ news, onClick }: NewsHeroProps) => {
    const { t } = useTranslation('news');

    return (
        <Card variant="default" className="cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:border-mr-accent-50" onClick={onClick}>
            <div className="h-1 w-full bg-mr-accent" />
            <div className="p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {news.isFeatured && (
                        <Badge>
                            <Pin className="size-3" />
                            {t('page.pinnedLabel')}
                        </Badge>
                    )}
                    <Badge variant="neutral">{news.category}</Badge>
                    <span className="text-mr-tiny text-mr-fg-subtle">{formatRelativeDate(news.publishedAt)}</span>
                </div>
                <h2 className="mb-2 text-mr-h3 font-mr-extrabold tracking-mr text-mr-fg">{news.title}</h2>
                <p className="mb-4 text-mr-small text-mr-fg-muted">{news.excerpt}</p>
                <Button variant="raised" icon={ArrowRight}>
                    {t('page.readMore')}
                </Button>
            </div>
        </Card>
    );
};
