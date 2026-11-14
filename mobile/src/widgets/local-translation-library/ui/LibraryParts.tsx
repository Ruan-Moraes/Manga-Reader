import { View } from 'react-native';
import { Image } from 'expo-image';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';
import { AppText, Icon, IconButton, PressableBox as Pressable, ProgressFill, Skeleton, StatusChip, useImageFade } from '@/shared/ui';

import type { ContinueReading, LibraryChapter, LibraryWork } from '../model/libraryOverview';

const DEFAULT_COVER = require('../../../../assets/images/logo.png');

/** Cover at 2:3; without a custom cover it shows the packaged default cover (055, decision D15). */
export function WorkCover({ uri, label, width, radius, testID }: { uri: string | null; label: string; width?: number; radius?: number; testID?: string }) {
    const { radii, tokens } = useTheme();
    const fade = useImageFade();
    const shape = { aspectRatio: 2 / 3, borderRadius: radius ?? radii.card, width: width ?? ('100%' as const) };
    if (uri) {
        return (
            <Image
                testID={testID}
                source={{ uri }}
                contentFit="cover"
                transition={fade}
                accessibilityLabel={label}
                style={{ ...shape, backgroundColor: tokens.surfaceMuted }}
            />
        );
    }
    // Default cover (055, D15): the packaged logo as a centred badge, so its own square never shows as bands.
    return (
        <View
            testID={testID}
            accessible
            accessibilityRole="image"
            accessibilityLabel={label}
            style={{ ...shape, alignItems: 'center', backgroundColor: tokens.surfaceMuted, justifyContent: 'center', overflow: 'hidden' }}
        >
            <Image source={DEFAULT_COVER} contentFit="contain" style={{ aspectRatio: 1, borderRadius: radii.control, width: '62%' }} />
        </View>
    );
}

function ProgressBar({ value, testID }: { value: number; testID?: string }) {
    const { tokens } = useTheme();
    return (
        <View testID={testID} style={{ backgroundColor: tokens.separator, borderRadius: 2, height: 4, overflow: 'hidden' }}>
            <ProgressFill value={Math.max(4, Math.min(100, value)) / 100} color={tokens.accent} />
        </View>
    );
}

interface WorkCardProps {
    entry: LibraryWork;
    coverUri: string | null;
    chapterNumber: number | null;
    selecting: boolean;
    selected: boolean;
    onOpen(): void;
    onToggle(): void;
    onMore(): void;
}

