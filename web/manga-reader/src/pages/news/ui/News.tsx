import { useEffect, useState } from 'react';
import { Filter, Newspaper, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { HeroNews, NewsCard, type NewsPeriod, type NewsSort } from '@entities/news';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { Input } from '@ui/Input';
import { Pagination } from '@ui/Pagination';
import { Select } from '@ui/Select';
import { useNewsPage } from '../model/useNewsPage';
import { NewsPageSkeleton } from './parts/NewsPageSkeleton';

const News = () => {
    const { t } = useTranslation('news');
    const state = useNewsPage();
    const [search, setSearch] = useState(state.q);
    const [mobileFilters, setMobileFilters] = useState(false);
    useEffect(() => setSearch(state.q), [state.q]);

    const clear = () => { setSearch(''); state.update({ q: '', category: '', period: 'all', sort: 'recent' }); };
    return (
        <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
            <header className="mb-8 grid gap-6 border-b border-mr-border pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="max-w-3xl"><p className="mb-3 flex items-center gap-2 text-mr-tiny font-mr-bold uppercase tracking-[0.14em] text-mr-accent-fg"><Newspaper className="size-4" />{t('page.eyebrow')}</p><h1 className="text-mr-h1 font-mr-extrabold leading-none tracking-mr text-mr-fg">{t('page.title')}</h1><p className="mt-4 max-w-2xl text-mr-body leading-relaxed text-mr-fg-muted">{t('page.description')}</p></div>
                <p className="text-mr-small text-mr-fg-subtle" aria-live="polite">{t('page.results', { count: state.totalElements })}</p>
            </header>

            <form className="mb-5 flex gap-2" onSubmit={event => { event.preventDefault(); state.update({ q: search }); }} role="search">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mr-fg-subtle" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('page.searchPlaceholder')} className="min-h-11 pl-10" aria-label={t('page.searchPlaceholder')} /></div>
                <Button type="submit" variant="raised">{t('page.searchAction')}</Button>
                <Button type="button" variant="ghost" icon={Filter} className="lg:hidden" onClick={() => setMobileFilters(value => !value)} aria-expanded={mobileFilters}>{t('page.filters')}</Button>
            </form>

            <section className={`${mobileFilters ? 'grid' : 'hidden'} mb-7 gap-4 rounded-mr-xs border border-mr-border bg-mr-surface p-4 lg:grid lg:grid-cols-[1fr_180px_180px]`} aria-label={t('page.filters')}>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button className={`min-h-10 shrink-0 rounded-mr-full px-4 text-mr-small font-mr-bold ${!state.category ? 'bg-mr-accent text-mr-on-accent' : 'border border-mr-border text-mr-fg-muted'}`} onClick={() => state.update({ category: '' })} type="button">{t('page.allCategories')}</button>
                    {state.categories.map(option => <button key={option.value} type="button" onClick={() => state.update({ category: option.value })} className={`min-h-10 shrink-0 rounded-mr-full px-4 text-mr-small font-mr-bold ${state.category === option.value ? 'bg-mr-accent text-mr-on-accent' : 'border border-mr-border text-mr-fg-muted'}`}>{option.label}</button>)}
                </div>
                <Select value={state.period} onChange={event => state.update({ period: event.target.value as NewsPeriod })} options={['all','today','week','month'].map(value => ({ value, label: t(`filter.period.${value}`) }))} aria-label={t('filter.period.label')} />
                <Select value={state.sort} onChange={event => state.update({ sort: event.target.value as NewsSort })} options={[{value:'recent',label:t('filter.sort.recent')},{value:'most-read',label:t('filter.sort.mostRead')},{value:'trending',label:t('filter.sort.trending')}]} aria-label={t('filter.sort.label')} />
            </section>

            {state.isLoading && <NewsPageSkeleton />}
            {state.isError && <EmptyState illustration="triste" title={t('page.errorTitle')} description={t('page.errorDescription')} action={<Button onClick={() => state.refetch()}>{t('page.retry')}</Button>} />}
            {!state.isLoading && !state.isError && state.items.length === 0 && <EmptyState illustration="pensando" title={t('page.emptyTitle')} description={t('page.emptyDescription')} action={<Button icon={X} onClick={clear}>{t('page.clearFilters')}</Button>} />}
            {!state.isLoading && !state.isError && state.items.length > 0 && <div className={state.isFetching ? 'opacity-70 transition' : 'transition'}>{state.hero && <div className="mb-6"><HeroNews news={state.hero} /></div>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{state.feed.map(news => <NewsCard key={news.id} news={news} />)}</div>{state.totalPages > 1 && <div className="mt-8 flex justify-center"><Pagination page={state.page + 1} total={state.totalPages} onChange={page => state.update({ page })} /></div>}</div>}
        </main>
    );
};
export default News;
