import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUp, Clock, Eye, Home } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import { useNewsDetails, formatNewsDate, formatRelativeDate } from '@entities/news';
import { useComments } from '@entities/comment';
import { CommentsSection } from '@features/comment';
import { ShareNewsButton } from '@features/share-news';
import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { IconButton } from '@ui/IconButton';
import { Skeleton } from '@ui/Skeleton';

const useReadingProgress = () => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(max <= 0 ? 0 : Math.min(100, (window.scrollY / max) * 100));
        };
        update(); window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);
    return progress;
};

const NewsDetails = () => {
    const { newsId } = useParams();
    const { t, i18n } = useTranslation('news');
    const progress = useReadingProgress();
    const { news, relatedNews, isLoading, isError, refetch, relatedError } = useNewsDetails(newsId);
    const commentsQuery = useComments(news?.id ?? '', 0, 20, { targetType: 'NEWS' });

    if (isLoading) return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8"><Skeleton className="h-[55vh]" /><Skeleton variant="text" lines={4} /><Skeleton className="h-72" /></main>;
    if (isError || !news) return <main className="mx-auto max-w-5xl px-4 py-16"><EmptyState illustration="404" title={t('details.notFound')} description={t('details.notFoundDesc')} action={<div className="flex gap-2"><Button icon={ArrowLeft} onClick={() => history.back()}>{t('details.backButton')}</Button><Button variant="ghost" onClick={() => refetch()}>{t('page.retry')}</Button></div>} /></main>;

    const canonical = `${window.location.origin}${ROUTES.NEWS_DETAIL(news.slug || news.id)}`;
    const metaDescription = news.seo?.description || news.excerpt;
    const categoryLabel = typeof news.category === 'string' ? news.category : news.category?.label;
    return (
        <>
            <title>{news.seo?.title || news.title}</title>
            <meta name="description" content={metaDescription} />
            {(news.seo?.keywords?.length ?? 0) > 0 && <meta name="keywords" content={news.seo?.keywords?.join(', ')} />}
            <link rel="canonical" href={canonical} />
            <meta property="og:title" content={news.seo?.title || news.title} />
            <meta property="og:description" content={metaDescription} />
            {news.coverImage && <meta property="og:image" content={news.coverImage} />}
            <div className="fixed left-0 top-0 z-50 h-0.5 bg-mr-accent transition-[width]" style={{ width: `${progress}%` }} role="progressbar" aria-valuenow={Math.round(progress)} aria-label={t('details.readingProgress')} />
            <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
                <nav className="mb-5 flex items-center gap-2 text-mr-small text-mr-fg-subtle" aria-label={t('details.breadcrumb')}><Link to={ROUTES.HOME} aria-label={t('details.home')}><Home className="size-4" /></Link><span>/</span><Link to={ROUTES.NEWS}>{t('page.title')}</Link><span>/</span><span className="truncate text-mr-fg-muted">{news.title}</span></nav>
                <article>
                    <header className="overflow-hidden rounded-mr-xs border border-mr-border bg-mr-surface">
                        <div className="relative min-h-[320px] sm:min-h-[460px] lg:min-h-[580px]">{news.coverImage && <img src={news.coverImage} alt={news.coverAlt || news.title} className="absolute inset-0 size-full object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" /><div className="absolute inset-x-0 bottom-0 max-w-5xl p-5 sm:p-8 lg:p-12"><div className="mb-4 flex flex-wrap gap-2">{categoryLabel && <Badge>{categoryLabel}</Badge>}{news.tags.slice(0, 3).map(tag => <Badge key={tag} variant="neutral">{tag}</Badge>)}</div><h1 className="max-w-4xl text-3xl font-mr-extrabold leading-[1.05] tracking-mr text-white sm:text-5xl lg:text-6xl">{news.title}</h1>{news.subtitle && <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/80 sm:text-xl">{news.subtitle}</p>}</div></div>
                        <div className="flex flex-col gap-4 border-t border-mr-border p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3">{news.author && <><Avatar src={news.author.avatar} name={news.author.name} size={42} /><div><p className="font-mr-bold text-mr-fg">{news.author.name}</p><p className="text-mr-tiny text-mr-fg-subtle">{news.author.role}</p></div></>}</div><div className="flex flex-wrap items-center gap-4 text-mr-small text-mr-fg-subtle"><span>{formatNewsDate(news.publishedAt)}</span><span className="inline-flex items-center gap-1"><Clock className="size-4" />{t('card.readMinutes', { count: news.readTime })}</span><span className="inline-flex items-center gap-1"><Eye className="size-4" />{news.views.toLocaleString(i18n.language)}</span><ShareNewsButton title={news.title} url={canonical} /></div></div>
                    </header>

                    <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,760px)_320px] xl:justify-center">
                        <div className="min-w-0 space-y-8"><section className="space-y-6 text-[1.05rem] leading-8 text-mr-fg-muted">{news.content.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`} className={index === 1 ? 'border-l-4 border-mr-accent bg-mr-surface px-5 py-4 text-mr-fg' : ''}>{paragraph}</p>)}</section>{news.gallery.length > 0 && <section className="grid gap-3 sm:grid-cols-2">{news.gallery.map((image, index) => <img key={image} src={image} alt={t('details.galleryImageAlt', { index: index + 1 })} className="aspect-video w-full rounded-mr-xs object-cover" loading="lazy" />)}</section>}{news.updatedAt && <p className="text-mr-tiny text-mr-fg-subtle">{t('details.updated', { date: formatRelativeDate(news.updatedAt) })}</p>}<CommentsSection targetType="NEWS" targetId={news.id} comments={commentsQuery.comments} totalElements={commentsQuery.totalElements} isLoading={commentsQuery.isLoading} isError={commentsQuery.isError} error={commentsQuery.error} onCommentCreated={commentsQuery.refetchComments} /></div>
                        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start"><h2 className="text-mr-h4 font-mr-extrabold text-mr-fg">{t('details.relatedTitle')}</h2>{relatedError && <p className="text-mr-small text-mr-fg-subtle">{t('details.relatedError')}</p>}{relatedNews.map(item => <Link key={item.id} to={ROUTES.NEWS_DETAIL(item.slug || item.id)} className="grid grid-cols-[92px_1fr] gap-3 rounded-mr-xs border border-mr-border p-2 transition hover:border-mr-accent-50">{item.coverImage && <img src={item.coverImage} alt="" className="aspect-square size-[92px] rounded-mr-xs object-cover" />}<div className="py-1"><p className="line-clamp-3 text-mr-small font-mr-bold text-mr-fg">{item.title}</p><p className="mt-2 text-mr-tiny text-mr-fg-subtle">{formatRelativeDate(item.publishedAt)}</p></div></Link>)}</aside>
                    </div>
                </article>
            </main>
            <IconButton icon={ArrowUp} aria-label={t('details.scrollToTop')} className="fixed bottom-6 right-6 z-40" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        </>
    );
};
export default NewsDetails;
