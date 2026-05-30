import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { SectionHeader } from '@ui/SectionHeader';
import { MangaCard } from '@ui/MangaCard';
import { Badge } from '@ui/Badge';
import { Skeleton } from '@ui/Skeleton';
import { Button } from '@ui/Button';
import type { Title } from '@features/manga';

type HomeTrendingProps = {
    trendingList: Title[];
};

const HomeTrending = ({ trendingList }: HomeTrendingProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('home');

    return (
        <section>
            <SectionHeader
                eyebrow={t('trending.eyebrow')}
                title={t('trending.title')}
                action={
                    <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/genres?sort=most_read')}>
                        {t('trending.viewAll')}
                    </Button>
                }
                className="mb-6"
            />
            {trendingList.length === 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} variant="rect" height={260} className="rounded-mr-md" />
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
                                chapter: m.latestChapterNumber ? Number(m.latestChapterNumber) : undefined,
                            }}
                            tag={<Badge variant="accent">#{i + 1}</Badge>}
                            onClick={() => navigate(`/titles/${m.id}`)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default HomeTrending;
