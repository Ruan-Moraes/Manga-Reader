import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Bookmark, Share2 } from 'lucide-react';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { MangaPoster } from '@ui/MangaPoster';
import { Stars } from '@ui/Stars';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { IconButton } from '@ui/IconButton';

import type { Title } from '@feature/manga';

type Average = { average: number; count: number };

type TitleHeroProps = {
    title: Title;
    average: Average;
    groupCount: number;
};

const TitleHero = ({ title, average, groupCount }: TitleHeroProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('manga');
    const [inLibrary, setInLibrary] = useState(false);
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:gap-8">
            <div className="relative shrink-0 self-start">
                <MangaPoster size={220} cover={title.cover} alt={title.name} radius="md" />
                <div className="absolute right-2 top-2">
                    <IconButton
                        icon={Bookmark}
                        aria-label={inLibrary ? t('titleDetails.removeFromLibrary') : t('titleDetails.addToLibrary')}
                        variant={inLibrary ? 'primary' : 'ghost'}
                        onClick={() => setInLibrary(l => !l)}
                    />
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {title.genres.map(g => (
                        <Badge key={g} variant="neutral">
                            {g}
                        </Badge>
                    ))}
                </div>
                <h1 className="mb-1 text-mr-h1 font-mr-extrabold tracking-mr text-mr-fg leading-tight">{title.name}</h1>
                <p className="mb-3 text-mr-small text-mr-fg-muted">
                    {title.author} · {title.status}
                </p>
                <div
                    className="mb-4 flex items-center gap-2"
                    aria-label={t('titleDetails.ratingAria', {
                        rating: title.ratingAverage.toFixed(1),
                        count: average.count.toLocaleString(),
                    })}
                >
                    <Stars value={title.ratingAverage} size={20} />
                    <span className="text-mr-small font-mr-bold text-mr-fg">{title.ratingAverage.toFixed(1)}</span>
                    <span className="text-mr-tiny text-mr-fg-subtle">
                        · {average.count.toLocaleString()} {t('titleDetails.votes')}
                    </span>
                </div>

                <section aria-label={t('titleDetails.synopsisAria')} className="mb-5">
                    <p className={`text-mr-small leading-relaxed text-mr-fg-muted ${!expanded ? 'line-clamp-4 md:line-clamp-none' : ''}`}>{title.synopsis}</p>
                    <button type="button" onClick={() => setExpanded(e => !e)} className="mt-1 text-mr-tiny text-mr-accent hover:underline md:hidden">
                        {expanded ? t('titleDetails.collapse') : t('readMore')}
                    </button>
                </section>

                <div className="mb-5 flex flex-wrap gap-2">
                    <Button variant="primary" icon={Play} onClick={() => navigate(`/titles/${title.id}/chapters/1`)}>
                        {t('titleDetails.startReading')}
                    </Button>
                    <Button variant="raised" icon={Bookmark} onClick={() => setInLibrary(l => !l)}>
                        {inLibrary ? t('titleDetails.inLibrary') : t('titleDetails.addButton')}
                    </Button>
                    <IconButton icon={Share2} aria-label={t('titleDetails.shareAria')} variant="ghost" />
                </div>

                <div className="flex flex-wrap gap-4 text-mr-tiny text-mr-fg-subtle">
                    {title.chaptersCount != null && (
                        <span>
                            <strong className="text-mr-fg">{title.chaptersCount}</strong> {t('titleDetails.chaptersLabel')}
                        </span>
                    )}
                    <span>
                        <strong className="text-mr-fg">{groupCount}</strong> {t('titleDetails.groupsLabel')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TitleHero;
