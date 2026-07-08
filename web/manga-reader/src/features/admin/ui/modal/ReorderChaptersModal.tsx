import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { cn } from '@shared/lib/cn';
import type { AdminChapter } from '@entities/chapter';

type ReorderChaptersModalProps = {
    isOpen: boolean;
    onClose: () => void;
    chapters: AdminChapter[];
    isSubmitting: boolean;
    /** Recebe o conjunto COMPLETO reordenado (contrato atômico do gateway). */
    onConfirm: (orderedIds: string[]) => Promise<void>;
};

const SortableRow = ({ chapter }: { chapter: AdminChapter }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                'flex items-center gap-3 rounded-mr-xs border border-mr-border bg-mr-surface px-3 py-2.5',
                isDragging && 'z-10 border-mr-accent-50 bg-mr-accent-25 shadow-mr-black',
            )}
        >
            <button type="button" {...attributes} {...listeners} className="cursor-grab text-mr-fg-muted hover:text-mr-accent" aria-label={chapter.title}>
                <GripVertical size={16} />
            </button>
            <span className="w-12 tabular-nums text-mr-small font-mr-bold text-mr-accent">#{chapter.number}</span>
            <span className="min-w-0 flex-1 truncate text-mr-small text-mr-fg">{chapter.title}</span>
        </li>
    );
};

/** Reordenação de capítulos da obra por arrastar (dnd-kit, acessível por teclado). */
const ReorderChaptersModal = ({ isOpen, onClose, chapters, isSubmitting, onConfirm }: ReorderChaptersModalProps) => {
    const { t } = useTranslation('admin');
    const [ordered, setOrdered] = useState<AdminChapter[]>([]);

    useEffect(() => {
        if (isOpen) setOrdered([...chapters].sort((a, b) => a.displayOrder - b.displayOrder));
    }, [isOpen, chapters]);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setOrdered(items => {
            const from = items.findIndex(i => i.id === active.id);
            const to = items.findIndex(i => i.id === over.id);
            return arrayMove(items, from, to);
        });
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={t('dashboard.chapters.reorder.title')}
            size="md"
            loading={isSubmitting}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="primary" size="sm" loading={isSubmitting} onClick={() => void onConfirm(ordered.map(c => c.id))}>
                        {t('dashboard.chapters.reorder.confirm')}
                    </Button>
                </>
            }
        >
            <div>
                <p className="mb-3 text-mr-tiny text-mr-fg-subtle">{t('dashboard.chapters.reorder.hint')}</p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={ordered.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        <ul className="flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto">
                            {ordered.map(chapter => (
                                <SortableRow key={chapter.id} chapter={chapter} />
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
            </div>
        </Modal>
    );
};

export default ReorderChaptersModal;
