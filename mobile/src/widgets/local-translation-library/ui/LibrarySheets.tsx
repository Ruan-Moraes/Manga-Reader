import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';
import { AppText, BottomSheet, Button, Icon, Input, PressableBox as Pressable, StateView } from '@/shared/ui';

import type { LibraryChapter, LibraryWork } from '../model/libraryOverview';
import { WorkCover } from './LibraryParts';

interface NameSheetProps {
    visible: boolean;
    title: string;
    description?: string;
    label: string;
    initial: string;
    confirmLabel: string;
    maxLength: number;
    busy?: boolean;
    /** Rename forms require a different value; create forms accept the suggested one. */
    requireChange?: boolean;
    onClose(): void;
    onSubmit(value: string): void;
}

/** Required single-field form; the action stays disabled while empty or unchanged. */
export function NameSheet({
    visible,
    title,
    description,
    label,
    initial,
    confirmLabel,
    maxLength,
    busy = false,
    requireChange = true,
    onClose,
    onSubmit,
}: NameSheetProps) {
    const { t } = useTranslation('localTranslation');
    const [value, setValue] = useState(initial);
    useEffect(() => {
        if (visible) setValue(initial);
    }, [initial, visible]);
    const disabled = busy || !value.trim() || (requireChange && value.trim() === initial.trim());
    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            closeLabel={t('menu.close')}
            title={title}
            description={description}
            footer={
                <Button fullWidth disabled={disabled} onPress={() => onSubmit(value.trim())}>
                    {confirmLabel}
                </Button>
            }
        >
            <Input label={label} value={value} onChange={setValue} maxLength={maxLength} autoFocus />
        </BottomSheet>
    );
}

export function CoverSheet({
    visible,
    name,
    coverUri,
    busy = false,
    onClose,
    onPick,
    onRemove,
}: {
    visible: boolean;
    name: string;
    coverUri: string | null;
    busy?: boolean;
    onClose(): void;
    onPick(): void;
    onRemove(): void;
}) {
    const { t } = useTranslation('localTranslation');
    const { spacing } = useTheme();
    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            closeLabel={t('menu.close')}
            title={t('sheets.coverTitle')}
            description={t('sheets.coverDescription')}
            footer={
                <View style={{ gap: spacing.sm }}>
                    <Button fullWidth disabled={busy} onPress={onPick}>
                        {t('sheets.coverPick')}
                    </Button>
                    {coverUri ? (
                        <Button fullWidth tone="danger" variant="outline" disabled={busy} onPress={onRemove}>
                            {t('sheets.coverRemove')}
                        </Button>
                    ) : null}
                    <Button fullWidth variant="ghost" onPress={onClose}>
                        {t('menu.cancel')}
                    </Button>
                </View>
            }
        >
            <View style={{ alignItems: 'center' }}>
                <WorkCover uri={coverUri} label={t('shelf.coverOf', { name })} width={120} testID="cover-sheet-preview" />
            </View>
        </BottomSheet>
    );
}

function SelectRow({
    title,
    description,
    selected,
    role,
    onPress,
    accessibilityLabel,
}: {
    title: string;
    description?: string;
    selected: boolean;
    role: 'radio' | 'checkbox';
    onPress(): void;
    accessibilityLabel?: string;
}) {
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    return (
        <Pressable
            accessibilityRole={role}
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityState={{ checked: selected }}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? tokens.surfacePressed : selected ? tokens.surfaceSelected : 'transparent',
                borderRadius: radii.control,
                flexDirection: 'row',
                gap: spacing.md,
                minHeight: Math.max(minimumTouchTarget, metrics.row.double),
                paddingHorizontal: spacing.sm,
            })}
        >
            <Icon
                name={role === 'radio' ? (selected ? 'radio-button-on' : 'radio-button-off') : selected ? 'checkbox' : 'square-outline'}
                size={metrics.icon.lg}
                color={selected ? tokens.accentText : tokens.muted}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
                <AppText variant="label" numberOfLines={2}>
                    {title}
                </AppText>
                {description ? (
                    <AppText variant="caption" tone="muted" numberOfLines={1}>
                        {description}
                    </AppText>
                ) : null}
            </View>
        </Pressable>
    );
}

