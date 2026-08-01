import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { BookOpen, Palette, PenTool } from 'lucide-react';

import { useAuthor, useAuthorWorks } from '@entities/author';
import { RelatedWorkCard } from '@entities/manga';
import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { PageContainer } from '@ui/PageContainer';
import { Pagination } from '@ui/Pagination';
import { Skeleton } from '@ui/Skeleton';
import { SquareAvatar } from '@ui/SquareAvatar';

const PAGE_SIZE = 20;

const AuthorProfile = () => {
    const { slug } = useParams();
    const location = useLocation();
    const navigate = useAppNavigate();
    const { t } = useTranslation('manga');
    const kind = location.pathname.includes('/artists/') ? 'ARTIST' : 'AUTHOR';
    const [page, setPage] = useState(0);
    const authorQuery = useAuthor(slug);
    const worksQuery = useAuthorWorks(authorQuery.data?.id, page, kind, PAGE_SIZE);

    useEffect(() => setPage(0), [kind, slug]);

    if (authorQuery.isLoading) {
        return (
            <PageContainer asMain size="wide" paddingY="lg">
                <div className="flex gap-5">
                    <Skeleton variant="rect" width={112} height={112} className="rounded-mr-xs" />
                    <Skeleton variant="text" lines={4} className="max-w-xl flex-1" />
                </div>
            </PageContainer>
        );
    }

    if (authorQuery.isError || !authorQuery.data) {
        const notFound = (authorQuery.error as { statusCode?: number } | null)?.statusCode === 404;
        return (
            <PageContainer asMain size="wide" paddingY="lg">
                <EmptyState
                    illustration={notFound ? '404' : 'triste'}
                    title={notFound ? t('person.notFoundTitle') : t('person.errorTitle')}
                    description={notFound ? t('person.notFoundDescription') : t('person.errorDescription')}
                    action={
                        <Button variant="primary" onClick={() => (notFound ? navigate(ROUTES.SEARCH) : void authorQuery.refetch())}>
                            {notFound ? t('person.backToSearch') : t('search.retry')}
                        </Button>
                    }
                />
            </PageContainer>
        );
    }

    const author = authorQuery.data;
    const works = worksQuery.data;

    return (
        <PageContainer asMain size="default" paddingY="lg">
            <header className="relative overflow-hidden rounded-mr-lg border border-mr-separator bg-mr-surface p-5 shadow-sm sm:p-7">
                <div className="pointer-events-none absolute -right-12 -top-20 size-56 rounded-mr-full bg-mr-accent-10 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="shrink-0 self-start rounded-mr-lg bg-mr-accent-10 p-1 shadow-mr-elevated">
                    <SquareAvatar name={author.name} logo={author.imageUrl ?? undefined} size={112} fontSize={32} />
                </div>
                <div className="min-w-0 flex-1 sm:pt-1">
                    <p className="text-mr-tiny font-mr-extrabold uppercase tracking-widest text-mr-accent-fg">
                        <span className="inline-flex items-center gap-1.5">
                            {kind === 'ARTIST' ? <Palette className="size-3.5" aria-hidden="true" /> : <PenTool className="size-3.5" aria-hidden="true" />}
                            {kind === 'ARTIST' ? t('person.artistEyebrow') : t('person.authorEyebrow')}
                        </span>
                    </p>
                    <h1 className="mt-1 break-words text-2xl font-mr-extrabold text-mr-fg sm:text-3xl">{author.name}</h1>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {author.roles.map(role => (
                            <span key={role} className="rounded-mr-full border border-mr-accent-border bg-mr-accent-10 px-2.5 py-1 text-mr-tiny font-mr-bold text-mr-accent-fg">
                                {t(`search.role.${role}`)}
                            </span>
                        ))}
                    </div>
                    {author.aliases.length > 0 && (
                        <p className="mt-3 text-mr-small text-mr-fg-muted">
                            {t('person.alsoKnownAs', { names: author.aliases.map(alias => alias.name).join(', ') })}
                        </p>
                    )}
                    <p className="mt-4 max-w-3xl whitespace-pre-line text-mr-small leading-relaxed text-mr-fg-muted">
                        {author.bio || t('person.noBiography')}
                    </p>
                </div>
                {works && (
                    <div className="flex shrink-0 items-center gap-3 rounded-mr-sm border border-mr-separator bg-mr-primary px-4 py-3 sm:self-center">
                        <BookOpen className="size-5 text-mr-accent-fg" aria-hidden="true" />
                        <div>
                            <div className="text-xl font-mr-extrabold text-mr-fg">{works.totalElements}</div>
                            <div className="text-mr-tiny font-mr-bold uppercase tracking-[0.08em] text-mr-fg-muted">{t('person.workCount', { count: works.totalElements })}</div>
                        </div>
                    </div>
                )}
                </div>
            </header>

            <section className="py-7">
                <div className="mb-5 flex items-end justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-mr-extrabold text-mr-fg">
                            {kind === 'ARTIST' ? t('person.illustratedWorks') : t('person.writtenWorks')}
                        </h2>
                        {works && <p className="text-mr-small text-mr-fg-muted">{t('person.workCount', { count: works.totalElements })}</p>}
                    </div>
                </div>

                {worksQuery.isLoading && <WorksSkeleton />}
                {worksQuery.isError && (
                    <EmptyState
                        illustration="triste"
                        title={t('person.worksErrorTitle')}
                        description={t('person.worksErrorDescription')}
                        action={<Button variant="ghost" onClick={() => void worksQuery.refetch()}>{t('search.retry')}</Button>}
                    />
                )}
                {works && works.content.length === 0 && (
                    <EmptyState illustration="pensando" title={t('person.noWorksTitle')} description={t('person.noWorksDescription')} />
                )}
                {works && works.content.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {works.content.map(work => (
                                <RelatedWorkCard
                                    key={work.id}
                                    work={work}
                                    showRoles
                                    onOpen={() => navigate(ROUTES.TITLE_DETAIL(work.id))}
                                />
                            ))}
                        </div>
                        {works.totalPages > 1 && (
                            <div className="mt-8">
                                <Pagination page={page + 1} total={works.totalPages} onChange={value => setPage(value - 1)} />
                            </div>
                        )}
                    </>
                )}
            </section>
        </PageContainer>
    );
};

const WorksSkeleton = () => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, index) => (
            <div key={index}>
                <Skeleton variant="rect" height={220} className="rounded-mr-xs" />
                <Skeleton variant="text" lines={2} className="mt-2" />
            </div>
        ))}
    </div>
);

export default AuthorProfile;
