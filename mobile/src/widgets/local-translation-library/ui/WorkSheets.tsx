import { useTranslation } from 'react-i18next';

import type { ManageLocalWorksController } from '@/features/manage-local-works';
import type { LocalMediaPicker } from '@/shared/media-picker';
import { ConfirmDialog } from '@/shared/ui';

import type { LibraryChapter, LibraryWork } from '../model/libraryOverview';
import type { useLibraryOperation } from '../model/useLibraryOperation';
import { CoverSheet, LinkChaptersSheet, NameSheet } from './LibrarySheets';

export type WorkSheet = 'rename' | 'cover' | 'link' | 'delete';

interface Props {
    sheet: WorkSheet | null;
    onClose(): void;
    entry: LibraryWork;
    unassigned: readonly LibraryChapter[];
    controller: ManageLocalWorksController;
    picker: LocalMediaPicker;
    operation: ReturnType<typeof useLibraryOperation>;
    onDeleted(): void;
}

/** Rename, cover, link and delete sheets shared by the work screen and its management screen. */
export function WorkSheets({ sheet, onClose, entry, unassigned, controller, picker, operation, onDeleted }: Props) {
    const { t, i18n } = useTranslation('localTranslation');
    const { work } = entry;
    const unassignedTitle = (chapter: LibraryChapter) => t('shelf.unassignedTitle', { date: new Intl.DateTimeFormat(i18n.language).format(chapter.createdAt) });
    return (
        <>
            <NameSheet
                visible={sheet === 'rename'}
                title={t('sheets.renameWorkTitle')}
                label={t('sheets.name')}
                initial={work.name}
                confirmLabel={t('sheets.save')}
                maxLength={200}
                busy={operation.busy}
                onClose={onClose}
                onSubmit={name =>
                    void operation.run(
                        async () => {
                            await controller.rename(work, name);
                            onClose();
                        },
                        { success: t('feedback.workRenamed') },
                    )
                }
            />
            <CoverSheet
                visible={sheet === 'cover'}
                name={work.name}
                coverUri={controller.coverUri(work)}
                busy={operation.busy}
                onClose={onClose}
                onPick={() =>
                    void operation.run(
                        async () => {
                            const result = await picker.pickImages({ selectionLimit: 1 });
                            if (result.status === 'cancelled') return 'cancelled';
                            if (result.status !== 'selected' || result.images.length !== 1) throw new Error('localWork.picker');
                            await controller.replaceCover(work, result.images[0].uri);
                            onClose();
                        },
                        { success: t('feedback.coverUpdated') },
                    )
                }
                onRemove={() =>
                    void operation.run(
                        async () => {
                            await controller.removeCover(work);
                            onClose();
                        },
                        { success: t('feedback.coverUpdated') },
                    )
                }
            />
            <LinkChaptersSheet
                visible={sheet === 'link'}
                chapters={unassigned}
                firstNumber={entry.chapters.length + 1}
                chapterTitle={unassignedTitle}
                busy={operation.busy}
                onClose={onClose}
                onLink={items =>
                    void operation.run(
                        async () => {
                            let current = work;
                            for (const item of items) current = await controller.attachChapter(current, item.projectId, item.label);
                            onClose();
                        },
                        { success: t('feedback.chaptersLinked', { count: items.length }) },
                    )
                }
            />
            <ConfirmDialog
                visible={sheet === 'delete'}
                onClose={onClose}
                closeLabel={t('menu.close')}
                cancelLabel={t('menu.cancel')}
                confirmLabel={t('confirm.deleteWorkConfirm')}
                title={t('confirm.deleteWorkTitle', { name: work.name })}
                description={t('confirm.irreversible')}
                itemsTitle={t('confirm.itemsTitle')}
                items={[
                    ...(entry.chapters.length ? [t('confirm.itemChapters', { count: entry.chapters.length })] : []),
                    t('confirm.itemTranslations'),
                    t('confirm.itemProgress'),
                    ...(work.coverFilename ? [t('confirm.itemCover')] : []),
                ]}
                onConfirm={() =>
                    void operation.run(() => controller.deleteWork(work), { success: t('feedback.worksDeleted', { count: 1 }) }).then(ok => ok && onDeleted())
                }
            />
        </>
    );
}
