import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { isMediaValidationReady, type LocalMediaImportDraft } from '@/entities/local-media-import';
import type { TranslationProject } from '@/entities/translation-project';
import { type CreateTranslationProjectController, CreateTranslationProjectPanel } from '@/features/create-translation-project';
import { ImportLocalMediaPanel, type LocalMediaImportController } from '@/features/import-local-media';
import { LocalMediaReviewPanel, type ReviewLocalMediaImportController } from '@/features/review-local-media-import';
import { type SelectTranslationLanguagesController, TranslationLanguageSelectionPanel } from '@/features/select-translation-languages';
import { LocalMediaValidationItemStatus, LocalMediaValidationPanel, type ValidateLocalMediaController } from '@/features/validate-local-media';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/shared/media-inspection';
import { ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppText, Card, IconButton, ProgressSteps, ScreenScaffold } from '@/shared/ui';
import { RemoteProcessingPanel } from '@/widgets/remote-processing';

import { availableTranslationFlowStep, TRANSLATION_FLOW_STEPS, type TranslationFlowStep, visibleTranslationFlowStep } from '../model/translationFlow';

interface Props {
    importController?: LocalMediaImportController;
    reviewController?: ReviewLocalMediaImportController;
    languageController?: SelectTranslationLanguagesController;
    validationController?: ValidateLocalMediaController;
    projectController?: CreateTranslationProjectController;
}

