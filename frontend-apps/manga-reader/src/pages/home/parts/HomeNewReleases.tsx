import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { SectionHeader } from '@ui/SectionHeader';
import { MangaCard } from '@ui/MangaCard';
import { Skeleton } from '@ui/Skeleton';
import { Button } from '@ui/Button';
import type { Title } from '@features/manga';

type HomeNewReleasesProps = {
    releases: Title[];
};

const HomeNewReleases = ({ releases }: HomeNewReleasesProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('home');

    return (
        <section>
            <SectionHeader
                title={t('releases.title')}
                meta={t('releases.meta')}
                action={
                    <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/genres?sort=most_recent')}>
                        {t('releases.viewAll')}
                    </Button>
                }
                className="mb-6"
            />
            {releases.length === 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} variant="rect" height={260} className="rounded-mr-md" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {releases.map(m => (
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
                            onClick={() => navigate(`/titles/${m.id}`)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default HomeNewReleases;
