import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';

import type { Title } from '@entities/manga';

import AppLink from '@ui/AppLink';
import { Badge } from '@ui/Badge';
import { MangaPoster } from '@ui/MangaPoster';
import { SectionHeader } from '@ui/SectionHeader';

export const RecentTitlesSection = ({ titles }: { titles: Title[] }) => {
    const { t } = useTranslation('manga');

    if (titles.length === 0) return null;

    return (
        <section className="mt-12" aria-label={t('releases.recentTitles.title')}>
            <SectionHeader as="h2" title={t('releases.recentTitles.title')} eyebrow={t('releases.recentTitles.eyebrow')} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {titles.map(title => (
                    <article key={title.id} className="min-w-0">
                        <AppLink link={ROUTES.TITLE_DETAIL(title.id)} className="block">
                            <MangaPoster cover={title.cover} alt="" size={180} radius="sm" />
                            {/* TODO: Truncar se o texto passar de 1 linha e quando o usuario passar o mouse, mostrar um title. */}
                            <h3 className="mt-2 line-clamp-2 text-ui-small font-ui-bold text-ui-fg">{title.name}</h3>
                        </AppLink>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {title.type && <Badge variant="neutral">{title.type}</Badge>}
                            {title.status && (
                                <Badge variant="neutral">{t(`releases.status.${title.status.toLowerCase()}`, { defaultValue: title.status })}</Badge>
                            )}
                        </div>
                        {title.genres?.length > 0 && <p className="mt-1 truncate text-ui-tiny text-ui-fg-subtle">{title.genres.slice(0, 2).join(' · ')}</p>}
                    </article>
                ))}
            </div>
        </section>
    );
};
