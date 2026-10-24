import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, RotateCcw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { useDebouncedValue } from '@shared/hook/useDebouncedValue';
import { getLocale } from '@shared/lib/formatters';
import { ReleaseCard, type Release, type ReleasePeriod } from '@entities/release';
import { MarkReleaseDaySeenButton, MarkReleaseSeenButton } from '@features/mark-release-seen';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { PageContainer } from '@ui/PageContainer';
import { Pagination } from '@ui/Pagination';
import { SearchField } from '@ui/SearchField';
import { Select } from '@ui/Select';
import { Switch } from '@ui/Switch';

import { useReleasesPage } from '../model/useReleasesPage';
import { RecentTitlesSection } from './parts/RecentTitlesSection';
import { ReleasesPageSkeleton } from './parts/ReleasesPageSkeleton';
import { TrendingReleasesSection } from './parts/TrendingReleasesSection';

type ReleaseGroup = { date: string; items: Release[] };

const dateKey = (value: string, timeZone: string): string => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
};

const groupReleases = (items: Release[], timeZone: string): ReleaseGroup[] => {
    const groups = new Map<string, Release[]>();
    items.forEach(item => {
        const key = dateKey(item.publishedAt, timeZone);
        groups.set(key, [...(groups.get(key) ?? []), item]);
    });
    return [...groups.entries()].map(([date, groupItems]) => ({ date, items: groupItems }));
};

