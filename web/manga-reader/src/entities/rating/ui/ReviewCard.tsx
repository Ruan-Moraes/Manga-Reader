import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Eye, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import { useMediaQuery } from '@shared/lib/useMediaQuery';
import { formatPostDate } from '@shared/service/util/formatPostDate';

import { REVIEW_CRITERIA } from '@entities/rating';

import { Stars } from '@ui/Stars';
import { MangaPoster } from '@ui/MangaPoster';
import { PostShell } from '@ui/PostShell';
import { PostHeader } from '@ui/PostHeader';
import { VotePill } from '@ui/VotePill';
import { ActionBar } from '@ui/ActionBar';
import { Meter } from '@ui/Meter';

export interface ReviewAuthor {
    name: string;
    handle?: string;
    avatar?: string;
    badge?: string;
}

export interface ReviewScores {
    funRating: number;
    artRating: number;
    storylineRating: number;
    charactersRating: number;
    originalityRating: number;
    pacingRating: number;
}

export interface ReviewCardProps {
    author: ReviewAuthor;
    /** ISO de criação (createdAt) — formatado internamente: relativo + tooltip absoluto. */
    when: string;
    /** Resenha foi editada após a criação — exibe o selo "(editado)". */
    edited?: boolean;
    /** ISO da última modificação (updatedAt) — tooltip absoluto no selo "(editado)". */
    updatedAt?: string;
    rating: number;
    title?: string;
    children: ReactNode;
    manga?: { id: string; title: string; cover?: string; gradient?: string };
    upvotes: number;
    /** Votos "Contrário" recebidos */
    downvotes?: number;
    myVote?: 'up' | 'down' | null;
    onVote?: (vote: 'up' | 'down') => void;
    badge?: 'top' | 'featured' | null;
    onClick?: () => void;
    /** Texto coberto por véu até o usuário revelar */
    spoiler?: boolean;
    reviewScores?: ReviewScores;
    density?: 'comfortable' | 'compact';
    /** Ação de editar (só dono) — quando presente, exibe botão Editar. */
    onEdit?: () => void;
    /** Ação de excluir (só dono) — quando presente, exibe botão Excluir com confirmação. */
    onDelete?: () => void;
}

