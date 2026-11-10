import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { LocalTranslationResultRepository } from '@/entities/local-translation-result';
import { type ManageLocalWorksController, manageLocalWorksController } from '@/features/manage-local-works';
import { type LocalMediaPicker, systemLocalMediaPicker } from '@/shared/media-picker';
import { useTheme } from '@/shared/theme';
import {
    ActionSheet,
    AppText,
    Button,
    ConfirmDialog,
    Icon,
    IconButton,
    ListSkeleton,
    PressableBox as Pressable,
    SectionAction,
    SectionHeader,
    StateView,
    StatusChip,
    StickyActionBar,
} from '@/shared/ui';

import type { LibraryChapter, LibraryWork } from '../model/libraryOverview';
import { useLibraryOperation } from '../model/useLibraryOperation';
import { useLibraryOverview } from '../model/useLibraryOverview';
import { WorkCover } from './LibraryParts';
import { MoveChapterSheet, NameSheet } from './LibrarySheets';
import type { LibraryScaffoldSlots } from './LibraryShelf';
import { useChainedSheet } from './LibraryShelf';
import { type WorkSheet, WorkSheets } from './WorkSheets';

export interface WorkScaffoldSlots extends LibraryScaffoldSlots {
    title: string;
    /** False while loading or when the work has no chapter yet: the header keeps only back and home. */
    hasChapters?: boolean;
}

interface Props {
    workId: string;
    scaffold(slots: WorkScaffoldSlots): ReactNode;
    onOpenReader(projectId: string): void;
    onNewChapter(target: { workId: string; label: string }): void;
    onRetryChapter(projectId: string): void;
    /** Chapter never sent: opens the batch to translate it (defaults to the retry action). */
    onTranslateChapter?(projectId: string): void;
    /** The work does not exist (removed elsewhere or deleted here): leave without an empty screen. */
    onMissing(): void;
    controller?: ManageLocalWorksController;
    projects?: Pick<LocalTranslationResultRepository, 'initialize' | 'listLibrary'>;
    picker?: LocalMediaPicker;
    refreshToken?: unknown;
}

type ChapterSheet = { kind: 'menu' | 'rename' | 'delete' | 'move' | 'unlink'; chapter: LibraryChapter } | { kind: 'new' } | { kind: 'work'; sheet: WorkSheet };

function ChapterTile({ number, current }: { number: number; current: boolean }) {
    const { metrics, radii, tokens } = useTheme();
    return (
        <View
            style={{
                alignItems: 'center',
                backgroundColor: current ? tokens.accent : tokens.surfaceMuted,
                borderRadius: radii.control,
                height: metrics.control.default,
                justifyContent: 'center',
                width: metrics.control.default,
            }}
        >
            <AppText variant="label" style={{ color: current ? tokens.onAccent : tokens.text }}>
                {number}
            </AppText>
        </View>
    );
}

/** 32-high action pill inside a 44 touch target (kit: "Ler", "Continuar", "Ver"). */
function ChapterPill({ label, strong, accessibilityLabel, onPress }: { label: string; strong: boolean; accessibilityLabel: string; onPress(): void }) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}
            style={{ justifyContent: 'center', minHeight: minimumTouchTarget }}
        >
            {({ pressed }) => (
                <View
                    style={{
                        alignItems: 'center',
                        backgroundColor: strong ? tokens.accent : pressed ? tokens.surfacePressed : tokens.accentSoft,
                        borderRadius: radii.pill,
                        height: 32,
                        justifyContent: 'center',
                        paddingHorizontal: spacing.sm + 4,
                    }}
                >
                    <AppText variant="button" style={{ color: strong ? tokens.onAccent : tokens.accentText }} numberOfLines={1}>
                        {label}
                    </AppText>
                </View>
            )}
        </Pressable>
    );
}

