import { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isMediaValidationReady, type LocalMediaImportDraft } from '@/entities/local-media-import';
import type { TranslationProject } from '@/entities/translation-project';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/shared/media-inspection';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Icon, PrimaryAction } from '@/shared/ui';

import type { CreateTranslationProjectController } from '../model/createTranslationProject';
import { useCreateTranslationProject } from '../model/useCreateTranslationProject';

interface Props {
    draft: LocalMediaImportDraft | null;
    /** Receives the prepared project so the page can show it in the same render that drops the draft. */
    onDraftConsumed: (project: TranslationProject) => void;
    controller?: CreateTranslationProjectController;
    onProjectChange?: (project: TranslationProject | null) => void;
    /** Label of the prepare action, e.g. "Preparar e traduzir" when the batch starts right after (056). */
    actionLabel?: string;
    /** Drops the top separator when the panel only feeds the fixed footer (056). */
    bare?: boolean;
}

export function CreateTranslationProjectPanel({ draft, onDraftConsumed, controller, onProjectChange, actionLabel, bare = false }: Props) {
    const { t } = useTranslation('launcher');
    const { metrics, radii, spacing, tokens } = useTheme();
    const actions = useCreateTranslationProject(controller);
    const ready = draft ? isMediaValidationReady(draft, MEDIA_VALIDATION_POLICY_VERSION) : false;

    useEffect(() => {
        onProjectChange?.(actions.project);
    }, [actions.project, onProjectChange]);
    if (!draft && !actions.project && !actions.loading && !actions.error) return null;

    return (
        <View
            testID="translation-project-panel"
            style={bare ? { gap: spacing.md } : { borderTopColor: tokens.separator, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.md }}
        >
            {actions.project && (
                <View
                    testID="translation-project-prepared"
                    accessibilityRole="summary"
                    style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.separator,
                        borderRadius: radii.card,
                        borderWidth: 1,
                        overflow: 'hidden',
                    }}
                >
                    <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
                        <View
                            style={{
                                alignItems: 'center',
                                backgroundColor: tokens.successSoft,
                                borderRadius: radii.pill,
                                height: metrics.iconTile.default,
                                justifyContent: 'center',
                                width: metrics.iconTile.default,
                            }}
                        >
                            <Icon name="shield-checkmark" size={metrics.icon.md} color={tokens.success} decorative />
                        </View>
                        <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                            <AppText variant="label">{t('offline.project.preparedTitle')}</AppText>
                            <AppText variant="caption" tone="muted">
                                {t(actions.project.status === 'DRAFT' ? 'offline.project.preparedDescription' : 'offline.project.preparedRetainedDescription')}
                            </AppText>
                        </View>
                    </View>
                    <View
                        style={{
                            alignItems: 'center',
                            backgroundColor: tokens.surfaceMuted,
                            borderTopColor: tokens.separator,
                            borderTopWidth: 1,
                            flexDirection: 'row',
                            gap: spacing.sm,
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm,
                        }}
                    >
                        <Icon name="language-outline" size={metrics.icon.sm} color={tokens.muted} decorative />
                        <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
                            {t('offline.project.summary', {
                                count: actions.project.pages.length,
                                source: t(`offline.languages.options.${actions.project.sourceLanguage}`),
                                target: t(`offline.languages.options.${actions.project.targetLanguage}`),
                                status: t(`offline.project.status.${actions.project.status}`),
                            })}
                        </AppText>
                    </View>
                </View>
            )}
            {actions.loading && (
                <AppText accessibilityLiveRegion="polite" tone="muted">
                    {t('offline.project.loading')}
                </AppText>
            )}
            {actions.error && (
                <AppText accessibilityRole="alert" tone="danger">
                    {t(`offline.project.errors.${actions.error}`)}
                </AppText>
            )}
            {draft && ready && (
                <PrimaryAction>
                    <Button
                        disabled={actions.busy || actions.loading}
                        loading={actions.busy}
                        onPress={() => {
                            void actions.prepare(draft).then(result => {
                                if (result) onDraftConsumed(result);
                            });
                        }}
                    >
                        {actionLabel ?? t('offline.project.action')}
                    </Button>
                </PrimaryAction>
            )}
        </View>
    );
}
