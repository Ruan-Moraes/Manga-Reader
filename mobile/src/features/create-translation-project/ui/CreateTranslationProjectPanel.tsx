import { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isMediaValidationReady, type LocalMediaImportDraft } from '@/entities/local-media-import';
import type { TranslationProject } from '@/entities/translation-project';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/shared/media-inspection';
import { useTheme } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

import type { CreateTranslationProjectController } from '../model/createTranslationProject';
import { useCreateTranslationProject } from '../model/useCreateTranslationProject';

interface Props {
    draft: LocalMediaImportDraft | null;
    onDraftConsumed: () => void;
    controller?: CreateTranslationProjectController;
    onProjectChange?: (project: TranslationProject | null) => void;
}

export function CreateTranslationProjectPanel({ draft, onDraftConsumed, controller, onProjectChange }: Props) {
    const { t } = useTranslation('launcher');
    const { spacing, tokens } = useTheme();
    const actions = useCreateTranslationProject(controller);
    const ready = draft ? isMediaValidationReady(draft, MEDIA_VALIDATION_POLICY_VERSION) : false;

    useEffect(() => {
        onProjectChange?.(actions.project);
    }, [actions.project, onProjectChange]);
    if (!draft && !actions.project && !actions.loading && !actions.error) return null;

    return (
        <View testID="translation-project-panel" style={{ borderTopColor: tokens.separator, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.md }}>
            {actions.project && (
                <View accessibilityRole="summary" style={{ gap: spacing.xs }}>
                    <AppText variant="section">{t('offline.project.preparedTitle')}</AppText>
                    <AppText tone="success">{t('offline.project.preparedDescription')}</AppText>
                    <AppText variant="caption" tone="muted">
                        {t('offline.project.summary', {
                            count: actions.project.pages.length,
                            source: t(`offline.languages.options.${actions.project.sourceLanguage}`),
                            target: t(`offline.languages.options.${actions.project.targetLanguage}`),
                            status: t(`offline.project.status.${actions.project.status}`),
                        })}
                    </AppText>
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
                <Button
                    disabled={actions.busy || actions.loading}
                    loading={actions.busy}
                    onPress={() => {
                        void actions.prepare(draft).then(result => {
                            if (result) onDraftConsumed();
                        });
                    }}
                >
                    {t('offline.project.action')}
                </Button>
            )}
        </View>
    );
}
