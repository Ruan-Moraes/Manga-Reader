import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, GripVertical, Loader2, RefreshCw, Replace, Trash2, ZoomIn } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import type { ChapterPage } from '@entities/chapter';

type ChapterPageCardProps = {
    page: ChapterPage;
    selected: boolean;
    onToggleSelect: () => void;
    onRemove: () => void;
    onReplace: () => void;
    onRetry: () => void;
    onZoom: () => void;
    onMoveTo: (position: number) => void;
    totalPages: number;
    readOnly?: boolean;
};

const actionBtn = 'flex size-7 items-center justify-center rounded-mr-xs border border-mr-border bg-mr-surface text-mr-fg-muted transition-colors hover:border-mr-accent-50 hover:text-mr-accent-fg';

/** Card de página: thumb + posição editável + badge do pipeline + ações. */
const ChapterPageCard = ({ page, selected, onToggleSelect, onRemove, onReplace, onRetry, onZoom, onMoveTo, totalPages, readOnly = false }: ChapterPageCardProps) => {
    const { t } = useTranslation('admin');
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id, disabled: readOnly });

    const isPending = page.processingStatus === 'uploading' || page.processingStatus === 'processing';
    const isBroken = page.processingStatus === 'error';

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            data-testid={`page-card-${page.id}`}
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-mr-sm border bg-mr-surface',
                selected ? 'border-mr-accent-border' : 'border-mr-border',
                isBroken && 'border-mr-danger-border',
                isDragging && 'z-10 opacity-90 shadow-mr-black',
            )}
        >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-mr-gray-900">
                {isPending ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-mr-fg-muted">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-mr-tiny font-mr-bold uppercase tracking-mr">{t(`dashboard.chapters.pages.status.${page.processingStatus}`)}</span>
                        <span className="h-1 w-2/3 overflow-hidden rounded-mr-full bg-mr-gray-800">
                            <span className={cn('block h-full bg-mr-accent transition-all', page.processingStatus === 'uploading' ? 'w-1/3' : 'w-2/3')} />
                        </span>
                    </div>
                ) : isBroken ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-mr-danger">
                        <AlertTriangle size={20} />
                        <span className="text-mr-tiny font-mr-bold uppercase tracking-mr">{t('dashboard.chapters.pages.status.error')}</span>
                        <button type="button" onClick={onRetry} disabled={readOnly} className="inline-flex items-center gap-1 rounded-mr-xs border border-mr-danger-border px-2 py-1 text-mr-tiny font-mr-bold hover:bg-mr-danger-15 disabled:cursor-not-allowed disabled:opacity-50">
                            <RefreshCw size={11} /> {t('dashboard.chapters.pages.retry')}
                        </button>
                    </div>
                ) : (
                    <img src={page.thumbnailUrl} alt={page.originalFilename} loading="lazy" className="h-full w-full object-cover" />
                )}

                {!readOnly && <label className="absolute left-2 top-2 z-10 flex size-6 cursor-pointer items-center justify-center rounded-mr-xs bg-mr-overlay-control" onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onToggleSelect}
                        aria-label={t('dashboard.chapters.pages.selectAriaLabel', { order: page.order })}
                        className="size-3.5 cursor-pointer accent-mr-accent"
                    />
                </label>}

                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    aria-label={t('dashboard.chapters.pages.dragAriaLabel', { order: page.order })}
                    disabled={readOnly}
                    className="absolute right-2 top-2 z-10 flex size-6 cursor-grab items-center justify-center rounded-mr-xs bg-mr-overlay-control text-mr-fg-muted hover:text-mr-accent-fg"
                >
                    <GripVertical size={14} />
                </button>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-2">
                {/* Posição manual: aplica no blur/Enter — aplicar no onChange
                    reordenaria a cada dígito intermediário ("12" moveria p/ 1). */}
                <input
                    key={page.order}
                    type="number"
                    min={1}
                    max={totalPages}
                    defaultValue={page.order}
                    disabled={readOnly}
                    onBlur={e => {
                        const position = Number(e.target.value);
                        if (position >= 1 && position <= totalPages && position !== page.order) onMoveTo(position);
                        else e.target.value = String(page.order);
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    aria-label={t('dashboard.chapters.pages.positionAriaLabel', { order: page.order })}
                    className="h-7 w-12 rounded-mr-xs border border-mr-border bg-mr-primary px-1.5 text-center text-mr-tiny tabular-nums text-mr-fg focus:border-mr-accent-border focus:outline-none"
                />
                <span className="min-w-0 flex-1 truncate text-mr-tiny text-mr-fg-subtle" title={page.originalFilename}>
                    {page.originalFilename}
                </span>
            </div>

            <div className="flex items-center justify-end gap-1 px-2 pb-2">
                <button type="button" onClick={onZoom} aria-label={t('dashboard.chapters.pages.zoomAriaLabel', { order: page.order })} className={actionBtn} disabled={isPending}>
                    <ZoomIn size={13} />
                </button>
                <button type="button" onClick={onReplace} disabled={readOnly} aria-label={t('dashboard.chapters.pages.replaceAriaLabel', { order: page.order })} className={actionBtn}>
                    <Replace size={13} />
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={readOnly}
                    aria-label={t('dashboard.chapters.pages.removeAriaLabel', { order: page.order })}
                    className={cn(actionBtn, 'border-mr-danger-border text-mr-danger hover:bg-mr-danger-15 hover:text-mr-danger')}
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
};

export default ChapterPageCard;
