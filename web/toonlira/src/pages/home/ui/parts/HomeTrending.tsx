import { ROUTES } from '@shared/constant/ROUTES';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { SectionHeader } from '@ui/SectionHeader';
import { MangaCard, type Title } from '@entities/manga';
import { Skeleton } from '@ui/Skeleton';
import { Button } from '@ui/Button';

import { useBookmark } from '@features/library';

type HomeTrendingProps = {
    trendingList: Title[];
};

const HomeTrending = ({ trendingList }: HomeTrendingProps) => {
    const navigate = useAppNavigate();
    const { isSaved, toggleBookmark } = useBookmark();

    const { t } = useTranslation('home');

    return (
        <section>
            <SectionHeader
                eyebrow={t('trending.eyebrow')}
                title={t('trending.title')}
                action={
                    <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate(ROUTES.CATALOG_SORT('most_read'))}>
                        {t('trending.viewAll')}
                    </Button>
                }
                className="mb-6"
            />
            {trendingList.length === 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} variant="rect" height={260} className="rounded-ui-xs" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {trendingList.map((m, i) => (
                        <MangaCard
                            key={m.id}
                            manga={{
                                id: m.id,
                                title: m.name,
                                author: m.author,
                                cover: m.cover,
                                rating: m.ratingAverage,
                                adult: m.adult,
                                chapter: m.latestChapterNumber ? Number(m.latestChapterNumber) : undefined,
                            }}
                            tag={
                                <span className="inline-flex min-w-7 items-center justify-center rounded-ui-full border border-ui-accent-border bg-ui-accent px-2 py-0.5 text-ui-tiny font-ui-extrabold tracking-ui-label text-ui-on-accent shadow-ui-black">
                                    #{i + 1}
                                </span>
                            }
                            onClick={() => navigate(ROUTES.TITLE_DETAIL(m.id))}
                            inLibrary={isSaved(m.id)}
                            onToggleLibrary={() => toggleBookmark(m.id)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default HomeTrending;
