import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

import { Button } from '@ui/Button';
import ImageLightbox from '@ui/ImageLightbox';
import EmptyState from '@ui/EmptyState';
import type { ChapterPage, NewPageInput } from '@entities/chapter';

import useChapterSelection from '../../model/useChapterSelection';
import ChapterPageCard from './ChapterPageCard';

type ChapterPageGridProps = {
    pages: ChapterPage[];
    isSubmitting: boolean;
    onAddPages: (files: NewPageInput[]) => void;
    onRemovePage: (pageId: string) => void;
    onRemovePages: (pageIds: string[]) => void;
    onReplacePage: (pageId: string, file: NewPageInput) => void;
    onReorder: (orderedIds: string[]) => void;
    onMovePage: (pageId: string, toPosition: number) => void;
    onRetryPage: (pageId: string) => void;
};

/**
 * Grid de páginas do capítulo: DnD (dnd-kit), seleção múltipla, posição
 * manual, substituir/remover/retry e prévia ampliada. O input de arquivos é
 * `multiple` — quando o upload real chegar (DT-44), os `File`s selecionados
 * passam a alimentar `NewPageInput` sem mudança de estrutura.
 */
const ChapterPageGrid = ({ pages, isSubmitting, onAddPages, onRemovePage, onRemovePages, onReplacePage, onReorder, onMovePage, onRetryPage }: ChapterPageGridProps) => {
    const { t } = useTranslation('admin');
    const selection = useChapterSelection();
    const [zoomPage, setZoomPage] = useState<ChapterPage | null>(null);
    const addInputRef = useRef<HTMLInputElement>(null);
    const replaceInputRef = useRef<HTMLInputElement>(null);
    const replaceTargetRef = useRef<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const sorted = [...pages].sort((a, b) => a.order - b.order);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const ids = sorted.map(p => p.id);
        const reordered = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
        onReorder(reordered);
    };

    const filesToInputs = (files: FileList | null): NewPageInput[] => Array.from(files ?? []).map(file => ({ originalFilename: file.name }));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary" size="sm" icon={Plus} loading={isSubmitting} onClick={() => addInputRef.current?.click()}>
                    {t('dashboard.chapters.pages.add')}
                </Button>
                {selection.count > 0 && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            danger
                            onClick={() => {
                                onRemovePages(selection.selectedIds);
                                selection.clear();
                            }}
                        >
                            {t('dashboard.chapters.pages.removeSelected', { count: selection.count })}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={selection.clear}>
                            {t('dashboard.chapters.bulk.clear')}
                        </Button>
                    </>
                )}
                <span className="ml-auto text-mr-tiny text-mr-fg-subtle">{t('dashboard.chapters.pages.count', { count: pages.length })}</span>
            </div>

            {/* Upload múltiplo mock: só o nome do arquivo é usado (DT-44). */}
            <input
                ref={addInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                data-testid="add-pages-input"
                onChange={e => {
                    const inputs = filesToInputs(e.target.files);
                    if (inputs.length) onAddPages(inputs);
                    e.target.value = '';
                }}
            />
            <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                hidden
                data-testid="replace-page-input"
                onChange={e => {
                    const inputs = filesToInputs(e.target.files);
                    if (inputs.length && replaceTargetRef.current) onReplacePage(replaceTargetRef.current, inputs[0]);
                    replaceTargetRef.current = null;
                    e.target.value = '';
                }}
            />

            {sorted.length === 0 ? (
                <EmptyState illustration="pensando" title={t('dashboard.chapters.pages.emptyTitle')} description={t('dashboard.chapters.pages.empty')} />
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sorted.map(p => p.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                            {sorted.map(page => (
                                <ChapterPageCard
                                    key={page.id}
                                    page={page}
                                    totalPages={sorted.length}
                                    selected={selection.isSelected(page.id)}
                                    onToggleSelect={() => selection.toggle(page.id)}
                                    onRemove={() => onRemovePage(page.id)}
                                    onReplace={() => {
                                        replaceTargetRef.current = page.id;
                                        replaceInputRef.current?.click();
                                    }}
                                    onRetry={() => onRetryPage(page.id)}
                                    onZoom={() => setZoomPage(page)}
                                    onMoveTo={position => onMovePage(page.id, position)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <ImageLightbox isOpen={zoomPage !== null} onClose={() => setZoomPage(null)} src={zoomPage?.imageUrl ?? ''} alt={zoomPage?.originalFilename ?? ''} />
        </div>
    );
};

export default ChapterPageGrid;
