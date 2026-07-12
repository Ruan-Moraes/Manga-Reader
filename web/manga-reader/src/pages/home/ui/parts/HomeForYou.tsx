import { ROUTES } from '@shared/constant/ROUTES';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { SectionHeader } from '@ui/SectionHeader';
import { MangaCard, type Title } from '@entities/manga';
import { Button } from '@ui/Button';

import { useBookmark } from '@features/library';

type HomeForYouProps = {
    forYou: Title[];
};

const HomeForYou = ({ forYou }: HomeForYouProps) => {
    const navigate = useAppNavigate();
    const { isSaved, toggleBookmark } = useBookmark();
    const { t } = useTranslation('home');

    return (
        <section>
            <SectionHeader
                eyebrow={t('forYou.eyebrow')}
                title={t('forYou.title')}
                meta={t('forYou.meta')}
                action={
                    <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate(ROUTES.CATALOG)}>
                        {t('forYou.explore')}
                    </Button>
                }
                className="mb-6"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {forYou.map(m => (
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
                        onClick={() => navigate(ROUTES.TITLE_DETAIL(m.id))}
                        inLibrary={isSaved(m.id)}
                        onToggleLibrary={() => toggleBookmark(m.id)}
                    />
                ))}
            </div>
        </section>
    );
};

export default HomeForYou;
