import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { LocalMediaImportDraft } from '@/src/entities/local-media-import';
import { type CreateTranslationProjectController, CreateTranslationProjectPanel } from '@/src/features/create-translation-project';
import { ImportLocalMediaPanel, type LocalMediaImportController } from '@/src/features/import-local-media';
import { LocalMediaReviewPanel, type ReviewLocalMediaImportController } from '@/src/features/review-local-media-import';
import { type SelectTranslationLanguagesController, TranslationLanguageSelectionPanel } from '@/src/features/select-translation-languages';
import { LocalMediaValidationItemStatus, LocalMediaValidationPanel, type ValidateLocalMediaController } from '@/src/features/validate-local-media';
import { ROUTES } from '@/src/shared/navigation';
import { useTheme } from '@/src/shared/theme';
import { AppText, Card, IconButton, ProgressSteps, ScreenScaffold } from '@/src/shared/ui';

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
    const handleDraftChange = useCallback((nextDraft: LocalMediaImportDraft | null) => setDraft(nextDraft), []);
    const availableStep = availableTranslationFlowStep(draft);
    const currentStep = visibleTranslationFlowStep(availableStep, requestedStep);
    const currentIndex = TRANSLATION_FLOW_STEPS.indexOf(currentStep);
    const steps = useMemo(() => TRANSLATION_FLOW_STEPS.map(id => ({ id, label: t(`offline.flow.steps.${id}`) })), [t]);

    useEffect(() => setRequestedStep(null), [availableStep]);

    const goBack = () => {
        if (currentIndex > 0) {
            setRequestedStep(TRANSLATION_FLOW_STEPS[currentIndex - 1]);
            return;
        }
        router.replace(ROUTES.ROOT as never);
    };

    const stage = (() => {
        const intro = (step: TranslationFlowStep) => (
            <View style={{ gap: spacing.sm }}>
                <AppText variant="eyebrow" tone="accent">
                    {t(`offline.flow.intro.${step}.eyebrow`)}
                </AppText>
                <AppText accessibilityRole="header" variant="display">
                    {t(`offline.flow.intro.${step}.title`)}
                </AppText>
                <AppText tone="muted">{t(`offline.flow.intro.${step}.description`)}</AppText>
            </View>
        );
        if (currentStep === 'import') {
            return (
                <View style={{ gap: spacing.md }}>
                    {intro('import')}
                    {!draft ? (
                        <CreateTranslationProjectPanel
                            key="latest-project"
                            draft={null}
                            onDraftConsumed={() => setDraft(null)}
                            controller={projectController}
                        />
                    ) : null}
                    <ImportLocalMediaPanel controller={importController} draft={draft} onDraftChange={handleDraftChange} />
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
            return (
                <View style={{ gap: spacing.md }}>
                    {intro('validate')}
                    <Card style={{ gap: spacing.sm }}>
                        {draft.items.map(item => (
                            <View key={item.id} style={{ gap: spacing.xs }}>
                                <AppText variant="label">{t('offline.review.page', { page: item.position + 1, total: draft.items.length })}</AppText>
                                <LocalMediaValidationItemStatus item={item} />
                            </View>
                        ))}
                    </Card>
                    <LocalMediaValidationPanel draft={draft} onDraftChange={handleDraftChange} controller={validationController} />
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
                <CreateTranslationProjectPanel key="prepare-project" draft={draft} onDraftConsumed={() => setDraft(null)} controller={projectController} />
            </View>
        );
    })();

    return (
        <ScreenScaffold
            compact
            scroll={currentStep !== 'organize'}
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
