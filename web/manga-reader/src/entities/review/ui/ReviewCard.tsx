import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Eye, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import { useMediaQuery } from '@shared/lib/useMediaQuery';
import { formatPostDate } from '@shared/service/util/formatPostDate';

import { REVIEW_CRITERIA } from '@entities/review';

import { Stars } from '@ui/Stars';
import { MangaPoster } from '@ui/MangaPoster';
import { PostShell } from '@ui/PostShell';
import { PostHeader } from '@ui/PostHeader';
import { EditedFlag } from '@ui/EditedFlag';
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
    /** Ausente no modo "centrado na obra" (ex.: Minhas Resenhas) — autor é sempre a própria pessoa logada, redundante exibir. */
    author?: ReviewAuthor;
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
    /**
     * Modo "centrado na obra" (ex.: Minhas Resenhas): quando presente, exibe o
     * título da obra como cabeçalho linkado no topo do card — visível em todas as
     * larguras (diferente do pôster lateral `manga`, oculto no mobile).
     */
    subjectTitle?: { label: string; onClick?: () => void };
    /** Gêneros da obra, exibidos como chips abaixo de `subjectTitle`. */
    genres?: string[];
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
    /** Abre o modal do autor ao clicar no avatar/nome. Só se aplica quando `author` está presente. */
    onClickAuthor?: () => void;
    /** Rótulo acessível do botão de perfil (avatar/nome). Só se aplica quando `author` está presente. */
    authorProfileLabel?: string;
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
    onClickAuthor,
    authorProfileLabel,
    subjectTitle,
    genres,
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
        <article onClick={onClick} className={cn(onClick && 'cursor-pointer')}>
            <PostShell
                avatar={author ? { src: author.avatar, name: author.name } : undefined}
                avatarSize={compact ? 32 : 44}
                op={badge === 'top'}
                onClickAvatar={author ? onClickAuthor : undefined}
            >
                {subjectTitle && (
                    <div className="flex gap-3">
                        {manga && (
                            <div className="hidden shrink-0 sm:block">
                                <MangaPoster cover={manga.cover} fallbackGradient={manga.gradient} alt="" size={80} radius="sm" />
                            </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                                {subjectTitle.onClick ? (
                                    <div className="flex gap-1.5 flex-col">
                                        <button
                                            type="button"
                                            onClick={subjectTitle.onClick}
                                            className="min-w-0 truncate text-left text-[15px] font-mr-extrabold text-mr-fg transition-colors hover:text-mr-accent"
                                        >
                                            {subjectTitle.label}
                                        </button>
                                        {genres && genres.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {genres.map(genre => (
                                                    <span
                                                        key={genre}
                                                        className="rounded-mr-full border border-mr-chip-border bg-mr-chip px-2 py-0.5 text-mr-tiny font-mr-bold text-mr-fg-subtle"
                                                    >
                                                {genre}
                                            </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <h3 className="min-w-0 truncate text-[15px] font-mr-extrabold text-mr-fg">{subjectTitle.label}</h3>
                                )}
                                {!author && (
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <div className="flex items-center gap-1.5 text-mr-small text-mr-fg-subtle">
                                            {edited && <EditedFlag label={t('card.edited')} title={editedDate.title} />}
                                            <time title={whenDate.title}>{whenDate.label}</time>
                                        </div>
                                        {/* No mobile a nota desce para linha própria (abaixo dos gêneros) — aqui só do sm: pra cima. */}
                                        <span className="hidden items-center gap-1.5 sm:flex">
                                            <span className="text-[15px] font-mr-extrabold tabular-nums text-mr-accent">{rating.toFixed(1)}</span>
                                            <Stars value={rating} size={16} />
                                        </span>
                                    </div>
                                )}
                            </div>
                            {!author && (
                                <span className="mt-1.5 flex items-center justify-end gap-1.5 sm:hidden">
                                    <span className="text-[15px] font-mr-extrabold tabular-nums text-mr-accent">{rating.toFixed(1)}</span>
                                    <Stars value={rating} size={16} />
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {author && (
                    <PostHeader
                        name={author.name}
                        time={whenDate.label}
                        timeTitle={whenDate.title}
                        onClickName={onClickAuthor}
                        nameProfileLabel={authorProfileLabel}
                        meta={edited ? <EditedFlag label={t('card.edited')} title={editedDate.title} /> : undefined}
                        right={
                            <span className="flex items-center gap-1.5">
                                <span className="text-[15px] font-mr-extrabold tabular-nums text-mr-accent">{rating.toFixed(1)}</span>
                                <Stars value={rating} size={16} />
                            </span>
                        }
                    />
                )}

                {!author && !subjectTitle && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-mr-small text-mr-fg-subtle">
                            <time title={whenDate.title}>{whenDate.label}</time>
                            {edited && <EditedFlag label={t('card.edited')} title={editedDate.title} />}
                        </div>
                        <span className="flex items-center gap-1.5">
                            <span className="text-[15px] font-mr-extrabold tabular-nums text-mr-accent">{rating.toFixed(1)}</span>
                            <Stars value={rating} size={16} />
                        </span>
                    </div>
                )}

                {title && <h3 className="text-[15px] font-mr-extrabold text-mr-fg">{title}</h3>}

                {/* Corpo — véu pontilhado quando spoiler, senão o texto */}
                {veiled ? (
                    <button
                        type="button"
                        onClick={event => {
                            event.stopPropagation();
                            setSpoilerShown(true);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-mr-xs border border-dashed border-mr-border-subtle bg-mr-surface-muted p-[18px] text-mr-small font-mr-bold text-mr-fg-subtle transition-all hover:border-mr-accent-50 hover:text-mr-accent cursor-pointer"
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
                            <div className="mt-1 flex flex-col gap-2.5 rounded-mr-xs border border-mr-border bg-mr-surface-muted p-3">
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

                {manga && !subjectTitle && (
                    <div className="hidden shrink-0 sm:block">
                        <MangaPoster cover={manga.cover} fallbackGradient={manga.gradient} alt="" size={88} radius="sm" />
                    </div>
                )}
            </PostShell>
        </article>
    );
};

export default ReviewCard;
