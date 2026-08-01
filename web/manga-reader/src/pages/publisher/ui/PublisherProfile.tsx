import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { BookOpen, Building2, ExternalLink, MapPin } from 'lucide-react';

import { usePublisher, usePublisherWorks } from '@entities/publisher';
import { RelatedWorkCard } from '@entities/manga';
import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { toSafeExternalUrl } from '@shared/lib/safeExternalUrl';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { PageContainer } from '@ui/PageContainer';
import { Pagination } from '@ui/Pagination';
import { Skeleton } from '@ui/Skeleton';
import { SquareAvatar } from '@ui/SquareAvatar';

const PAGE_SIZE = 20;

const PublisherProfile = () => {
    const { slug } = useParams();
    const navigate = useAppNavigate();
    const { t } = useTranslation('manga');
    const [page, setPage] = useState(0);
    const publisherQuery = usePublisher(slug);
    const worksQuery = usePublisherWorks(publisherQuery.data?.id, page, PAGE_SIZE);

    useEffect(() => setPage(0), [slug]);

    if (publisherQuery.isLoading) {
        return (
            <PageContainer asMain size="wide" paddingY="lg">
                <div className="flex gap-5">
                    <Skeleton variant="rect" width={112} height={112} className="rounded-mr-xs" />
                    <Skeleton variant="text" lines={4} className="max-w-xl flex-1" />
                </div>
            </PageContainer>
        );
    }

    if (publisherQuery.isError || !publisherQuery.data) {
        const notFound = (publisherQuery.error as { statusCode?: number } | null)?.statusCode === 404;
        return (
            <PageContainer asMain size="wide" paddingY="lg">
                <EmptyState
                    illustration={notFound ? '404' : 'triste'}
                    title={notFound ? t('publisher.notFoundTitle') : t('publisher.errorTitle')}
                    description={notFound ? t('publisher.notFoundDescription') : t('publisher.errorDescription')}
                    action={
                        <Button variant="primary" onClick={() => (notFound ? navigate(ROUTES.SEARCH) : void publisherQuery.refetch())}>
                            {notFound ? t('publisher.backToSearch') : t('search.retry')}
                        </Button>
                    }
                />
            </PageContainer>
        );
    }

    const publisher = publisherQuery.data;
    const works = worksQuery.data;
    const websiteUrl = toSafeExternalUrl(publisher.website);

    return (
        <PageContainer asMain size="wide" paddingY="lg">
            <header className="relative overflow-hidden rounded-mr-lg border border-mr-separator bg-mr-surface p-5 shadow-sm sm:p-7">
                <div className="pointer-events-none absolute -right-12 -top-20 size-56 rounded-mr-full bg-mr-accent-10 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="shrink-0 self-start rounded-mr-lg bg-mr-accent-10 p-1 shadow-mr-elevated">
                    <SquareAvatar name={publisher.name} logo={publisher.logoUrl ?? undefined} size={112} fontSize={32} />
                </div>
                <div className="min-w-0 flex-1 sm:pt-1">
                    <p className="inline-flex items-center gap-1.5 text-mr-tiny font-mr-extrabold uppercase tracking-widest text-mr-accent-fg">
                        <Building2 className="size-3.5" aria-hidden="true" />
                        {t('publisher.eyebrow')}
                    </p>
                    <h1 className="mt-1 break-words text-2xl font-mr-extrabold text-mr-fg sm:text-3xl">{publisher.name}</h1>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-mr-small text-mr-fg-muted">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {publisher.country || t('publisher.countryUnknown')}
                    </p>
                    {publisher.aliases.length > 0 && (
                        <p className="mt-3 text-mr-small text-mr-fg-muted">
                            {t('publisher.alsoKnownAs', { names: publisher.aliases.map(alias => alias.name).join(', ') })}
                        </p>
                    )}
                    <p className="mt-4 max-w-3xl whitespace-pre-line text-mr-small leading-relaxed text-mr-fg-muted">
                        {publisher.description || t('publisher.noDescription')}
                    </p>
                    {websiteUrl && (
                        <a href={websiteUrl} target="_blank" rel="noreferrer" className="mr-focus-ring mt-4 inline-flex items-center gap-1.5 rounded-mr-xs border border-mr-accent-border bg-mr-accent-10 px-3 py-2 text-mr-small font-mr-bold text-mr-accent-fg motion-safe:transition-colors hover:bg-mr-accent-25">
                            {t('publisher.officialWebsite')}
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                    )}
                </div>
                {works && (
                    <div className="flex shrink-0 items-center gap-3 rounded-mr-sm border border-mr-separator bg-mr-primary px-4 py-3 sm:self-center">
                        <BookOpen className="size-5 text-mr-accent-fg" aria-hidden="true" />
                        <div>
                            <div className="text-xl font-mr-extrabold text-mr-fg">{works.totalElements}</div>
                            <div className="text-mr-tiny font-mr-bold uppercase tracking-[0.08em] text-mr-fg-muted">{t('publisher.workCount', { count: works.totalElements })}</div>
                        </div>
                    </div>
                )}
                </div>
            </header>

            <section className="py-7">
                <h2 className="mb-1 text-xl font-mr-extrabold text-mr-fg">{t('publisher.publishedWorks')}</h2>
                {works && <p className="mb-5 text-mr-small text-mr-fg-muted">{t('publisher.workCount', { count: works.totalElements })}</p>}
                {worksQuery.isLoading && <WorksSkeleton />}
                {worksQuery.isError && (
                    <EmptyState
                        illustration="triste"
                        title={t('publisher.worksErrorTitle')}
                        description={t('publisher.worksErrorDescription')}
                        action={<Button variant="ghost" onClick={() => void worksQuery.refetch()}>{t('search.retry')}</Button>}
                    />
                )}
                {works && works.content.length === 0 && (
                    <EmptyState illustration="pensando" title={t('publisher.noWorksTitle')} description={t('publisher.noWorksDescription')} />
                )}
                {works && works.content.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {works.content.map(work => (
                                <RelatedWorkCard key={work.id} work={work} onOpen={() => navigate(ROUTES.TITLE_DETAIL(work.id))} />
                            ))}
                        </div>
                        {works.totalPages > 1 && <div className="mt-8"><Pagination page={page + 1} total={works.totalPages} onChange={value => setPage(value - 1)} /></div>}
                    </>
                )}
            </section>
        </PageContainer>
    );
};

const WorksSkeleton = () => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, index) => (
            <div key={index}><Skeleton variant="rect" height={220} className="rounded-mr-xs" /><Skeleton variant="text" lines={2} className="mt-2" /></div>
        ))}
    </div>
);

export default PublisherProfile;
