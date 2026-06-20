import { ROUTES } from '@shared/constant/ROUTES';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { ArrowUp, ArrowLeft } from 'lucide-react';

import { PageContainer } from '@ui/PageContainer';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';
import { IconButton } from '@ui/IconButton';

import { useNewsDetails } from '@entities/news';
import { useComments } from '@entities/comment';
import { CommentsSection } from '@features/comment';

import NewsArticleHeader from './parts/NewsArticleHeader';
import NewsArticleBody from './parts/NewsArticleBody';
import NewsRelatedSidebar from './parts/NewsRelatedSidebar';

const NewsDetails = () => {
    const { newsId } = useParams();
    const navigate = useAppNavigate();
    const { t } = useTranslation('news');

    const { news, readingProgress, relatedNews, isLoading } = useNewsDetails(newsId);

    const { comments, totalElements: commentsTotalElements, isLoading: commentsLoading, isError: commentsError, error: commentsErrorObj, refetchComments } = useComments(newsId ?? '', 0, 20, {
        targetType: 'NEWS',
    });

    return (
        <>
            <div
                className="fixed top-0 left-0 z-50 h-0.5 bg-mr-accent transition-all"
                style={{ width: `${readingProgress}%` }}
                role="progressbar"
                aria-valuenow={readingProgress}
                aria-label={t('details.readingProgress')}
            />

            <PageContainer asMain size="default" paddingY="md">
                {isLoading && (
                    <div className="flex flex-col gap-6">
                        <Skeleton variant="rect" height={320} className="rounded-mr-xl" />
                        <Skeleton variant="text" lines={3} />
                        <Skeleton variant="rect" height={200} className="rounded-mr-xl" />
                    </div>
                )}

                {!isLoading && !news && (
                    <EmptyState
                        illustration="404"
                        title={t('details.notFound')}
                        description={t('details.notFoundDesc')}
                        action={
                            <Button variant="primary" icon={ArrowLeft} onClick={() => navigate(ROUTES.NEWS)}>
                                {t('details.backButton')}
                            </Button>
                        }
                    />
                )}

                {!isLoading && news && (
                    <article className="flex flex-col gap-5">
                        <NewsArticleHeader news={news} />

                        <section className="grid gap-6 xl:grid-cols-3">
                            <div className="flex flex-col gap-4 xl:col-span-2">
                                <NewsArticleBody news={news} />
                                <CommentsSection
                                    targetType="NEWS"
                                    targetId={newsId ?? ''}
                                    comments={comments}
                                    totalElements={commentsTotalElements}
                                    isLoading={commentsLoading}
                                    isError={commentsError}
                                    error={commentsErrorObj}
                                    onCommentCreated={refetchComments}
                                />
                            </div>

                            <NewsRelatedSidebar related={relatedNews} />
                        </section>
                    </article>
                )}
            </PageContainer>

            <div className="fixed bottom-6 right-6 z-40">
                <IconButton
                    icon={ArrowUp}
                    aria-label={t('details.scrollToTop')}
                    variant="primary"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                />
            </div>
        </>
    );
};

export default NewsDetails;