const NewReleases = () => {
    const { t } = useTranslation('manga');
    const navigate = useAppNavigate();
    const state = useReleasesPage();
    const [search, setSearch] = useState(state.q);
    const debouncedSearch = useDebouncedValue(search, 300);
    useEffect(() => setSearch(state.q), [state.q]);
    useEffect(() => {
        if (debouncedSearch === search && debouncedSearch !== state.q) {
            state.update({ q: debouncedSearch });
        }
    }, [debouncedSearch, search, state.q, state.update]);

    const items = state.releases.data?.releases.content ?? [];
    const groups = useMemo(() => groupReleases(items, state.timeZone), [items, state.timeZone]);
    const total = state.releases.data?.releases.totalElements ?? 0;
    const totalPages = state.releases.data?.releases.totalPages ?? 0;
    const hasFilters = Boolean(state.q || state.language || state.libraryOnly || state.period !== 'WEEK');
    const clear = () => {
        setSearch('');
        state.update({ q: '', language: '', period: 'WEEK', libraryOnly: false, page: 1 });
    };

    const dayLabel = (date: string) => {
        const today = dateKey(new Date().toISOString(), state.timeZone);
        const yesterdayDate = new Date(`${today}T12:00:00Z`);
        yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
        const yesterday = yesterdayDate.toISOString().slice(0, 10);
        if (date === today) return t('releases.days.today');
        if (date === yesterday) return t('releases.days.yesterday');
        const distance = Math.round((new Date(`${today}T12:00:00Z`).getTime() - new Date(`${date}T12:00:00Z`).getTime()) / 86_400_000);
        if (distance > 1 && distance < 7) return t('releases.days.ago', { count: distance });
        return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
    };
    const formattedTime = (value: string) =>
        new Intl.DateTimeFormat(getLocale(), {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: state.timeZone,
        }).format(new Date(value));
    const requireLoginOr = (action: () => void) => (state.isLoggedIn ? action() : state.requireLogin());

    return (
        <PageContainer asMain size="default" paddingY="lg">
            <header className="mb-8 grid gap-5 border-b border-ui-border pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="max-w-3xl">
                    <p className="ui-label mb-2 text-ui-accent-fg">{t('releases.eyebrow')}</p>
                    <h1 className="text-ui-h1 font-ui-extrabold leading-tight tracking-mr text-ui-fg">{t('releases.title')}</h1>
                    <p className="mt-3 text-ui-body leading-relaxed text-ui-fg-muted">{t('releases.description')}</p>
                </div>
                <p className="text-ui-small text-ui-fg-subtle" aria-live="polite">
                    {t('releases.total', { count: total })}
                </p>
            </header>

            <section className="mb-8 rounded-ui-xs border border-ui-border bg-ui-surface p-4" aria-label={t('releases.filtersLabel')}>
                <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_190px_180px_auto] lg:items-center">
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder={t('releases.filterPlaceholder')}
                        aria-label={t('releases.filterPlaceholder')}
                    />
                    <Select
                        value={state.language}
                        onChange={event => state.update({ language: event.target.value })}
                        aria-label={t('releases.languageLabel')}
                        options={[
                            { value: '', label: t('releases.allLanguages') },
                            ...(state.releases.data?.availableLanguages ?? []).map(value => ({ value, label: value })),
                        ]}
                    />
                    <Select
                        value={state.period}
                        onChange={event => state.update({ period: event.target.value as ReleasePeriod })}
                        aria-label={t('releases.periodLabel')}
                        options={(['DAY', 'WEEK', 'MONTH'] as ReleasePeriod[]).map(value => ({ value, label: t(`releases.period.${value.toLowerCase()}`) }))}
                    />
                    <Button icon={X} variant="ghost" onClick={clear} disabled={!hasFilters}>
                        {t('releases.clearFilters')}
                    </Button>
                </div>
                <div className="mt-3 border-t border-ui-border pt-3">
                    <Switch
                        checked={state.libraryOnly}
                        onChange={checked => requireLoginOr(() => state.update({ libraryOnly: checked }))}
                        label={t('releases.libraryOnly')}
                    />
                </div>
            </section>

            {state.releases.isLoading && <ReleasesPageSkeleton />}
            {state.releases.isError && (
                <EmptyState
                    illustration="triste"
                    title={t('releases.error.title')}
                    description={t('releases.error.description')}
                    action={
                        <Button icon={RotateCcw} onClick={() => state.releases.refetch()}>
                            {t('releases.retry')}
                        </Button>
                    }
                />
            )}
            {!state.releases.isLoading && !state.releases.isError && groups.length === 0 && (
                <EmptyState
                    illustration={state.libraryOnly ? 'pensando' : 'surpresa'}
                    title={
                        state.libraryOnly ? t('releases.emptyLibrary.title') : hasFilters ? t('releases.emptyFilter.title') : t('releases.emptyPeriod.title')
                    }
                    description={
                        state.libraryOnly
                            ? t('releases.emptyLibrary.description')
                            : hasFilters
                              ? t('releases.emptyFilter.description')
                              : t('releases.emptyPeriod.description')
                    }
                    action={
                        hasFilters ? (
                            <Button icon={X} onClick={clear}>
                                {t('releases.clearFilters')}
                            </Button>
                        ) : undefined
                    }
                />
            )}
            {!state.releases.isLoading && !state.releases.isError && groups.length > 0 && (
                <div className={state.releases.isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
                    <div className="space-y-9">
                        {groups.map(group => (
                            <section key={group.date} aria-labelledby={`release-day-${group.date}`}>
                                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <h2 id={`release-day-${group.date}`} className="text-ui-h3 font-ui-extrabold uppercase tracking-mr text-ui-fg">
                                        {dayLabel(group.date)} · {t('releases.chaptersCount', { count: group.items.length })}
                                    </h2>
                                    <MarkReleaseDaySeenButton
                                        loading={state.seen.markDay.isPending}
                                        onClick={() => requireLoginOr(() => state.seen.markDay.mutate(group.date))}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {group.items.map(release => (
                                        <ReleaseCard
                                            key={release.chapterId}
                                            release={release}
                                            formattedTime={formattedTime(release.publishedAt)}
                                            action={
                                                <div className="flex flex-wrap gap-2">
                                                    <MarkReleaseSeenButton
                                                        seen={release.seen}
                                                        loading={state.seen.markChapter.isPending}
                                                        onClick={() => requireLoginOr(() => state.seen.markChapter.mutate(release.chapterId))}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        icon={BookOpen}
                                                        iconRight={ExternalLink}
                                                        onClick={() => navigate(ROUTES.CHAPTER(release.titleId, release.chapterNumber))}
                                                    >
                                                        {t('releases.openChapter')}
                                                    </Button>
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="mt-9">
                            <Pagination page={state.page + 1} total={totalPages} onChange={page => state.update({ page })} />
                        </div>
                    )}
                </div>
            )}

            <RecentTitlesSection titles={state.recentTitles.data?.content ?? []} />
            {!state.trending.isError && <TrendingReleasesSection titles={state.trending.data ?? []} />}
        </PageContainer>
    );
};

export default NewReleases;