export const ReviewCard = ({
    author,
    when,
    edited = false,
    updatedAt,
    rating,
    title,
    children,
    manga,
    upvotes,
    downvotes = 0,
    myVote,
    onVote,
    badge,
    onClick,
    spoiler = false,
    reviewScores,
    density = 'comfortable',
    onEdit,
    onDelete,
}: ReviewCardProps) => {
    const { t } = useTranslation('rating');

    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const isMobile = useMediaQuery('(max-width: 767px)');

    const compact = density === 'compact';

    const whenDate = formatPostDate(when);
    const editedDate = formatPostDate(updatedAt);

    const text = typeof children === 'string' ? children : '';
    const isLong = text.length > 240 || text.includes('\n');

    const [expanded, setExpanded] = useState(false);
    const [spoilerShown, setSpoilerShown] = useState(false);
    const [breakOpen, setBreakOpen] = useState(false);

    // Componente controlado (DT-47): contadores e voto vêm das props (verdade do
    // servidor, atualizada otimisticamente pela mutation no cache).
    const collapsed = isLong && !expanded;
    const veiled = spoiler && !spoilerShown;

    const handleVote = (vote: 'up' | 'down') => {
        onVote?.(vote);
    };

    return (
        <article
            onClick={onClick}
            className={cn(
                'rounded-mr-md border border-mr-border bg-mr-surface p-4 transition-colors duration-200 hover:border-mr-border-subtle',
                onClick && 'cursor-pointer',
                badge === 'top' && 'border-mr-accent-50 shadow-mr-elevated',
            )}
        >
            <PostShell avatar={{ src: author.avatar, name: author.name }} avatarSize={compact ? 32 : 44} flat>
                <PostHeader
                    name={author.name}
                    time={whenDate.label}
                    timeTitle={whenDate.title}
                    badges={
                        edited ? (
                            <span className="text-mr-tiny text-mr-fg-subtle" title={editedDate.title}>
                                ({t('card.edited')})
                            </span>
                        ) : undefined
                    }
                    right={
                        <span className="flex items-center gap-1.5">
                            <span className="text-[15px] font-mr-extrabold tabular-nums text-mr-accent">{rating.toFixed(1)}</span>
                            <Stars value={rating} size={16} />
                        </span>
                    }
                />

                <div className="flex flex-col gap-2">
                    {title && <h3 className="text-[15px] font-mr-extrabold text-mr-fg">{title}</h3>}

                    {/* Corpo — véu pontilhado quando spoiler, senão o texto */}
                    {veiled ? (
                        <button
                            type="button"
                            onClick={event => {
                                event.stopPropagation();
                                setSpoilerShown(true);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-mr-md border border-dashed border-mr-border-subtle bg-mr-surface-muted p-[18px] text-mr-small font-mr-bold text-mr-fg-subtle transition-all hover:border-mr-accent-50 hover:text-mr-accent cursor-pointer"
                        >
                            <Eye className="size-4" aria-hidden="true" />
                            {t('card.showSpoiler')}
                        </button>
                    ) : (
                        <div className={cn('text-mr-body leading-relaxed text-mr-fg-muted', collapsed && 'line-clamp-5')}>
                            {typeof children === 'string' ? children.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>) : children}
                        </div>
                    )}

                    {isLong && !veiled && (
                        <button
                            type="button"
                            onClick={event => {
                                event.stopPropagation();

                                setExpanded(v => !v);
                            }}
                            className="flex items-center gap-1 text-mr-small font-mr-bold text-mr-accent hover:underline"
                        >
                            {expanded ? t('card.readLess') : t('card.readMore')}
                            <ChevronDown className={cn('size-3.5 transition-transform duration-200', expanded && 'rotate-180')} aria-hidden="true" />
                        </button>
                    )}

                    {/* Breakdown por critério — linhas (igual ao protótipo `.cs-crit`) */}
                    {reviewScores && (
                        <div>
                            <button
                                type="button"
                                onClick={event => {
                                    event.stopPropagation();

                                    setBreakOpen(o => !o);
                                }}
                                aria-expanded={breakOpen}
                                className="flex items-center gap-1.5 self-start text-mr-small font-mr-bold text-mr-fg-subtle transition-colors hover:text-mr-accent"
                            >
                                <ChevronDown className={cn('size-3.5 transition-transform duration-200', breakOpen && 'rotate-180')} aria-hidden="true" />
                                {t('card.breakdown')}
                            </button>
                            {breakOpen && (
                                <div className="mt-1 flex flex-col gap-2.5 rounded-mr-md border border-mr-border bg-mr-surface-muted p-3">
                                    {REVIEW_CRITERIA.map(criterion => {
                                        const value = reviewScores[criterion.key] ?? 0;
                                        const label = t(criterion.labelKey);

                                        return (
                                            <div
                                                key={criterion.key}
                                                className="grid grid-cols-[92px_1fr_30px] items-center gap-2.5 max-md:grid-cols-[76px_1fr_28px]"
                                            >
                                                <span className="text-mr-small text-mr-fg-subtle">
                                                    {isMobile && label.length > 8 ? `${label.slice(0, 8)}...` : label}
                                                </span>
                                                <Meter value={(value / 5) * 100} />
                                                <span className="text-right text-mr-small font-mr-bold text-mr-fg">{value.toFixed(1)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer — voto unificado (VotePill). stopPropagation evita disparar onClick do card. */}
                    <div onClick={event => event.stopPropagation()}>
                        <ActionBar
                            vote={
                                <VotePill
                                    value={(upvotes ?? 0) - (downvotes ?? 0)}
                                    active={myVote ?? null}
                                    onUp={() => handleVote('up')}
                                    onDown={() => handleVote('down')}
                                    label={t('card.voteGroup')}
                                    upLabel={t('card.helpful')}
                                    downLabel={t('card.unhelpful')}
                                />
                            }
                            extra={
                                (onEdit || onDelete) &&
                                (confirmingDelete ? (
                                    <>
                                        <span className="text-mr-tiny text-mr-danger">{t('card.deleteConfirm')}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onDelete?.();
                                                setConfirmingDelete(false);
                                            }}
                                            className="rounded-mr-xs px-2 py-1 text-mr-small font-mr-bold text-mr-danger hover:bg-mr-danger-15 cursor-pointer"
                                        >
                                            {t('card.deleteYes')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmingDelete(false)}
                                            className="rounded-mr-xs px-2 py-1 text-mr-small font-mr-bold text-mr-fg-subtle hover:bg-mr-secondary cursor-pointer"
                                        >
                                            {t('card.deleteNo')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {onEdit && (
                                            <button
                                                type="button"
                                                onClick={onEdit}
                                                aria-label={t('card.edit')}
                                                className="inline-flex items-center gap-1.5 rounded-mr-full border border-mr-chip-border bg-mr-chip px-[13px] py-1.5 text-[12.5px] font-mr-bold text-mr-fg-subtle transition-all hover:border-mr-accent-50 hover:text-mr-fg mr-focus-ring max-md:w-8 max-md:justify-center max-md:gap-0 max-md:px-0"
                                            >
                                                <Pencil className="size-[15px]" aria-hidden="true" />
                                                <span className="hidden md:inline">{t('card.edit')}</span>
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmingDelete(true)}
                                                aria-label={t('card.delete')}
                                                className="inline-flex items-center gap-1.5 rounded-mr-full border border-mr-chip-border bg-mr-chip px-[13px] py-1.5 text-[12.5px] font-mr-bold text-mr-fg-subtle transition-all hover:border-mr-danger hover:text-mr-danger mr-focus-ring max-md:w-8 max-md:justify-center max-md:gap-0 max-md:px-0"
                                            >
                                                <Trash2 className="size-[15px]" aria-hidden="true" />
                                                <span className="hidden md:inline">{t('card.delete')}</span>
                                            </button>
                                        )}
                                    </>
                                ))
                            }
                        />
                    </div>

                    {manga && (
                        <div className="hidden shrink-0 sm:block">
                            <MangaPoster cover={manga.cover} fallbackGradient={manga.gradient} alt="" size={88} radius="sm" />
                        </div>
                    )}
                </div>
            </PostShell>
        </article>
    );
};

export default ReviewCard;
