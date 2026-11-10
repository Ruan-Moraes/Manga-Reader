import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { LocalWork } from '@/entities/local-work';
import type { ManageLocalWorksController } from '@/features/manage-local-works';
import { useTheme } from '@/shared/theme';
import { AppText, BottomSheet, Button, Icon, Input, PressableBox as Pressable } from '@/shared/ui';

export interface ChapterDestination {
    workId: string;
    workName: string;
    label: string;
}

interface Props {
    destination: ChapterDestination | null;
    /** Chapter name shown as the card title (kit): the chosen label or the derived "Capítulo de <data>". */
    chapterTitle: string;
    languages: string;
    locked: boolean;
    controller: Pick<ManageLocalWorksController, 'initialize' | 'listChapters'>;
    onChange(destination: ChapterDestination | null): void;
}

/** "Salvar em" card (056/AC-012): chooses the 055 work that receives the chapter before translating. */
export function SaveDestination({ destination, chapterTitle, languages, locked, controller, onChange }: Props) {
    const { t } = useTranslation('launcher');
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [open, setOpen] = useState(false);
    const [works, setWorks] = useState<LocalWork[]>([]);
    const [choice, setChoice] = useState<string | null>(destination?.workId ?? null);
    const [label, setLabel] = useState(destination?.label ?? '');

    useEffect(() => {
        if (!open) return;
        setChoice(destination?.workId ?? null);
        setLabel(destination?.label ?? '');
        void controller
            .initialize()
            .then(setWorks)
            .catch(() => setWorks([]));
    }, [controller, destination, open]);

    const choose = async (work: LocalWork | null) => {
        setChoice(work?.id ?? null);
        if (!work) return;
        const chapters = await controller.listChapters(work.id).catch(() => []);
        setLabel(String(chapters.length + 1));
    };
    const chosen = works.find(work => work.id === choice) ?? null;
    const row = (key: string, title: string, selected: boolean, onPress: () => void) => (
        <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityLabel={title}
            accessibilityState={{ checked: selected }}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? tokens.surfacePressed : selected ? tokens.surfaceSelected : 'transparent',
                borderRadius: radii.control,
                flexDirection: 'row',
                gap: spacing.md,
                minHeight: Math.max(minimumTouchTarget, metrics.row.single),
                paddingHorizontal: spacing.sm,
            })}
        >
            <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={metrics.icon.lg} color={selected ? tokens.accentText : tokens.muted} />
            <AppText variant="label" style={{ flex: 1 }} numberOfLines={2}>
                {title}
            </AppText>
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
                    minHeight: 72,
                    paddingRight: spacing.md,
                    opacity: locked ? 0.6 : 1,
                    padding: spacing.md,
                })}
            >
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
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <AppText variant="label" numberOfLines={1}>
                        {destination?.label ?? chapterTitle}
                    </AppText>
                    <AppText variant="caption" tone="subtle" numberOfLines={1}>
                        {`${t('offline.flow3.saveIn', { name: destination?.workName ?? t('offline.flow3.noWork') })} · ${languages}`}
                    </AppText>
                </View>
                {!locked ? (
                    <AppText variant="button" tone="accent">
                        {t('offline.flow3.change')}
                    </AppText>
                ) : null}
            </Pressable>
            <BottomSheet
                visible={open}
                onClose={() => setOpen(false)}
                closeLabel={t('offline.flow3.close')}
                title={t('offline.flow3.saveTitle')}
                description={t('offline.flow3.saveDescription')}
                footer={
                    <Button
                        fullWidth
                        disabled={!!chosen && !label.trim()}
                        onPress={() => {
                            onChange(chosen ? { workId: chosen.id, workName: chosen.name, label: label.trim() } : null);
                            setOpen(false);
                        }}
                    >
                        {t('offline.flow3.saveConfirm')}
                    </Button>
                }
            >
                <View style={{ gap: spacing.xs }}>
                    {row('none', t('offline.flow3.noWork'), choice === null, () => void choose(null))}
                    {works.map(work => row(work.id, work.name, choice === work.id, () => void choose(work)))}
                    {chosen ? <Input label={t('offline.flow3.chapterName')} value={label} onChange={setLabel} maxLength={120} /> : null}
                </View>
            </BottomSheet>
        </>
    );
}
