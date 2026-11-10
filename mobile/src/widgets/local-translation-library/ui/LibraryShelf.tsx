import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import type { LocalTranslationResultRepository } from '@/entities/local-translation-result';
import { type RemoveLocalTranslationProjectController, removeLocalTranslationProjectController } from '@/features/local-translation';
import { type ManageLocalWorksController, manageLocalWorksController } from '@/features/manage-local-works';
import { type LocalMediaPicker, systemLocalMediaPicker } from '@/shared/media-picker';
import { useTheme } from '@/shared/theme';
import { ActionSheet, Button, ConfirmDialog, Icon, IconButton, SectionAction, SectionHeader, StateView, StickyActionBar } from '@/shared/ui';

import { chapterNumber, type LibraryChapter, type LibraryWork, sortWorks, type WorkSortOrder } from '../model/libraryOverview';
import { useLibraryOperation } from '../model/useLibraryOperation';
import { useLibraryOverview } from '../model/useLibraryOverview';
import { ContinueReadingCard, ItemRow, LibrarySkeleton, NewWorkTile, WorkCard } from './LibraryParts';
import { CoverSheet, MoveChapterSheet, NameSheet } from './LibrarySheets';

/** iOS cannot present a modal while another one is dismissing; chained sheets wait for the close animation. */
export const SHEET_CHAIN_DELAY_MS = Platform.OS === 'ios' ? 350 : 0;

export interface LibraryScaffoldSlots {
    children: ReactNode;
    stickyFooter: ReactNode;
}

interface Props {
    scaffold(slots: LibraryScaffoldSlots): ReactNode;
    onOpenWork(workId: string): void;
    onOpenReader(projectId: string): void;
    onTranslate(): void;
    /** Opens the batch of a chapter that has no translated page yet (never sent, or every page failed). */
    onTranslateChapter?(projectId: string): void;
    controller?: ManageLocalWorksController;
    projects?: Pick<LocalTranslationResultRepository, 'initialize' | 'listLibrary'>;
    picker?: LocalMediaPicker;
    removeProject?: Pick<RemoveLocalTranslationProjectController, 'remove'>;
    /** Changes whenever the screen regains focus, so data edited elsewhere is reloaded. */
    refreshToken?: unknown;
}

type Sheet =
    | { kind: 'newWork' }
    | { kind: 'workMenu'; entry: LibraryWork }
    | { kind: 'renameWork'; entry: LibraryWork }
    | { kind: 'cover'; entry: LibraryWork }
    | { kind: 'deleteWorks'; entries: LibraryWork[] }
    | { kind: 'chapterMenu'; chapter: LibraryChapter }
    | { kind: 'move'; chapter: LibraryChapter }
    | { kind: 'deleteChapter'; chapter: LibraryChapter };

export function useChainedSheet<T>() {
    const [sheet, setSheet] = useState<T | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);
    const chain = (next: T) => {
        setSheet(null);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setSheet(next), SHEET_CHAIN_DELAY_MS);
    };
    return { sheet, open: setSheet, close: () => setSheet(null), chain };
}

