import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import type { TrendingTitle } from '@entities/trend';
import AppLink from '@ui/AppLink';
import { MangaPoster } from '@ui/MangaPoster';
import { SectionHeader } from '@ui/SectionHeader';

export const TrendingReleasesSection = ({ titles }: { titles: TrendingTitle[] }) => {
    const { t } = useTranslation('manga');
    if (titles.length === 0) return null;
    return (
        <section className="mt-12" aria-label={t('releases.trending.title')}>
            <SectionHeader as="h2" title={t('releases.trending.title')} eyebrow={t('releases.trending.eyebrow')} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {titles.slice(0, 6).map((title, index) => (
                    <article key={title.id} className="flex gap-3 rounded-ui-xs border border-ui-border bg-ui-surface p-3">
                        <span className="text-ui-h2 font-ui-extrabold text-ui-accent-fg" aria-label={t('releases.trending.position', { position: index + 1 })}>
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="w-12 shrink-0"><MangaPoster cover={title.cover} alt="" size={48} radius="sm" /></div>
                        <div className="min-w-0">
                            <AppLink link={ROUTES.TITLE_DETAIL(title.id)} className="line-clamp-2 text-ui-small font-ui-bold text-ui-fg hover:text-ui-accent-fg">
                                {title.name}
                            </AppLink>
                            <p className="mt-1 text-ui-tiny text-ui-fg-subtle">
                                {t('releases.trending.updates', { count: title.metrics.releases })}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};
