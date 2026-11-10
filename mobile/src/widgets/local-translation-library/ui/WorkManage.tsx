import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { LocalTranslationResultRepository } from '@/entities/local-translation-result';
import { type ManageLocalWorksController, manageLocalWorksController } from '@/features/manage-local-works';
import { type LocalMediaPicker, systemLocalMediaPicker } from '@/shared/media-picker';
import { useTheme } from '@/shared/theme';
import { AppText, ListRow, ListSkeleton, StateView } from '@/shared/ui';

import { useLibraryOperation } from '../model/useLibraryOperation';
import { useLibraryOverview } from '../model/useLibraryOverview';
import { WorkCover } from './LibraryParts';
import type { WorkScaffoldSlots } from './WorkDetail';
import { type WorkSheet, WorkSheets } from './WorkSheets';

interface Props {
    workId: string;
    scaffold(slots: WorkScaffoldSlots): ReactNode;
    onViewChapters(): void;
    onMissing(): void;
    controller?: ManageLocalWorksController;
    projects?: Pick<LocalTranslationResultRepository, 'initialize' | 'listLibrary'>;
    picker?: LocalMediaPicker;
}

/** Settings-style group (kit): uppercase label, one card with plain rows and an optional footnote. */
function ManageGroup({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
    const { radii, spacing, tokens } = useTheme();
    return (
        <View style={{ gap: spacing.sm }}>
            <AppText accessibilityRole="header" variant="eyebrow" tone="subtle" style={{ marginLeft: spacing.xs }}>
                {label}
            </AppText>
            <View style={{ backgroundColor: tokens.surface, borderColor: tokens.separator, borderRadius: radii.card, borderWidth: 1, overflow: 'hidden' }}>
                {children}
            </View>
            {note ? (
                <AppText variant="caption" tone="subtle" style={{ marginHorizontal: spacing.xs }}>
                    {note}
                </AppText>
            ) : null}
        </View>
    );
}

export function WorkManage({
    workId,
    scaffold,
    onViewChapters,
    onMissing,
    controller = manageLocalWorksController,
    projects,
    picker = systemLocalMediaPicker,
}: Props) {
    const { t } = useTranslation('localTranslation');
    const { layout, radii, spacing } = useTheme();
    const { overview, error, reload } = useLibraryOverview({ controller, projects });
    const operation = useLibraryOperation(reload);
    const [sheet, setSheet] = useState<WorkSheet | null>(null);
    const left = useRef(false);
    const entry = overview?.works.find(item => item.work.id === workId) ?? null;
    const leave = () => {
        if (left.current) return;
        left.current = true;
        onMissing();
    };
    useEffect(() => {
        if (overview && !entry) leave();
    });

    if (error && !overview) {
        return (
            <>
                {scaffold({
                    title: t('manage.title'),
                    children: (
                        <StateView
                            kind="error"
                            title={t('library.errorTitle')}
                            text={t('library.errorDescription')}
                            retry={{ label: t('actions.retry'), onPress: () => void reload() }}
                        />
                    ),
                    stickyFooter: null,
                })}
            </>
        );
    }
    if (!entry) return <>{scaffold({ title: t('manage.title'), children: <ListSkeleton label={t('shelf.loading')} rows={5} />, stickyFooter: null })}</>;

    const { work } = entry;
    const available = overview!.unassigned.length;
    const body = (
        <View style={{ gap: layout.sectionGap }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
                <WorkCover uri={controller.coverUri(work)} label={t('shelf.coverOf', { name: work.name })} width={52} radius={radii.sm} />
                <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
                    <AppText variant="label" numberOfLines={2}>
                        {work.name}
                    </AppText>
                    <AppText variant="caption" tone="subtle">
                        {[t('shelf.chapterCount', { count: entry.chapters.length }), ...entry.languages.map(pair => pair.split('→').join(' → '))].join(' · ')}
                    </AppText>
                </View>
            </View>
            <ManageGroup label={t('manage.info')}>
                <ListRow variant="plain" icon="create-outline" title={t('manage.name')} meta={work.name} onPress={() => setSheet('rename')} />
                <ListRow
                    variant="plain"
                    showDivider={false}
                    icon="image-outline"
                    title={t('manage.cover')}
                    meta={work.coverFilename ? t('manage.coverCustom') : t('manage.coverNone')}
                    onPress={() => setSheet('cover')}
                />
            </ManageGroup>
            <ManageGroup label={t('manage.chapters')} note={t('manage.chaptersNote')}>
                <ListRow
                    variant="plain"
                    icon="link-outline"
                    title={t('manage.link')}
                    description={available ? t('manage.linkAvailable', { count: available }) : t('manage.linkNone')}
                    onPress={() => setSheet('link')}
                />
                <ListRow
                    variant="plain"
                    showDivider={false}
                    icon="list-outline"
                    title={t('manage.viewChapters')}
                    meta={String(entry.chapters.length)}
                    onPress={onViewChapters}
                />
            </ManageGroup>
            <ManageGroup label={t('manage.danger')} note={t('manage.dangerNote')}>
                <ListRow variant="plain" showDivider={false} icon="trash-outline" tone="danger" title={t('manage.delete')} onPress={() => setSheet('delete')} />
            </ManageGroup>
        </View>
    );

    return (
        <>
            {scaffold({ title: t('manage.title'), children: body, stickyFooter: null })}
            <WorkSheets
                sheet={sheet}
                onClose={() => setSheet(null)}
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