export function WorkCard({ entry, coverUri, chapterNumber, selecting, selected, onOpen, onToggle, onMore }: WorkCardProps) {
    const { t } = useTranslation('localTranslation');
    const { metrics, radii, spacing, tokens } = useTheme();
    const { work, chapters, lastRead, failedChapters, processingChapters } = entry;
    const summary =
        lastRead && chapterNumber !== null
            ? t('shelf.stoppedAt', { chapter: chapterNumber })
            : chapters.length
              ? t('shelf.chapterCount', { count: chapters.length })
              : t('shelf.noChapters');
    const progress = lastRead && lastRead.currentPage !== null && lastRead.pages > 0 ? (100 * lastRead.currentPage) / lastRead.pages : null;
    return (
        <View testID={`work-card-${work.id}`} style={{ gap: spacing.sm + 2, minWidth: 0 }}>
            <Pressable
                accessibilityRole={selecting ? 'checkbox' : 'button'}
                accessibilityLabel={selecting ? t('shelf.workSelectLabel', { name: work.name }) : t('shelf.workOpenLabel', { name: work.name })}
                accessibilityState={selecting ? { checked: selected } : undefined}
                onPress={selecting ? onToggle : onOpen}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
                <View>
                    {selected ? (
                        <View
                            pointerEvents="none"
                            style={{
                                borderColor: tokens.accent,
                                borderRadius: radii.card + 3,
                                borderWidth: 2,
                                bottom: -5,
                                left: -5,
                                position: 'absolute',
                                right: -5,
                                top: -5,
                            }}
                        />
                    ) : null}
                    {/* Kit: a barra de progresso fica dentro da capa, recortada pelo raio. */}
                    <View style={{ borderRadius: radii.card, overflow: 'hidden' }}>
                        <WorkCover uri={coverUri} label={t('shelf.coverOf', { name: work.name })} />
                        {progress !== null ? (
                            <View style={{ bottom: 0, left: 0, position: 'absolute', right: 0 }}>
                                <ProgressBar value={progress} testID={`work-card-progress-${work.id}`} />
                            </View>
                        ) : null}
                    </View>
                    {failedChapters || processingChapters ? (
                        <View
                            style={{
                                backgroundColor: tokens.surface,
                                borderRadius: radii.pill,
                                bottom: spacing.sm + (progress !== null ? 4 : 0),
                                left: spacing.sm,
                                position: 'absolute',
                            }}
                        >
                            <StatusChip
                                testID={`work-card-status-${work.id}`}
                                status={failedChapters ? 'failed' : 'processing'}
                                label={failedChapters ? t('shelf.failedCount', { count: failedChapters }) : t('shelf.processing')}
                            />
                        </View>
                    ) : null}
                    {selecting ? (
                        <View
                            style={{
                                alignItems: 'center',
                                backgroundColor: selected ? tokens.accent : tokens.overlay,
                                borderColor: selected ? tokens.accent : tokens.surface,
                                borderRadius: radii.pill,
                                borderWidth: 2,
                                height: 26,
                                justifyContent: 'center',
                                left: spacing.sm,
                                position: 'absolute',
                                top: spacing.sm,
                                width: 26,
                            }}
                        >
                            {selected ? <Icon name="checkmark" size={metrics.icon.sm} color={tokens.onAccent} /> : null}
                        </View>
                    ) : null}
                </View>
            </Pressable>
            <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.xs }}>
                <View testID={`work-card-info-${work.id}`} style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                    <AppText variant="label" numberOfLines={2}>
                        {work.name}
                    </AppText>
                    <AppText variant="caption" tone="subtle" numberOfLines={1}>
                        {summary}
                    </AppText>
                </View>
                {!selecting ? (
                    <View style={{ marginRight: -spacing.sm - 4, marginTop: -spacing.sm - 2 }}>
                        <IconButton bare icon="ellipsis-horizontal" accessibilityLabel={t('shelf.workMore', { name: work.name })} onPress={onMore} />
                    </View>
                ) : null}
            </View>
        </View>
    );
}

export function NewWorkTile({ onPress, compact = false }: { onPress(): void; compact?: boolean }) {
    const { t } = useTranslation('localTranslation');
    const { metrics, radii, spacing, tokens } = useTheme();
    return (
        <Pressable
            testID="new-work-tile"
            accessibilityRole="button"
            accessibilityLabel={t('shelf.newWork')}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: 'center',
                ...(compact ? { flexDirection: 'row' as const, minHeight: 64 } : { aspectRatio: 2 / 3 }),
                width: '100%',
                backgroundColor: pressed ? tokens.surfacePressed : 'transparent',
                borderColor: tokens.borderStrong,
                borderRadius: radii.card,
                borderStyle: 'dashed',
                borderWidth: 1,
                gap: spacing.sm,
                justifyContent: 'center',
                padding: spacing.sm,
            })}
        >
            <Icon name="add" size={metrics.icon.lg} color={tokens.accentText} />
            <AppText variant="label" style={{ textAlign: 'center' }}>
                {t('shelf.newWork')}
            </AppText>
        </Pressable>
    );
}