export function LibraryShelf({
    scaffold,
    onOpenWork,
    onOpenReader,
    onTranslate,
    onTranslateChapter,
    controller = manageLocalWorksController,
    projects,
    picker = systemLocalMediaPicker,
    removeProject = removeLocalTranslationProjectController,
    refreshToken,
}: Props) {
    const { t, i18n } = useTranslation('localTranslation');
    const { layout, metrics, spacing, tokens, radii } = useTheme();
    const { overview, error, reload } = useLibraryOverview({ controller, projects });
    const operation = useLibraryOperation(reload);
    const sheets = useChainedSheet<Sheet>();
    const [order, setOrder] = useState<WorkSortOrder>('recent');
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
    const first = useRef(true);

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        void reload();
    }, [refreshToken, reload]);

    const works = useMemo(() => (overview ? sortWorks(overview.works, order, i18n.language) : []), [i18n.language, order, overview]);
    const formatDate = (value: number) => new Intl.DateTimeFormat(i18n.language).format(value);
    const unassignedTitle = (chapter: LibraryChapter) => t('shelf.unassignedTitle', { date: formatDate(chapter.createdAt) });
    const entryOf = (workId: string) => overview?.works.find(entry => entry.work.id === workId) ?? null;

    useEffect(() => {
        if (!overview) return;
        const ids = new Set(overview.works.map(entry => entry.work.id));
        setSelected(current => new Set([...current].filter(id => ids.has(id))));
    }, [overview]);

    const pickCover = (entry: LibraryWork) =>
        void operation.run(
            async () => {
                const result = await picker.pickImages({ selectionLimit: 1 });
                if (result.status === 'cancelled') return 'cancelled';
                if (result.status !== 'selected' || result.images.length !== 1) throw new Error('localWork.picker');
                await controller.replaceCover(entry.work, result.images[0].uri);
                sheets.close();
            },
            { success: t('feedback.coverUpdated') },
        );

    const exitSelection = () => {
        setSelecting(false);
        setSelected(new Set());
    };
    const toggle = (workId: string) =>
        setSelected(current => {
            const next = new Set(current);
            if (next.has(workId)) next.delete(workId);
            else next.add(workId);
            return next;
        });

    const footer = selecting ? (
        <StickyActionBar>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                    <Button fullWidth variant="outline" onPress={exitSelection}>
                        {t('shelf.cancelSelection')}
                    </Button>
                </View>
                <View style={{ flex: 1 }}>
                    <Button
                        fullWidth
                        tone="danger"
                        disabled={selected.size === 0 || operation.busy}
                        onPress={() => sheets.open({ kind: 'deleteWorks', entries: works.filter(entry => selected.has(entry.work.id)) })}
                    >
                        {t('shelf.deleteSelected', { count: Math.max(1, selected.size) })}
                    </Button>
                </View>
            </View>
        </StickyActionBar>
    ) : (
        <StickyActionBar>
            <Button fullWidth leading={<Icon name="language-outline" size={metrics.icon.md} color={tokens.onAccent} />} onPress={onTranslate}>
                {t('shelf.translate')}
            </Button>
        </StickyActionBar>
    );

    let body: ReactNode;
    if (error && !overview) {
        body = (
            <StateView
                kind="error"
                title={t('library.errorTitle')}
                text={t('library.errorDescription')}
                retry={{ label: t('actions.retry'), onPress: () => void reload() }}
            />
        );
    } else if (!overview) {
        body = <LibrarySkeleton label={t('shelf.loading')} />;
    } else if (overview.works.length === 0 && overview.unassigned.length === 0) {
        body = (
            <StateView
                kind="empty"
                title={t('shelf.emptyTitle')}
                text={t('shelf.emptyText')}
                actions={<Button onPress={() => sheets.open({ kind: 'newWork' })}>{t('sheets.create')}</Button>}
            />
        );
    } else {
        const resume = overview.continueReading;
        const resumeEntry = resume?.work ? entryOf(resume.work.id) : null;
        const rows: (LibraryWork | 'new')[][] = [];
        const cells: (LibraryWork | 'new')[] = [...works, ...(selecting ? [] : (['new'] as const))];
        for (let index = 0; index < cells.length; index += 2) rows.push(cells.slice(index, index + 2));
        body = (
            <View style={{ gap: layout.sectionGap }}>
                {resume && !selecting ? (
                    <ContinueReadingCard
                        entry={resume}
                        coverUri={resume.work ? (controller.coverUri(resume.work) ?? '') : resume.chapter.coverUri}
                        title={resume.work ? resume.work.name : unassignedTitle(resume.chapter)}
                        chapterNumber={resumeEntry ? chapterNumber(resumeEntry, resume.chapter.projectId) : null}
                        onPress={() => onOpenReader(resume.chapter.projectId)}
                    />
                ) : null}
                <View>
                    <SectionHeader dense title={t('shelf.works')} count={overview.works.length}>
                        {overview.works.length > 1 && !selecting ? (
                            <SectionAction
                                testID="sort-action"
                                icon="swap-vertical"
                                label={order === 'recent' ? t('shelf.sortRecent') : t('shelf.sortAlpha')}
                                accessibilityLabel={order === 'recent' ? t('shelf.sortRecentLabel') : t('shelf.sortAlphaLabel')}
                                onPress={() => setOrder(order === 'recent' ? 'alpha' : 'recent')}
                            />
                        ) : null}
                        {overview.works.length > 0 ? (
                            <SectionAction
                                testID="select-action"
                                tone="accent"
                                label={selecting ? t('shelf.done') : t('shelf.select')}
                                onPress={() => (selecting ? exitSelection() : setSelecting(true))}
                            />
                        ) : null}
                    </SectionHeader>
                    <View style={{ gap: spacing.lg }}>
                        {rows.map(row => (
                            <View key={row.map(cell => (cell === 'new' ? 'new' : cell.work.id)).join(':')} style={{ flexDirection: 'row', gap: spacing.md }}>
                                {row.map(cell => (
                                    <View key={cell === 'new' ? 'new' : cell.work.id} style={{ flex: 1, minWidth: 0 }}>
                                        {cell === 'new' ? (
                                            <NewWorkTile onPress={() => sheets.open({ kind: 'newWork' })} />
                                        ) : (
                                            <WorkCard
                                                entry={cell}
                                                coverUri={controller.coverUri(cell.work)}
                                                chapterNumber={cell.lastRead ? chapterNumber(cell, cell.lastRead.projectId) : null}
                                                selecting={selecting}
                                                selected={selected.has(cell.work.id)}
                                                onOpen={() => onOpenWork(cell.work.id)}
                                                onToggle={() => toggle(cell.work.id)}
                                                onMore={() => sheets.open({ kind: 'workMenu', entry: cell })}
                                            />
                                        )}
                                    </View>
                                ))}
                                {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                            </View>
                        ))}
                    </View>
                </View>
                {overview.unassigned.length && !selecting ? (
                    <View testID="unassigned-section">
                        <SectionHeader title={t('shelf.unassigned')} count={overview.unassigned.length} />
                        <View style={{ gap: spacing.sm }}>
                            {overview.unassigned.map(chapter => {
                                const title = unassignedTitle(chapter);
                                return (
                                    <ItemRow
                                        key={chapter.projectId}
                                        testID={`unassigned-${chapter.projectId}`}
                                        title={title}
                                        description={[
                                            t('shelf.unassignedMeta', {
                                                source: chapter.sourceLanguage,
                                                target: chapter.targetLanguage,
                                                ready: chapter.readyPages,
                                                total: chapter.pages,
                                            }),
                                            ...(chapter.demo ? [t('demo.badge')] : []),
                                        ].join(' · ')}
                                        leading={
                                            <Image
                                                source={{ uri: chapter.coverUri }}
                                                contentFit="cover"
                                                accessibilityIgnoresInvertColors
                                                style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.control, height: 48, width: 36 }}
                                            />
                                        }
                                        trailing={
                                            <IconButton
                                                icon="ellipsis-horizontal"
                                                accessibilityLabel={t('shelf.chapterMore', { name: title })}
                                                onPress={() => sheets.open({ kind: 'chapterMenu', chapter })}
                                            />
                                        }
                                        // Nothing to read yet: the row opens the batch instead of being disabled (2026-11-10).
                                        disabled={chapter.readyPages === 0 && !onTranslateChapter}
                                        onPress={() =>
                                            chapter.readyPages === 0 && onTranslateChapter
                                                ? onTranslateChapter(chapter.projectId)
                                                : onOpenReader(chapter.projectId)
                                        }
                                    />
                                );
                            })}
                        </View>
                    </View>
                ) : null}
            </View>
        );
    }

    const sheet = sheets.sheet;
    const workItems = (entry: LibraryWork) => [
        ...(entry.chapters.length ? [t('confirm.itemChapters', { count: entry.chapters.length })] : []),
        t('confirm.itemTranslations'),
        t('confirm.itemProgress'),
        ...(entry.work.coverFilename ? [t('confirm.itemCover')] : []),
    ];

    return (
        <>
            {scaffold({
                children: <View style={{ gap: spacing.md }}>{body}</View>,
                stickyFooter: footer,
            })}
            <NameSheet
                visible={sheet?.kind === 'newWork'}
                title={t('sheets.newWorkTitle')}
                description={t('sheets.newWorkDescription')}
                label={t('sheets.name')}
                initial=""
                requireChange={false}
                confirmLabel={t('sheets.create')}
                maxLength={200}
                busy={operation.busy}
                onClose={sheets.close}
                onSubmit={name =>
                    void operation.run(
                        async () => {
                            await controller.create(name);
                            sheets.close();
                        },
                        { success: t('feedback.workCreated') },
                    )
                }
            />
            <ActionSheet
                visible={sheet?.kind === 'workMenu'}
                onClose={sheets.close}
                closeLabel={t('menu.close')}
                cancelLabel={t('menu.cancel')}
                title={sheet?.kind === 'workMenu' ? sheet.entry.work.name : undefined}
                actions={
                    sheet?.kind === 'workMenu'
                        ? [
                              { key: 'open', label: t('menu.openWork'), icon: 'book-outline', onPress: () => onOpenWork(sheet.entry.work.id) },
                              {
                                  key: 'rename',
                                  label: t('menu.rename'),
                                  icon: 'create-outline',
                                  onPress: () => sheets.chain({ kind: 'renameWork', entry: sheet.entry }),
                              },
                              {
                                  key: 'cover',
                                  label: sheet.entry.work.coverFilename ? t('menu.changeCover') : t('menu.chooseCover'),
                                  icon: 'image-outline',
                                  onPress: () => sheets.chain({ kind: 'cover', entry: sheet.entry }),
                              },
                              {
                                  key: 'delete',
                                  label: t('menu.deleteWork'),
                                  icon: 'trash-outline',
                                  destructive: true,
                                  onPress: () => sheets.chain({ kind: 'deleteWorks', entries: [sheet.entry] }),
                              },
                          ]
                        : []
                }
            />
            <NameSheet
                visible={sheet?.kind === 'renameWork'}
                title={t('sheets.renameWorkTitle')}
                label={t('sheets.name')}
                initial={sheet?.kind === 'renameWork' ? sheet.entry.work.name : ''}
                confirmLabel={t('sheets.save')}
                maxLength={200}
                busy={operation.busy}
                onClose={sheets.close}
                onSubmit={name =>
                    sheet?.kind === 'renameWork' &&
                    void operation.run(
                        async () => {
                            await controller.rename(sheet.entry.work, name);
                            sheets.close();
                        },
                        { success: t('feedback.workRenamed') },
                    )
                }
            />
            <CoverSheet
                visible={sheet?.kind === 'cover'}
                name={sheet?.kind === 'cover' ? sheet.entry.work.name : ''}
                coverUri={sheet?.kind === 'cover' ? controller.coverUri(sheet.entry.work) : null}
                busy={operation.busy}
                onClose={sheets.close}
                onPick={() => sheet?.kind === 'cover' && pickCover(sheet.entry)}
                onRemove={() =>
                    sheet?.kind === 'cover' &&
                    void operation.run(
                        async () => {
                            await controller.removeCover(sheet.entry.work);
                            sheets.close();
                        },
                        { success: t('feedback.coverUpdated') },
                    )
                }
            />
            <ConfirmDialog
                visible={sheet?.kind === 'deleteWorks'}
                onClose={sheets.close}
                closeLabel={t('menu.close')}
                cancelLabel={t('menu.cancel')}
                confirmLabel={
                    sheet?.kind === 'deleteWorks' && sheet.entries.length > 1
                        ? t('shelf.deleteSelected', { count: sheet.entries.length })
                        : t('confirm.deleteWorkConfirm')
                }
                title={
                    sheet?.kind === 'deleteWorks'
                        ? sheet.entries.length === 1
                            ? t('confirm.deleteWorkTitle', { name: sheet.entries[0].work.name })
                            : t('confirm.deleteWorksTitle', { count: sheet.entries.length })
                        : ''
                }
                description={t('confirm.irreversible')}
                itemsTitle={t('confirm.itemsTitle')}
                items={
                    sheet?.kind === 'deleteWorks'
                        ? sheet.entries.length === 1
                            ? workItems(sheet.entries[0])
                            : [
                                  t('confirm.itemChapters', { count: sheet.entries.reduce((sum, entry) => sum + entry.chapters.length, 0) }),
                                  t('confirm.itemTranslations'),
                                  t('confirm.itemProgress'),
                              ]
                        : []
                }
                onConfirm={() => {
                    if (sheet?.kind !== 'deleteWorks') return;
                    const entries = sheet.entries;
                    void operation
                        .run(
                            async () => {
                                let cleanupPending = false;
                                for (const entry of entries) cleanupPending = (await controller.deleteWork(entry.work)).cleanupPending || cleanupPending;
                                return { cleanupPending };
                            },
                            { success: t('feedback.worksDeleted', { count: entries.length }) },
                        )
                        .then(ok => ok && exitSelection());
                }}
            />
            <ActionSheet
                visible={sheet?.kind === 'chapterMenu'}
                onClose={sheets.close}
                closeLabel={t('menu.close')}
                cancelLabel={t('menu.cancel')}
                title={sheet?.kind === 'chapterMenu' ? unassignedTitle(sheet.chapter) : undefined}
                actions={
                    sheet?.kind === 'chapterMenu'
                        ? [
                              {
                                  key: 'open',
                                  label: t('menu.openReader'),
                                  icon: 'book-outline',
                                  disabled: sheet.chapter.readyPages === 0,
                                  onPress: () => onOpenReader(sheet.chapter.projectId),
                              },
                              ...(onTranslateChapter && sheet.chapter.readyPages < sheet.chapter.pages
                                  ? [
                                        {
                                            key: 'translate',
                                            label: sheet.chapter.failedPages > 0 ? t('menu.retry') : t('menu.translateNow'),
                                            icon: 'language-outline' as const,
                                            onPress: () => onTranslateChapter(sheet.chapter.projectId),
                                        },
                                    ]
                                  : []),
                              {
                                  key: 'move',
                                  label: t('menu.moveToWork'),
                                  icon: 'folder-outline',
                                  onPress: () => sheets.chain({ kind: 'move', chapter: sheet.chapter }),
                              },
                              {
                                  key: 'delete',
                                  label: t('menu.delete'),
                                  icon: 'trash-outline',
                                  destructive: true,
                                  onPress: () => sheets.chain({ kind: 'deleteChapter', chapter: sheet.chapter }),
                              },
                          ]
                        : []
                }
            />
            <MoveChapterSheet
                visible={sheet?.kind === 'move'}
                works={works}
                busy={operation.busy}
                onClose={sheets.close}
                onMove={(entry, label) =>
                    sheet?.kind === 'move' &&
                    void operation.run(
                        async () => {
                            await controller.attachChapter(entry.work, sheet.chapter.projectId, label);
                            sheets.close();
                        },
                        { success: t('feedback.chapterMoved') },
                    )
                }
            />
            <ConfirmDialog
                visible={sheet?.kind === 'deleteChapter'}
                onClose={sheets.close}
                closeLabel={t('menu.close')}
                cancelLabel={t('menu.cancel')}
                confirmLabel={t('confirm.deleteChapterConfirm')}
                title={sheet?.kind === 'deleteChapter' ? t('confirm.deleteChapterTitle', { name: unassignedTitle(sheet.chapter) }) : ''}
                description={t('confirm.irreversible')}
                itemsTitle={t('confirm.itemsTitle')}
                items={
                    sheet?.kind === 'deleteChapter'
                        ? [t('confirm.itemPages', { count: sheet.chapter.pages }), t('confirm.itemTranslations'), t('confirm.itemProgress')]
                        : []
                }
                onConfirm={() =>
                    sheet?.kind === 'deleteChapter' &&
                    void operation.run(() => removeProject.remove(sheet.chapter.projectId), { success: t('feedback.chapterDeleted') })
                }
            />
        </>
    );
}
