import { BookOpen, BookmarkPlus, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { TrendingDashboard, TrendingTitle } from '@entities/trend';
import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';

import TrendGrowthBadge from './TrendGrowthBadge';

type MetricKey = 'reads' | 'reviews' | 'libraryAdds';

const Leaderboard = ({ title, description, icon: Icon, items, metric }: {
    title: string;
    description: string;
    icon: typeof BookOpen;
    items: TrendingTitle[];
    metric: MetricKey;
}) => {
    const navigate = useAppNavigate();
    return (
        <section className="rounded-mr-sm border border-mr-border bg-mr-surface p-4 md:p-5">
            <header className="mb-4 flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-mr-xs bg-mr-accent/10 text-mr-accent"><Icon className="size-5" /></span>
                <div><h2 className="text-mr-body font-mr-bold text-mr-fg">{title}</h2><p className="mt-0.5 text-mr-tiny text-mr-fg-muted">{description}</p></div>
            </header>
            <ol className="space-y-1">
                {items.map((item, index) => (
                    <li key={item.id}>
                        <button type="button" onClick={() => navigate(ROUTES.TITLE_DETAIL(item.id))}
                            className="group flex w-full items-center gap-3 rounded-mr-xs p-2 text-left transition-colors hover:bg-mr-tertiary/10">
                            <span className="w-5 shrink-0 text-center font-mono text-mr-small font-black text-mr-fg-subtle">{index + 1}</span>
                            <div className="size-11 shrink-0 overflow-hidden rounded-mr-xs bg-mr-tertiary/20">
                                {item.cover && <img src={item.cover} alt="" className="size-full object-cover" />}
                            </div>
                            <div className="min-w-0 flex-1"><p className="truncate text-mr-small font-mr-bold text-mr-fg group-hover:text-mr-accent">{item.name}</p><p className="text-mr-tiny text-mr-fg-muted">{item.metrics[metric].toLocaleString()}</p></div>
                            <TrendGrowthBadge value={item.growth[metric]} compact />
                        </button>
                    </li>
                ))}
            </ol>
        </section>
    );
};

const MetricLeaderboards = ({ dashboard }: { dashboard: TrendingDashboard }) => {
    const { t } = useTranslation('home');
    return (
        <section className="mt-12">
            <div className="mb-5"><p className="mr-label text-mr-accent">{t('trending.metricsEyebrow')}</p><h2 className="mt-1 text-mr-h3 font-mr-bold text-mr-fg">{t('trending.metricsTitle')}</h2><p className="mt-2 max-w-2xl text-mr-small text-mr-fg-muted">{t('trending.metricsDescription')}</p></div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Leaderboard title={t('trending.leaderboards.reads.title')} description={t('trending.leaderboards.reads.description')} icon={BookOpen} items={dashboard.mostRead} metric="reads" />
                <Leaderboard title={t('trending.leaderboards.reviews.title')} description={t('trending.leaderboards.reviews.description')} icon={Star} items={dashboard.mostReviewed} metric="reviews" />
                <Leaderboard title={t('trending.leaderboards.saved.title')} description={t('trending.leaderboards.saved.description')} icon={BookmarkPlus} items={dashboard.mostSaved} metric="libraryAdds" />
            </div>
        </section>
    );
};

export default MetricLeaderboards;
