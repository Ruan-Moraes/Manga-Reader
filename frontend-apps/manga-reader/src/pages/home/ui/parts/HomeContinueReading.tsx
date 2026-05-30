import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { SectionHeader } from '@ui/SectionHeader';
import { MangaCard } from '@ui/MangaCard';
import { Skeleton } from '@ui/Skeleton';
import { Button } from '@ui/Button';
import type { SavedMangaItem } from '@features/library';

const MangaCardSkeleton = () => <Skeleton variant="rect" height={260} className="rounded-mr-md shrink-0 w-[140px] sm:w-auto" />;

type HomeContinueReadingProps = {
    continueLoading: boolean;
    continueReading: SavedMangaItem[];
};

const HomeContinueReading = ({ continueLoading, continueReading }: HomeContinueReadingProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('home');

    return (
        <section>
            <SectionHeader
                eyebrow={t('continueReading.eyebrow')}
                title={t('continueReading.title')}
                action={
                    <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/library')}>
                        {t('continueReading.viewAll')}
                    </Button>
                }
                className="mb-6"
            />
            {continueLoading ? (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="snap-start shrink-0 w-[140px] sm:w-auto">
                            <MangaCardSkeleton />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
                    {continueReading.map(m => (
                        <div key={m.titleId} className="snap-start shrink-0 w-[140px] sm:w-auto sm:shrink">
                            <MangaCard
                                manga={{
                                    id: m.titleId,
                                    title: m.name,
                                    cover: m.cover,
                                }}
                                onClick={() => navigate(`/titles/${m.titleId}`)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default HomeContinueReading;
