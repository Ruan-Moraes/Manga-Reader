import { BarChart3, BookOpen, BookmarkPlus, MessageCircle, Sparkles, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { TrendingTitle } from '@entities/trend';
import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';

import TrendGrowthBadge from './TrendGrowthBadge';

const Metric = ({ icon: Icon, value, label }: { icon: typeof BookOpen; value: number; label: string }) => (
    <span className="inline-flex items-center gap-1.5 text-mr-tiny text-mr-fg-muted" title={label}>
        <Icon className="size-3.5" aria-hidden="true" />
        {value.toLocaleString()}
    </span>
);

const TrendCard = ({ item, rank, featured = false }: { item: TrendingTitle; rank: number; featured?: boolean }) => {
    const { t } = useTranslation('home');
    const navigate = useAppNavigate();
    return (
        <button
            type="button"
            onClick={() => navigate(ROUTES.TITLE_DETAIL(item.id))}
            className={`group relative overflow-hidden rounded-mr-sm border text-left transition-all hover:-translate-y-1 hover:border-mr-accent-border ${featured ? 'border-mr-accent-border bg-mr-surface p-5 shadow-mr-lg' : 'border-mr-border bg-mr-surface p-4'}`}
        >
            <div className="flex gap-4">
                <div className={`${featured ? 'h-48 w-32' : 'h-32 w-24'} shrink-0 overflow-hidden rounded-mr-xs bg-mr-tertiary/20`}>
                    {item.cover && <img src={item.cover} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="font-mono text-3xl font-black text-mr-accent-fg">#{rank}</span>
                        <TrendGrowthBadge value={item.growthPercent} />
                    </div>
                    <h2 className={`${featured ? 'text-mr-h3' : 'text-mr-body'} truncate font-mr-bold text-mr-fg`}>{item.name}</h2>
                    <p className="mt-1 text-mr-tiny uppercase tracking-wider text-mr-fg-subtle">{item.type} · {item.genres.slice(0, 2).join(' / ')}</p>
                    <p className="mt-3 text-mr-small text-mr-fg-muted">{t('trending.reason', { count: item.metrics.reads })}</p>
                    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
                        <Metric icon={BookOpen} value={item.metrics.reads} label={t('trending.metrics.reads')} />
                        <Metric icon={BookmarkPlus} value={item.metrics.libraryAdds} label={t('trending.metrics.library')} />
                        <Metric icon={Star} value={item.metrics.reviews} label={t('trending.metrics.reviews')} />
                        <Metric icon={MessageCircle} value={item.metrics.comments} label={t('trending.metrics.comments')} />
                    </div>
                </div>
            </div>
        </button>
    );
};

const TrendingSection = ({ items }: { items: TrendingTitle[] }) => {
    const { t } = useTranslation('home');
    if (!items.length) {
        return (
            <div className="rounded-mr-sm border border-dashed border-mr-border bg-mr-surface px-6 py-16 text-center">
                <BarChart3 className="mx-auto mb-4 size-10 text-mr-accent-fg" />
                <h2 className="text-mr-h4 font-mr-bold text-mr-fg">{t('trending.emptyTitle')}</h2>
                <p className="mx-auto mt-2 max-w-lg text-mr-small text-mr-fg-muted">{t('trending.emptyBody')}</p>
            </div>
        );
    }
    return (
        <div>
            <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {items.slice(0, 3).map((item, index) => (
                    <TrendCard key={item.id} item={item} rank={index + 1} featured={index === 0} />
                ))}
            </div>
            <div className="mb-4 flex items-center gap-2">
                <Sparkles className="size-4 text-mr-accent-fg" />
                <h2 className="mr-label text-mr-fg">{t('trending.movers')}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.slice(3).map((item, index) => <TrendCard key={item.id} item={item} rank={index + 4} />)}
            </div>
        </div>
    );
};

export default TrendingSection;
