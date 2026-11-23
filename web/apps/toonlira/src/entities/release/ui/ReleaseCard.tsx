import type { ReactNode } from 'react';
import { Check, Clock3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import { cn } from '@shared/lib/cn';
import AppLink from '@ui/AppLink';
import { Badge } from '@ui/Badge';
import { MangaPoster } from '@ui/MangaPoster';

import type { Release } from '../model/release.types';

type ReleaseCardProps = {
    release: Release;
    formattedTime: string;
    action: ReactNode;
};

export const ReleaseCard = ({ release, formattedTime, action }: ReleaseCardProps) => {
    const { t } = useTranslation('manga');
    return (
        <article className={cn(
            'flex min-w-0 gap-3 rounded-ui-xs border bg-ui-surface p-3 transition-colors',
            release.seen ? 'border-ui-border opacity-70' : 'border-ui-accent-border hover:bg-ui-accent-10',
        )}>
            <div className="w-14 shrink-0">
                <MangaPoster cover={release.titleCover} alt="" size={56} radius="sm" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <AppLink link={ROUTES.TITLE_DETAIL(release.titleId)} className="truncate text-ui-small font-ui-bold text-ui-fg hover:text-ui-accent-fg">
                        {release.titleName}
                    </AppLink>
                    {!release.seen && <Badge variant="accent">{t('releases.newBadge')}</Badge>}
                    {release.seen && <Badge variant="neutral" icon={Check}>{t('releases.seenBadge')}</Badge>}
                </div>
                <p className="mt-0.5 truncate text-ui-tiny text-ui-fg-muted">
                    {t('reader.chapterAbbr')} {release.chapterNumber}
                    {release.chapterTitle ? ` · ${release.chapterTitle}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-ui-tiny text-ui-fg-subtle">
                    {release.scanGroup && <span className="truncate">{release.scanGroup.name}</span>}
                    {release.scanGroup && release.contentLanguage && <span aria-hidden="true">·</span>}
                    {release.contentLanguage && <Badge variant="neutral">{release.contentLanguage}</Badge>}
                    <span className="ml-auto inline-flex items-center gap-1">
                        <Clock3 className="size-3" aria-hidden="true" />
                        <time dateTime={release.publishedAt}>{formattedTime}</time>
                    </span>
                </div>
                <div className="mt-3 flex justify-end">{action}</div>
            </div>
        </article>
    );
};
