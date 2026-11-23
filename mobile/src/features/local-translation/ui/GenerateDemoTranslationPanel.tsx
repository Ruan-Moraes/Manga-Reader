import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { TranslationProject } from '@/entities/translation-project';
import { useTheme } from '@/shared/theme';
import { Button, Card, ProgressSteps, StatusMessage } from '@/shared/ui';

import {
    DEMO_PROCESSING_STAGES,
    type DemoProcessingStage,
    GenerateDemoResultError,
    type GenerateDemoTranslationResultController,
    generateDemoTranslationResultController,
} from '../model/generateDemoTranslationResult';

interface Props {
    project: TranslationProject;
    onGenerated(project: TranslationProject): void;
    controller?: GenerateDemoTranslationResultController;
}

export function GenerateDemoTranslationPanel({ project, onGenerated, controller = generateDemoTranslationResultController }: Props) {
    const { t } = useTranslation('localTranslation');
    const { spacing } = useTheme();
    const [stage, setStage] = useState<DemoProcessingStage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const busy = stage !== null;
    const steps = DEMO_PROCESSING_STAGES.map(id => ({ id, label: t(`demo.stages.${id}`) }));

    const generate = async () => {
        setError(null);
        try {
            const result = await controller.generate(project.id, setStage);
            onGenerated(result);
        } catch (cause) {
            const code = cause instanceof GenerateDemoResultError ? cause.code : 'storage-unavailable';
            setError(t(`demo.errors.${code}`));
        } finally {
            setStage(null);
        }
    };

    return (
        <Card variant="elevated" style={{ gap: spacing.md }}>
            <StatusMessage title={t('demo.title')} description={t('demo.description')} tone="warning" />
            {stage ? <ProgressSteps steps={steps} currentIndex={DEMO_PROCESSING_STAGES.indexOf(stage)} accessibilityLabel={t('demo.progress')} /> : null}
            {error ? <StatusMessage title={t('demo.errorTitle')} description={error} tone="danger" /> : null}
            <View>
                <Button disabled={busy} loading={busy} onPress={() => void generate()}>
                    {t('demo.action')}
                </Button>
            </View>
        </Card>
    );
}
