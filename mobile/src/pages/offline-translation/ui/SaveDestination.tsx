import { useEffect, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import type { LocalWork } from '@/entities/local-work';
import { type ManageLocalWorksController, manageLocalWorksController } from '@/features/manage-local-works';
import { useTheme } from '@/shared/theme';
import { AppText, BottomSheet, Button, Icon, type IconName, Input, PressableBox as Pressable } from '@/shared/ui';

export interface ChapterDestination {
    workId: string;
    workName: string;
    label: string;
}

interface Props {
    destination: ChapterDestination | null;
    /** Chapter name shown as the card title (kit): the chosen label or the derived "Capítulo de <data>". */
    chapterTitle: string;
    coverUri?: string | null;
    languages: string;
    locked: boolean;
    controller: Pick<ManageLocalWorksController, 'initialize' | 'listChapters'>;
    onChange(destination: ChapterDestination | null): void;
}

/** "Salvar em" card (056/AC-012): chooses the 055 work that receives the chapter before translating. */
export function SaveDestination({ destination, chapterTitle, coverUri, languages, locked, controller, onChange }: Props) {
    const { t } = useTranslation('launcher');
    const { metrics, radii, spacing, tokens } = useTheme();
    const [open, setOpen] = useState(false);
    const [works, setWorks] = useState<LocalWork[]>([]);
    const [choice, setChoice] = useState<string | null>(destination?.workId ?? null);
    const [query, setQuery] = useState('');
    const selectionRequest = useRef(0);
    const [loadingLabel, setLoadingLabel] = useState(false);
    const [label, setLabel] = useState(destination?.label ?? '');
    const [failedCoverUri, setFailedCoverUri] = useState<string | null>(null);
    const showCover = !!coverUri && failedCoverUri !== coverUri;

    useEffect(() => {
        if (!open) return;
        setQuery('');
        setLoadingLabel(false);
        setChoice(destination?.workId ?? null);
        setLabel(destination?.label ?? '');
        void controller
            .initialize()
            .then(setWorks)
            .catch(() => setWorks([]));
        return () => {
            selectionRequest.current += 1;
        };
    }, [controller, destination, open]);

    const choose = async (work: LocalWork | null) => {
        const request = ++selectionRequest.current;
        setChoice(work?.id ?? null);
        setLoadingLabel(!!work);
        if (!work) return;
        setLabel('');
        const chapters = await controller.listChapters(work.id).catch(() => []);
        if (request !== selectionRequest.current) return;
        setLabel(String(chapters.length + 1));
        setLoadingLabel(false);
    };
    const chosen = works.find(work => work.id === choice) ?? null;
    const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();
    const search = normalize(query);
    const visibleWorks = works.filter(work => normalize(work.name).includes(search));
    const workCoverUri = (work: LocalWork) => {
        try {
            return manageLocalWorksController.coverUri(work);
        } catch {
            return null;
        }
    };
    // Every option is the same card; the chosen one is highlighted (revisão 2026-11-13).
    const row = (key: string, title: string, selected: boolean, onPress: () => void, uri?: string | null, icon: IconName = 'book-outline') => (
        <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityLabel={title}
            accessibilityState={{ selected, checked: selected }}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? tokens.surfacePressed : selected ? tokens.surfaceSelected : tokens.surface,
                borderColor: selected ? tokens.accent : tokens.separator,
                borderRadius: radii.control,
                borderWidth: 1,
                flexDirection: 'row',
                gap: spacing.md,
                minHeight: metrics.row.single,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
            })}
        >
            <View
                style={{ width: 32, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.surfaceMuted, borderRadius: radii.sm }}
            >
                <Icon name={icon} size={metrics.icon.md} color={tokens.muted} decorative />
                {uri ? (
                    <Image
                        source={{ uri }}
                        recyclingKey={key}
                        cachePolicy="memory"
                        contentFit="cover"
                        style={{ position: 'absolute', width: 32, height: 44, borderRadius: radii.sm }}
                    />
                ) : null}
            </View>
            <AppText variant="label" style={{ flex: 1 }} numberOfLines={2}>
                {title}
            </AppText>
            <Icon
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={metrics.icon.lg}
                color={selected ? tokens.accentText : tokens.separator}
                decorative
            />
        </Pressable>
    );

    return (
        <>
            <Pressable
                testID="save-destination"
                accessibilityRole="button"
                accessibilityLabel={`${t('offline.flow3.saveIn', { name: destination?.workName ?? t('offline.flow3.noWork') })}. ${languages}`}
                accessibilityHint={locked ? undefined : t('offline.flow3.saveChange')}
                accessibilityState={{ disabled: locked }}
                disabled={locked}
                onPress={() => setOpen(true)}
                style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? tokens.surfacePressed : tokens.surface,
                    borderColor: tokens.separator,
                    borderRadius: radii.card,
                    borderWidth: 1,
                    flexDirection: 'row',
                    gap: spacing.md,
                    overflow: 'hidden',
                    padding: spacing.md,
                })}
            >
                {showCover ? (
                    <Image
                        testID="save-destination-cover"
                        source={{ uri: coverUri }}
                        contentFit="cover"
                        contentPosition="top"
                        onError={() => setFailedCoverUri(coverUri)}
                        style={{ aspectRatio: 2 / 3, width: 76, borderRadius: radii.control, backgroundColor: tokens.surfaceMuted }}
                    />
                ) : (
                    <View
                        style={{
                            alignItems: 'center',
                            backgroundColor: tokens.accentSoft,
                            borderRadius: radii.control,
                            height: metrics.iconTile.default,
                            justifyContent: 'center',
                            width: metrics.iconTile.default,
                        }}
                    >
                        <Icon name="file-tray-outline" size={metrics.icon.md} color={tokens.accentText} />
                    </View>
                )}
                <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                    <View style={{ gap: spacing.xs }}>
                        <AppText variant="label">{destination?.label ?? chapterTitle}</AppText>
                        <AppText variant="caption" tone="muted">
                            {t('offline.flow3.saveIn', { name: destination?.workName ?? t('offline.flow3.noWork') })}
                        </AppText>
                        <AppText variant="caption" tone="subtle">
                            {languages}
                        </AppText>
                    </View>
                    {!locked ? (
                        <AppText variant="button" tone="accent">
                            {t('offline.flow3.change')}
                        </AppText>
                    ) : null}
                </View>
            </Pressable>
            <BottomSheet
                scroll={false}
                visible={open}
                onClose={() => setOpen(false)}
                closeLabel={t('offline.flow3.close')}
                title={t('offline.flow3.saveTitle')}
                description={t('offline.flow3.saveDescription')}
                footer={
                    <Button
                        fullWidth
                        disabled={choice !== null && (!chosen || loadingLabel || !label.trim())}
                        onPress={() => {
                            onChange(chosen ? { workId: chosen.id, workName: chosen.name, label: label.trim() } : null);
                            setOpen(false);
                        }}
                    >
                        {t('offline.flow3.saveConfirm')}
                    </Button>
                }
            >
                {/* The placeholder already says it; the label stays for screen readers only (revisão 2026-11-13). */}
                <Input
                    accessibilityLabel={t('offline.flow3.searchWorks')}
                    value={query}
                    onChange={setQuery}
                    placeholder={t('offline.flow3.searchWorks')}
                    autoCorrect={false}
                    returnKeyType="search"
                    leading={<Icon name="search" size={metrics.icon.md} color={tokens.muted} decorative />}
                    trailing={
                        query ? (
                            <Pressable accessibilityRole="button" accessibilityLabel={t('offline.flow3.clearSearch')} hitSlop={8} onPress={() => setQuery('')}>
                                <Icon name="close-circle" size={metrics.icon.md} color={tokens.subtle} decorative />
                            </Pressable>
                        ) : null
                    }
                />
                {row('none', t('offline.flow3.noWork'), choice === null, () => void choose(null), null, 'file-tray-outline')}
                {works.length > 0 ? (
                    <AppText accessibilityRole="header" variant="eyebrow" tone="muted" style={{ marginBottom: spacing.xs, marginTop: spacing.md }}>
                        {t('offline.flow3.yourWorks')}
                    </AppText>
                ) : null}
                <FlatList
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    data={visibleWorks}
                    keyExtractor={work => work.id}
                    keyboardShouldPersistTaps="handled"
                    windowSize={5}
                    // Sized to its rows, so the chapter field sits right under the list instead of at the bottom.
                    style={{ flexGrow: 0, flexShrink: 1 }}
                    contentContainerStyle={{ gap: spacing.xs }}
                    ListEmptyComponent={
                        search ? (
                            <View
                                testID="save-destination-empty"
                                accessibilityLiveRegion="polite"
                                style={{ alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }}
                            >
                                <View
                                    style={{
                                        alignItems: 'center',
                                        backgroundColor: tokens.surfaceMuted,
                                        borderRadius: radii.pill,
                                        height: metrics.iconTile.feature,
                                        justifyContent: 'center',
                                        width: metrics.iconTile.feature,
                                    }}
                                >
                                    <Icon name="search-outline" size={metrics.icon.lg} color={tokens.muted} decorative />
                                </View>
                                <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                                    {t('offline.flow3.noMatchingWorks')}
                                </AppText>
                            </View>
                        ) : null
                    }
                    renderItem={({ item: work }) => row(work.id, work.name, choice === work.id, () => void choose(work), workCoverUri(work))}
                />
                {chosen ? (
                    <View style={{ marginTop: spacing.md }}>
                        <Input label={t('offline.flow3.chapterName')} value={label} onChange={setLabel} maxLength={120} />
                    </View>
                ) : null}
            </BottomSheet>
        </>
    );
}