export function OfflineTranslationPage({ importController, reviewController, languageController, validationController, projectController }: Props) {
    const { t } = useTranslation('launcher');
    const { spacing } = useTheme();
    const [draft, setDraft] = useState<LocalMediaImportDraft | null>(null);
    const [requestedStep, setRequestedStep] = useState<TranslationFlowStep | null>(null);
    const [preparedProject, setPreparedProject] = useState<TranslationProject | null>(null);
    const handleDraftChange = useCallback((nextDraft: LocalMediaImportDraft | null) => setDraft(nextDraft), []);
    const handleValidationDraftChange = useCallback((nextDraft: LocalMediaImportDraft) => {
        setDraft(nextDraft);
        if (isMediaValidationReady(nextDraft, MEDIA_VALIDATION_POLICY_VERSION)) setRequestedStep('validate');
    }, []);
    const availableStep = availableTranslationFlowStep(draft);
    const currentStep = visibleTranslationFlowStep(availableStep, requestedStep);
    const currentIndex = TRANSLATION_FLOW_STEPS.indexOf(currentStep);
    const steps = useMemo(() => TRANSLATION_FLOW_STEPS.map(id => ({ id, label: t(`offline.flow.steps.${id}`) })), [t]);

    useEffect(() => {
        setRequestedStep(requested => (availableStep === 'review' && requested === 'validate' ? requested : null));
    }, [availableStep]);

    const goBack = () => {
        if (currentIndex > 0) {
            setRequestedStep(TRANSLATION_FLOW_STEPS[currentIndex - 1]);
            return;
        }
        router.replace(ROUTES.ROOT as never);
    };

    const stage = (() => {
        const intro = (step: TranslationFlowStep, title?: string) => (
            <View style={{ gap: spacing.sm }}>
                <AppText variant="eyebrow" tone="accent">
                    {t(`offline.flow.intro.${step}.eyebrow`)}
                </AppText>
                <AppText accessibilityRole="header" variant="display">
                    {title ?? t(`offline.flow.intro.${step}.title`)}
                </AppText>
                <AppText tone="muted">{t(`offline.flow.intro.${step}.description`)}</AppText>
            </View>
        );
        if (currentStep === 'import') {
            return (
                <View style={{ gap: spacing.md }}>
                    {intro('import')}
                    {!draft ? (
                        <>
                            <CreateTranslationProjectPanel
                                key="latest-project"
                                draft={null}
                                onDraftConsumed={() => setDraft(null)}
                                controller={projectController}
                                onProjectChange={setPreparedProject}
                            />
                            {preparedProject ? <RemoteProcessingPanel /> : null}
                        </>
                    ) : null}
                    <ImportLocalMediaPanel
                        controller={importController}
                        draft={draft}
                        onDraftChange={handleDraftChange}
                        onContinue={() => {
                            if (draft && draft.items.length > 0) setRequestedStep('organize');
                        }}
                    />
                </View>
            );
        }
        if (!draft) return null;
        if (currentStep === 'organize') {
            return (
                <View style={{ flex: 1, gap: spacing.md, minHeight: 0 }}>
                    {intro('organize')}
                    <LocalMediaReviewPanel
                        draft={draft}
                        onDraftChange={handleDraftChange}
                        controller={reviewController}
                        renderItemMeta={item => <LocalMediaValidationItemStatus item={item} />}
                    />
                </View>
            );
        }
        if (currentStep === 'languages') {
            return (
                <View style={{ gap: spacing.md }}>
                    {intro('languages')}
                    <TranslationLanguageSelectionPanel draft={draft} onDraftChange={handleDraftChange} controller={languageController} />
                </View>
            );
        }
        if (currentStep === 'validate') {
            const invalid = draft.items.filter(item => item.mediaValidationStatus === 'INVALID').length;
            const ready = isMediaValidationReady(draft, MEDIA_VALIDATION_POLICY_VERSION);
            const title = ready
                ? t('offline.flow.intro.validate.readyTitle')
                : invalid > 0
                  ? t('offline.flow.intro.validate.issueTitle', { count: invalid })
                  : t('offline.flow.intro.validate.pendingTitle');
            return (
                <View style={{ flex: 1, gap: spacing.md, minHeight: 0 }}>
                    {intro('validate', title)}
                    <LocalMediaValidationPanel
                        draft={draft}
                        onDraftChange={handleValidationDraftChange}
                        onContinue={() => setRequestedStep('review')}
                        controller={validationController}
                    />
                </View>
            );
        }
        return (
            <View style={{ gap: spacing.md }}>
                {intro('review')}
                <Card variant="elevated" style={{ gap: spacing.md }}>
                    <View style={{ gap: spacing.xs }}>
                        <AppText accessibilityRole="header" variant="title">
                            {t('offline.flow.reviewTitle')}
                        </AppText>
                        <AppText tone="muted">{t('offline.flow.reviewDescription')}</AppText>
                    </View>
                    <View style={{ gap: spacing.sm }}>
                        <AppText variant="label">
                            {t('offline.flow.pages')}: {draft.items.length}
                        </AppText>
                        <AppText variant="label">
                            {t('offline.flow.languagePair')}: {t(`offline.languages.options.${draft.sourceLanguage}`)} →{' '}
                            {t(`offline.languages.options.${draft.targetLanguage}`)}
                        </AppText>
                        <AppText variant="label" tone="success">
                            {t('offline.flow.validation')}: {t('offline.flow.validationReady')}
                        </AppText>
                    </View>
                </Card>
                <CreateTranslationProjectPanel
                    key="prepare-project"
                    draft={draft}
                    onDraftConsumed={() => setDraft(null)}
                    controller={projectController}
                    onProjectChange={setPreparedProject}
                />
            </View>
        );
    })();

    return (
        <ScreenScaffold
            compact
            scroll={currentStep !== 'organize' && currentStep !== 'validate'}
            title={t('offline.pageTitle')}
            backLabel={currentIndex > 0 ? t('offline.flow.back') : t('navigation.selector')}
            onBack={goBack}
            headerAction={
                currentIndex > 0 ? (
                    <IconButton accessibilityLabel={t('navigation.selector')} icon="close" onPress={() => router.replace(ROUTES.ROOT as never)} />
                ) : undefined
            }
        >
            <ProgressSteps steps={steps} currentIndex={currentIndex} accessibilityLabel={t('offline.flow.label')} />
            <View testID={`translation-flow-step-${currentStep}`} style={{ flex: 1, minHeight: 0 }}>
                {stage}
            </View>
        </ScreenScaffold>
    );
}