export function WorkDetail({
    workId,
    scaffold,
    onOpenReader,
    onNewChapter,
    onRetryChapter,
    onTranslateChapter,
    onMissing,
    controller = manageLocalWorksController,
    projects,
    picker = systemLocalMediaPicker,
    refreshToken,
}: Props) {
    const { t, i18n } = useTranslation('localTranslation');
    const { layout, metrics, radii, spacing, tokens } = useTheme();
    const { overview, error, reload } = useLibraryOverview({ controller, projects });
    const operation = useLibraryOperation(reload);
    const sheets = useChainedSheet<ChapterSheet>();
    const [descending, setDescending] = useState(false);
    const left = useRef(false);
    const first = useRef(true);
    const entry: LibraryWork | null = overview?.works.find(item => item.work.id === workId) ?? null;

    const leave = () => {
        if (left.current) return;
        left.current = true;
        onMissing();
    };
    useEffect(() => {
        if (overview && !entry) leave();
    });
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        void reload();
    }, [refreshToken, reload]);

    const formatDate = (value: number) => new Intl.DateTimeFormat(i18n.language).format(value);
    const numberOf = (chapter: LibraryChapter) => (entry ? entry.chapters.indexOf(chapter) + 1 : 0);
    const chapterName = (chapter: LibraryChapter) => chapter.label ?? '';

    if (error && !overview) {
        return (
            <>
                {scaffold({
                    title: t('work.title'),
                    children: (
                        <StateView
                            kind="error"
                            title={t('library.errorTitle')}
                            text={t('library.errorDescription')}
                            retry={{ label: t('actions.retry'), onPress: () => void reload() }}
                        />
                    ),
                    stickyFooter: null,
                    hasChapters: false,
                })}
            </>
        );
    }
    if (!entry) {
        return (
            <>{scaffold({ title: t('work.title'), children: <ListSkeleton label={t('shelf.loading')} rows={4} />, stickyFooter: null, hasChapters: false })}</>
        );
    }

    const { work, chapters } = entry;
    const visible = descending ? [...chapters].reverse() : chapters;
    const firstReadable = chapters.find(chapter => chapter.readyPages > 0) ?? null;
    const sheet = sheets.sheet;
    const newChapter = () => sheets.open({ kind: 'new' });

    const footer = (
        <StickyActionBar>
            {entry.lastRead ? (
                <Button
                    fullWidth
                    leading={<Icon name="play" size={metrics.icon.md} color={tokens.onAccent} />}
                    onPress={() => onOpenReader(entry.lastRead!.projectId)}
                >
                    {t('work.footerContinue', { chapter: numberOf(entry.lastRead), page: entry.lastRead.currentPage ?? 1 })}
                </Button>
            ) : firstReadable ? (
                <Button fullWidth onPress={() => onOpenReader(firstReadable.projectId)}>
                    {t('work.footerStart')}
                </Button>
            ) : (
                <Button fullWidth onPress={newChapter}>
                    {t('work.footerNew')}
                </Button>
            )}
        </StickyActionBar>
    );

    const pill = (chapter: LibraryChapter) =>
        chapter.state === 'failed' && chapter.readyPages === 0
            ? t('work.pillView')
            : entry.lastRead?.projectId === chapter.projectId
              ? t('work.pillContinue')
              : chapter.state === 'failed'
                ? t('work.pillView')
                : t('work.pillRead');

    const body = (
        <View style={{ gap: layout.sectionGap }}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('work.coverButton', { name: work.name })}
                    onPress={() => sheets.open({ kind: 'work', sheet: 'cover' })}
                >
                    <WorkCover uri={controller.coverUri(work)} label={t('shelf.coverOf', { name: work.name })} width={112} />
                    <View
                        style={{
                            alignItems: 'center',
                            backgroundColor: tokens.surface,
                            borderColor: tokens.separator,
                            borderRadius: radii.pill,
                            borderWidth: 1,
                            bottom: -spacing.xs,
                            height: 32,
                            justifyContent: 'center',
                            position: 'absolute',
                            right: -spacing.xs,
                            width: 32,
                        }}
                    >
                        <Icon name="camera-outline" size={metrics.icon.sm} color={tokens.muted} />
                    </View>
                </Pressable>
                <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                    <AppText accessibilityRole="header" variant="title" numberOfLines={3}>
                        {work.name}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                        {t('work.summary', {
                            chapters: t('shelf.chapterCount', { count: chapters.length }),
                            pages: t('work.pageCount', { count: entry.pages }),
                        })}
                    </AppText>
                    {entry.languages.length ? (
                        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
                            <Icon name="language-outline" size={metrics.icon.sm} color={tokens.muted} />
                            <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
                                {entry.languages.map(pair => pair.split('→').join(' → ')).join(' · ')}
                            </AppText>
                        </View>
                    ) : null}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                        {entry.failedChapters ? (
                            <StatusChip testID="work-failed" status="failed" label={t('shelf.failedCount', { count: entry.failedChapters })} />
                        ) : null}
                        {entry.processingChapters ? (
                            <StatusChip testID="work-processing" status="processing" label={t('work.processingBadge', { count: entry.processingChapters })} />
                        ) : null}
                    </View>
                </View>
            </View>
            <View>
                <SectionHeader title={t('work.chapters')} count={chapters.length}>
                    {chapters.length > 1 ? (
                        <SectionAction
                            testID="chapter-order"
                            icon="swap-vertical"
                            label={descending ? t('work.orderDesc') : t('work.orderAsc')}
                            accessibilityLabel={descending ? t('work.orderDescLabel') : t('work.orderAscLabel')}
                            onPress={() => setDescending(!descending)}
                        />
                    ) : null}
                    <SectionAction tone="accent" icon="add" label={t('work.newChapter')} accessibilityLabel={t('work.newChapterLabel')} onPress={newChapter} />
                </SectionHeader>
                {chapters.length === 0 ? (
                    <StateView
                        kind="empty"
                        inline
                        title={t('work.emptyTitle')}
                        text={t('work.emptyText')}
                        actions={
                            overview!.unassigned.length ? (
                                <Button variant="outline" onPress={() => sheets.open({ kind: 'work', sheet: 'link' })}>
                                    {t('work.linkPrevious')}
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <View
                        testID="chapter-group"
                        style={{ backgroundColor: tokens.surface, borderColor: tokens.separator, borderRadius: radii.card, borderWidth: 1, overflow: 'hidden' }}
                    >
                        {visible.map((chapter, index) => {
                            const number = numberOf(chapter);
                            const current = entry.lastRead?.projectId === chapter.projectId;
                            const meta = current
                                ? t('work.stoppedAtPage', { page: chapter.currentPage ?? 1, total: chapter.pages })
                                : t('work.chapterMeta', {
                                      pages: t('work.pageCount', { count: chapter.pages }),
                                      date: formatDate(chapter.link?.updatedAt ?? chapter.createdAt),
                                  });
                            return (
                                <View
                                    key={chapter.projectId}
                                    testID={`chapter-row-${chapter.projectId}`}
                                    style={{
                                        alignItems: 'center',
                                        backgroundColor: current ? tokens.accentSoft : 'transparent',
                                        borderTopColor: tokens.separator,
                                        borderTopWidth: index === 0 ? 0 : 1,
                                        flexDirection: 'row',
                                        gap: spacing.sm,
                                        paddingRight: spacing.xs,
                                    }}
                                >
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={t('work.chapterA11y', { number, name: chapterName(chapter) })}
                                        onPress={() => onOpenReader(chapter.projectId)}
                                        style={({ pressed }) => ({
                                            alignItems: 'center',
                                            backgroundColor: pressed ? tokens.surfacePressed : 'transparent',
                                            flex: 1,
                                            flexDirection: 'row',
                                            gap: metrics.rhythm.itemGap,
                                            minHeight: metrics.row.double,
                                            minWidth: 0,
                                            paddingLeft: spacing.md,
                                            paddingRight: spacing.xs,
                                            paddingVertical: spacing.sm,
                                        })}
                                    >
                                        <ChapterTile number={number} current={current} />
                                        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                                            <AppText variant="label" numberOfLines={1}>
                                                {chapterName(chapter)}
                                            </AppText>
                                            <AppText variant="caption" tone="subtle" numberOfLines={1}>
                                                {meta}
                                            </AppText>
                                            {chapter.state !== 'saved' ? (
                                                <View style={{ marginTop: 4 }}>
                                                    <StatusChip
                                                        testID={`chapter-status-${chapter.projectId}`}
                                                        status={chapter.state}
                                                        label={t(`status.${chapter.state}`)}
                                                    />
                                                </View>
                                            ) : null}
                                        </View>
                                    </Pressable>
                                    <ChapterPill
                                        label={pill(chapter)}
                                        strong={current}
                                        accessibilityLabel={`${pill(chapter)} — ${chapterName(chapter)}`}
                                        onPress={() => onOpenReader(chapter.projectId)}
                                    />
                                    <IconButton
                                        bare
                                        tone="default"
                                        icon="ellipsis-vertical"
                                        accessibilityLabel={t('shelf.chapterMore', { name: chapterName(chapter) })}
                                        onPress={() => sheets.open({ kind: 'menu', chapter })}
                                    />
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        </View>
    );

    const target = sheet && 'chapter' in sheet ? sheet.chapter : null;
    return (
        <>
            {scaffold({ title: work.name, children: body, stickyFooter: footer, hasChapters: chapters.length > 0 })}
            <ActionSheet
                visible={sheet?.kind === 'menu'}
                onClose={sheets.close}
                closeLabel={t('menu.close')}
                cancelLabel={t('menu.cancel')}
                title={target ? chapterName(target) : undefined}
                actions={
                    target
                        ? [
                              { key: 'open', label: t('menu.openReader'), icon: 'book-outline', onPress: () => onOpenReader(target.projectId) },
                              ...(target.failedPages > 0
                                  ? [{ key: 'retry', label: t('menu.retry'), icon: 'refresh' as const, onPress: () => onRetryChapter(target.projectId) }]
                                  : // Never sent (consent declined, left before sending): offer to translate it now (2026-11-10).
                                    target.readyPages < target.pages && target.state === 'waiting'
                                    ? [
                                          {
                                              key: 'translate',
                                              label: t('menu.translateNow'),
                                              icon: 'language-outline' as const,
                                              onPress: () => (onTranslateChapter ?? onRetryChapter)(target.projectId),
                                          },
                                      ]
                                    : []),
                              {
                                  key: 'rename',
                                  label: t('menu.renameChapter'),
                                  icon: 'create-outline',
                                  onPress: () => sheets.chain({ kind: 'rename', chapter: target }),
                              },
                              ...((overview?.works.length ?? 0) > 1
                                  ? [
                                        {
                                            key: 'move',
                                            label: t('menu.moveToOtherWork'),
                                            icon: 'folder-outline' as const,
                                            onPress: () => sheets.chain({ kind: 'move', chapter: target }),
                                        },
                                    ]
                                  : []),
                              {
                                  key: 'unlink',
                                  label: t('menu.unlinkChapter'),
                                  icon: 'remove-circle-outline',
                                  onPress: () => sheets.chain({ kind: 'unlink', chapter: target }),
                              },
                              {
                                  key: 'delete',
                                  label: t('menu.deleteChapter'),
                                  icon: 'trash-outline',
                                  destructive: true,
                                  onPress: () => sheets.chain({ kind: 'delete', chapter: target }),
                              },
                          ]
                        : []
                }
            />
            <NameSheet
                visible={sheet?.kind === 'rename'}
                title={t('sheets.renameChapterTitle')}
                label={t('sheets.chapterName')}
                initial={target?.label ?? ''}
                confirmLabel={t('sheets.save')}
                maxLength={120}
                busy={operation.busy}
                onClose={sheets.close}
                onSubmit={label =>
                    target?.link &&
                    void operation.run(
                        async () => {
                            await controller.renameChapter(work, target.link!, label);
                            sheets.close();
                        },
                        { success: t('feedback.chapterRenamed') },
                    )
                }
            />
            <MoveChapterSheet
                visible={sheet?.kind === 'move'}
                works={(overview?.works ?? []).filter(item => item.work.id !== work.id)}
                busy={operation.busy}
                onClose={sheets.close}
                onMove={(destination, label) =>
                    target &&
                    void operation.run(
                        async () => {
                            await controller.moveChapter(work, target.projectId, destination.work, label);
                            sheets.close();
                        },
                        { success: t('feedback.chapterMoved') },
                    )
                }
            />
            <ConfirmDialog
                visible={sheet?.kind === 'unlink'}
                tone="accent"
                icon="remove-circle-outline"
                onClose={sheets.close}
                closeLabel={t('menu.close')}
                cancelLabel={t('menu.cancel')}
                confirmLabel={t('confirm.unlinkConfirm')}
                title={target ? t('confirm.unlinkTitle', { name: chapterName(target) }) : ''}
                description={t('confirm.unlinkDescription')}
                onConfirm={() =>
                    target && void operation.run(() => controller.moveChapter(work, target.projectId, null, ''), { success: t('feedback.chapterUnlinked') })
                }
            />
            <ConfirmDialog
                visible={sheet?.kind === 'delete'}
                onClose={sheets.close}
                closeLabel={t('menu.close')}
                cancelLabel={t('menu.cancel')}
                confirmLabel={t('confirm.deleteChapterConfirm')}
                title={target ? t('confirm.deleteChapterTitle', { name: chapterName(target) }) : ''}
                description={t('confirm.irreversible')}
                itemsTitle={t('confirm.itemsTitle')}
                items={target ? [t('confirm.itemPages', { count: target.pages }), t('confirm.itemTranslations'), t('confirm.itemProgress')] : []}
                onConfirm={() =>
                    target && void operation.run(() => controller.deleteChapter(work, target.projectId), { success: t('feedback.chapterDeleted') })
                }
            />
            <NameSheet
                visible={sheet?.kind === 'new'}
                title={t('work.footerNew')}
                label={t('sheets.chapterName')}
                initial={String(chapters.length + 1)}
                requireChange={false}
                confirmLabel={t('work.footerNew')}
                maxLength={120}
                onClose={sheets.close}
                onSubmit={label => {
                    sheets.close();
                    onNewChapter({ workId: work.id, label });
                }}
            />
            <WorkSheets
                sheet={sheet?.kind === 'work' ? sheet.sheet : null}
                onClose={sheets.close}
                entry={entry}
                unassigned={overview!.unassigned}
                controller={controller}
                picker={picker}
                operation={operation}
                onDeleted={leave}
            />
        </>
    );
}
