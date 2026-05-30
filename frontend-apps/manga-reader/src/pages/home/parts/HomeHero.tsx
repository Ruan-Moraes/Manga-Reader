import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, BookOpen } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { HeroSection } from '@ui/HeroSection';
import { MangaPoster } from '@ui/MangaPoster';
import { Badge } from '@ui/Badge';
import { Stars } from '@ui/Stars';
import { Button } from '@ui/Button';
import { Skeleton } from '@ui/Skeleton';
import type { Title } from '@features/manga';

const HERO_INTERVAL = 8000;

type HomeHeroProps = {
    featuredTitles: Title[];
};

const HomeHero = ({ featuredTitles }: HomeHeroProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('home');

    const [heroIdx, setHeroIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (featuredTitles.length < 2) return;
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced || paused) return;
        timerRef.current = setInterval(() => {
            setHeroIdx(i => (i + 1) % featuredTitles.length);
        }, HERO_INTERVAL);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [featuredTitles.length, paused]);

    const hero = featuredTitles[heroIdx];

    return (
        <section aria-label={t('hero.ariaLabel')} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {hero ? (
                <>
                    <HeroSection
                        eyebrow={t('hero.eyebrow')}
                        eyebrowIcon={Sparkles}
                        title={hero.name}
                        description={hero.synopsis}
                        meta={
                            <>
                                <Stars value={hero.ratingAverage} />
                                {hero.genres.slice(0, 3).map(g => (
                                    <Badge key={g} variant="neutral">
                                        {g}
                                    </Badge>
                                ))}
                                <Badge variant="accent">{hero.status}</Badge>
                            </>
                        }
                        actions={
                            <>
                                <Button variant="primary" icon={BookOpen} onClick={() => navigate(`/titles/${hero.id}`)}>
                                    {t('hero.start')}
                                </Button>
                                <Button variant="raised" onClick={() => navigate(`/titles/${hero.id}`)}>
                                    {t('hero.add')}
                                </Button>
                            </>
                        }
                        visual={
                            <MangaPoster cover={hero.cover} alt={hero.name} size={280} elevated radius="md" onClick={() => navigate(`/titles/${hero.id}`)} />
                        }
                    />
                    {featuredTitles.length > 1 && (
                        <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label={t('hero.indicators')}>
                            {featuredTitles.map((title, i) => (
                                <button
                                    key={title.id}
                                    role="tab"
                                    aria-selected={i === heroIdx}
                                    aria-label={title.name}
                                    onClick={() => {
                                        setHeroIdx(i);
                                        setPaused(true);
                                    }}
                                    className={`h-1.5 rounded-mr-full transition-all duration-mr-default ${
                                        i === heroIdx ? 'w-6 bg-mr-accent' : 'w-1.5 bg-mr-border hover:bg-mr-accent-50'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <Skeleton variant="rect" height={400} className="rounded-mr-md" />
            )}
        </section>
    );
};

export default HomeHero;
