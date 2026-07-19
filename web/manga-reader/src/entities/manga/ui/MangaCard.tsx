import { memo, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { Stars } from '@ui/Stars';
import { IconButton } from '@ui/IconButton';
import { ProgressBar } from '@ui/ProgressBar';
import { useAdultContentPreference } from '@entities/user/@x/manga';

export interface Manga {
    id: string;
    title: string;
    author?: string;
    cover?: string;
    fallbackGradient?: string;
    rating?: number;
    genre?: string[];
    chapter?: number;
    status?: 'reading' | 'completed' | 'on-hold' | 'dropped' | 'planned';
    adult?: boolean;
}

export interface MangaCardProps {
    manga: Manga;
    featured?: boolean;
    tag?: ReactNode;
    progress?: number;
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
    onToggleLibrary?: () => void;
    inLibrary?: boolean;
}

const sizeTitle = {
    sm: 'text-[13px]',
    md: 'text-mr-small',
    lg: 'text-mr-body',
};

const MangaCardBase = ({ manga, featured, tag, progress, size = 'md', onClick, onToggleLibrary, inLibrary }: MangaCardProps) => {
    const { t } = useTranslation('library');
    const [hover, setHover] = useState(false);
    const [adultRevealed, setAdultRevealed] = useState(false);
    const adultPreference = useAdultContentPreference();
    useEffect(() => setAdultRevealed(false), [adultPreference, manga.id]);
    if (manga.adult && adultPreference === 'HIDE') return null;
    const shouldBlur = Boolean(manga.adult) && adultPreference === 'BLUR' && !adultRevealed;
    const lifted = hover || featured;

    return (
        <a
            href="#"
            onClick={e => {
                e.preventDefault();
                onClick?.();
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className={cn('block min-w-0 no-underline transition-transform duration-mr-default mr-focus-ring', lifted && '-translate-y-0.5')}
        >
            <div
                className={cn(
                    'relative aspect-[2/3] overflow-hidden rounded-mr-xs border bg-mr-surface',
                    featured ? 'border-mr-accent-border shadow-mr-elevated' : 'border-mr-border',
                    lifted && !featured && 'shadow-mr-elevated',
                )}
                style={
                    !manga.cover
                        ? {
                              background: manga.fallbackGradient ?? 'var(--mr-poster-gradient)',
                          }
                        : undefined
                }
            >
                {manga.cover && <img src={manga.cover} alt="" loading="lazy" className={cn('absolute inset-0 size-full object-cover', shouldBlur && 'blur-xl scale-110')} />}

                {shouldBlur && (
                    <button
                        type="button"
                        className="absolute inset-0 z-20 flex items-center justify-center bg-mr-overlay-control px-4 text-center text-mr-small font-mr-bold text-mr-on-overlay"
                        onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            setAdultRevealed(true);
                        }}
                    >
                        {t('adultContent.reveal', { defaultValue: 'Conteúdo adulto — revelar' })}
                    </button>
                )}

                {tag && <div className="absolute left-2 top-2 z-10">{tag}</div>}

                {onToggleLibrary && (
                    <div className="absolute right-2 top-2 z-10">
                        <IconButton
                            icon={Bookmark}
                            size="sm"
                            variant="ghost"
                            aria-label={inLibrary ? t('bookmark.saved') : t('bookmark.save')}
                            aria-pressed={inLibrary}
                            onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleLibrary();
                            }}
                            className={cn(
                                '!border-mr-on-overlay/70 !bg-mr-overlay-strong !text-mr-on-overlay backdrop-blur-sm hover:!border-mr-accent hover:!bg-mr-overlay',
                                inLibrary && '!border-mr-accent !text-mr-accent',
                            )}
                        />
                    </div>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-2">
                    <p
                        className={cn(
                            'line-clamp-2 font-mr-extrabold leading-tight tracking-mr text-mr-on-overlay [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]',
                            sizeTitle[size],
                            shouldBlur && 'blur-sm select-none',
                        )}
                    >
                        {manga.title}
                    </p>
                    {manga.author && <div className="mt-0.5 truncate text-[11px] text-mr-on-overlay/80">{manga.author}</div>}
                    {(manga.rating != null || manga.chapter != null) && (
                        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-mr-on-overlay/80">
                            {manga.rating != null && <Stars value={manga.rating} size={12} />}
                            {manga.chapter != null && <span className="font-mr-bold">Cap. {manga.chapter}</span>}
                        </div>
                    )}
                </div>
            </div>

            {progress != null && <ProgressBar value={progress} thickness="thin" label={`Progresso de leitura: ${progress}%`} className="mt-1" />}
        </a>
    );
};

export const MangaCard = memo(MangaCardBase);

export default MangaCard;