export function MoveChapterSheet({
    visible,
    works,
    busy = false,
    onClose,
    onMove,
}: {
    visible: boolean;
    works: readonly LibraryWork[];
    busy?: boolean;
    onClose(): void;
    onMove(entry: LibraryWork, label: string): void;
}) {
    const { t } = useTranslation('localTranslation');
    const { spacing } = useTheme();
    const [target, setTarget] = useState<LibraryWork | null>(null);
    const [label, setLabel] = useState('');
    useEffect(() => {
        if (!visible) return;
        setTarget(null);
        setLabel('');
    }, [visible]);
    const choose = (entry: LibraryWork) => {
        setTarget(entry);
        setLabel(String(entry.chapters.length + 1));
    };
    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            closeLabel={t('menu.close')}
            title={t('sheets.moveTitle')}
            description={works.length ? t('sheets.moveDescription') : undefined}
            footer={
                target ? (
                    <Button fullWidth disabled={busy || !label.trim()} onPress={() => onMove(target, label.trim())}>
                        {t('sheets.moveConfirm', { name: target.work.name })}
                    </Button>
                ) : undefined
            }
        >
            {works.length === 0 ? (
                <StateView kind="empty" inline title={t('sheets.moveEmpty')} />
            ) : (
                <View style={{ gap: spacing.xs }}>
                    {works.map(entry => (
                        <SelectRow
                            key={entry.work.id}
                            role="radio"
                            title={entry.work.name}
                            description={entry.chapters.length ? t('shelf.chapterCount', { count: entry.chapters.length }) : t('shelf.noChapters')}
                            selected={target?.work.id === entry.work.id}
                            onPress={() => choose(entry)}
                        />
                    ))}
                    {target ? <Input label={t('sheets.chapterName')} value={label} onChange={setLabel} maxLength={120} /> : null}
                </View>
            )}
        </BottomSheet>
    );
}

export function LinkChaptersSheet({
    visible,
    chapters,
    firstNumber,
    chapterTitle,
    busy = false,
    onClose,
    onLink,
}: {
    visible: boolean;
    chapters: readonly LibraryChapter[];
    firstNumber: number;
    chapterTitle(chapter: LibraryChapter): string;
    busy?: boolean;
    onClose(): void;
    onLink(items: { projectId: string; label: string }[]): void;
}) {
    const { t } = useTranslation('localTranslation');
    const { spacing } = useTheme();
    const [selected, setSelected] = useState<string[]>([]);
    const [labels, setLabels] = useState<Record<string, string>>({});
    useEffect(() => {
        if (!visible) return;
        setSelected([]);
        setLabels({});
    }, [visible]);
    const toggle = (projectId: string) => {
        const next = selected.includes(projectId) ? selected.filter(id => id !== projectId) : [...selected, projectId];
        setSelected(next);
        setLabels(current => {
            const updated: Record<string, string> = {};
            next.forEach((id, index) => {
                updated[id] = current[id] ?? String(firstNumber + index);
            });
            return updated;
        });
    };
    const items = selected.map(projectId => ({ projectId, label: (labels[projectId] ?? '').trim() }));
    const disabled = busy || items.length === 0 || items.some(item => !item.label);
    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            closeLabel={t('menu.close')}
            title={t('sheets.linkTitle')}
            description={chapters.length ? t('sheets.linkDescription') : undefined}
            footer={
                chapters.length ? (
                    <Button fullWidth disabled={disabled} onPress={() => onLink(items)}>
                        {t('sheets.linkAction', { count: Math.max(1, items.length) })}
                    </Button>
                ) : undefined
            }
        >
            {chapters.length === 0 ? (
                <StateView kind="empty" inline title={t('sheets.linkEmpty')} text={t('sheets.linkEmptyText')} />
            ) : (
                <View style={{ gap: spacing.xs }}>
                    {chapters.map(chapter => {
                        const title = chapterTitle(chapter);
                        const isSelected = selected.includes(chapter.projectId);
                        return (
                            <View key={chapter.projectId} style={{ gap: spacing.xs }}>
                                <SelectRow
                                    role="checkbox"
                                    title={title}
                                    accessibilityLabel={t('sheets.linkSelect', { name: title })}
                                    description={t('shelf.unassignedMeta', {
                                        source: chapter.sourceLanguage,
                                        target: chapter.targetLanguage,
                                        ready: chapter.readyPages,
                                        total: chapter.pages,
                                    })}
                                    selected={isSelected}
                                    onPress={() => toggle(chapter.projectId)}
                                />
                                {isSelected ? (
                                    <Input
                                        label={t('sheets.chapterName')}
                                        value={labels[chapter.projectId] ?? ''}
                                        onChange={value => setLabels(current => ({ ...current, [chapter.projectId]: value }))}
                                        maxLength={120}
                                    />
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            )}
        </BottomSheet>
    );
}