export function ContinueReadingCard({
    entry,
    coverUri,
    title,
    chapterNumber,
    onPress,
}: {
    entry: ContinueReading;
    coverUri: string;
    title: string;
    chapterNumber: number | null;
    onPress(): void;
}) {
    const { t } = useTranslation('localTranslation');
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const chapter: LibraryChapter = entry.chapter;
    const page = chapter.currentPage ?? 1;
    const meta =
        chapterNumber !== null
            ? t('shelf.continueMeta', { chapter: chapterNumber, page, total: chapter.pages })
            : t('shelf.continueMetaUnassigned', { page, total: chapter.pages });
    return (
        <Pressable
            testID="continue-reading-card"
            accessibilityRole="button"
            accessibilityLabel={t('shelf.continueLabel', { name: title, page, total: chapter.pages })}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? tokens.surfacePressed : tokens.surface,
                borderColor: tokens.separator,
                borderRadius: radii.card,
                borderWidth: 1,
                flexDirection: 'row',
                gap: spacing.md,
                padding: spacing.md,
            })}
        >
            <View style={{ borderRadius: radii.sm, overflow: 'hidden', width: 56 }}>
                <WorkCover uri={coverUri} label={t('shelf.coverOf', { name: title })} width={56} radius={radii.sm} />
                <View style={{ bottom: 0, left: 0, position: 'absolute', right: 0 }}>
                    <ProgressBar value={(100 * page) / Math.max(1, chapter.pages)} />
                </View>
            </View>
            <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <AppText variant="eyebrow" tone="accent">
                    {t('shelf.continueEyebrow')}
                </AppText>
                <AppText variant="section" numberOfLines={1}>
                    {title}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {meta}
                </AppText>
            </View>
            <View
                style={{
                    alignItems: 'center',
                    backgroundColor: tokens.accentSoft,
                    borderRadius: radii.pill,
                    height: minimumTouchTarget,
                    justifyContent: 'center',
                    width: minimumTouchTarget,
                }}
            >
                <Icon name="play" size={metrics.icon.md} color={tokens.accentText} />
            </View>
        </Pressable>
    );
}

export function LibrarySkeleton({ label }: { label: string }) {
    const { radii, spacing } = useTheme();
    return (
        <View testID="library-skeleton" accessibilityLabel={label} accessibilityRole="progressbar" style={{ gap: spacing.lg }}>
            <Skeleton height={104} borderRadius={radii.card} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {[0, 1].map(index => (
                    <View key={index} style={{ flex: 1, gap: spacing.xs }}>
                        <Skeleton height={220} borderRadius={radii.card} />
                        <Skeleton height={14} width="80%" />
                    </View>
                ))}
            </View>
        </View>
    );
}

/** Row with a pressable main area and sibling actions, so nested buttons stay reachable by screen readers. */
export function ItemRow({
    title,
    description,
    leading,
    trailing,
    onPress,
    accessibilityLabel,
    disabled = false,
    testID,
}: {
    title: string;
    description?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
    onPress(): void;
    accessibilityLabel?: string;
    disabled?: boolean;
    testID?: string;
}) {
    const { metrics, radii, spacing, tokens } = useTheme();
    // O fundo de toque e hover cobre o cartão inteiro, não só a área principal (as ações ficam dentro dele).
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const background = disabled ? tokens.surface : pressed ? tokens.surfacePressed : hovered ? tokens.surfaceHover : tokens.surface;
    return (
        <View
            testID={testID}
            onPointerEnter={disabled ? undefined : () => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            style={{
                alignItems: 'center',
                backgroundColor: background,
                borderColor: tokens.separator,
                borderRadius: radii.card,
                borderWidth: 1,
                flexDirection: 'row',
                minHeight: metrics.row.double,
                paddingRight: spacing.xs,
            }}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel ?? title}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={onPress}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    alignItems: 'center',
                    alignSelf: 'stretch',
                    borderRadius: radii.card,
                    flex: 1,
                    flexDirection: 'row',
                    gap: metrics.rhythm.itemGap,
                    minWidth: 0,
                    opacity: disabled ? 0.56 : 1,
                    outlineColor: tokens.focus,
                    outlineOffset: -2,
                    outlineWidth: focused ? 2 : 0,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                }}
            >
                {leading}
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <AppText variant="label" numberOfLines={2}>
                        {title}
                    </AppText>
                    {description ? (
                        <AppText variant="caption" tone="muted" numberOfLines={2}>
                            {description}
                        </AppText>
                    ) : null}
                </View>
            </Pressable>
            {trailing ? <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>{trailing}</View> : null}
        </View>
    );
}
