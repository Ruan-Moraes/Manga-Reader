import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { LocalMediaImportDraft } from '@/src/entities/local-media-import';
import { type CreateTranslationProjectController, CreateTranslationProjectPanel } from '@/src/features/create-translation-project';
import { ImportLocalMediaPanel, type LocalMediaImportController } from '@/src/features/import-local-media';
import { LocalMediaReviewPanel, type ReviewLocalMediaImportController } from '@/src/features/review-local-media-import';
import { type SelectTranslationLanguagesController, TranslationLanguageSelectionPanel } from '@/src/features/select-translation-languages';
import { LocalMediaValidationItemStatus, LocalMediaValidationPanel, type ValidateLocalMediaController } from '@/src/features/validate-local-media';
import { ROUTES } from '@/src/shared/navigation';
import { useTheme } from '@/src/shared/theme';
import { Button, ScreenScaffold } from '@/src/shared/ui';

interface Props {
    importController?: LocalMediaImportController;
    reviewController?: ReviewLocalMediaImportController;
    languageController?: SelectTranslationLanguagesController;
    validationController?: ValidateLocalMediaController;
    projectController?: CreateTranslationProjectController;
}

export function OfflineTranslationPage({ importController, reviewController, languageController, validationController, projectController }: Props) {
    const { t } = useTranslation('launcher');
    const { tokens } = useTheme();
    const [draft, setDraft] = useState<LocalMediaImportDraft | null>(null);
    const handleDraftChange = useCallback((nextDraft: LocalMediaImportDraft | null) => setDraft(nextDraft), []);

    return (
        <ScreenScaffold
            compact
            scroll={false}
            title={t('offline.pageTitle')}
            backLabel={t('navigation.selector')}
            onBack={() => router.replace(ROUTES.ROOT as never)}
            headerAction={
                <Button
                    size="compact"
                    fullWidth={false}
                    variant="ghost"
                    onPress={() => router.push(ROUTES.SETTINGS.INDEX as never)}
                    accessibilityLabel={t('selector.settings')}
                    leading={<Ionicons name="settings-outline" size={18} color={tokens.accentText} accessibilityElementsHidden />}
                >
                    {t('selector.settings')}
                </Button>
            }
        >
            <ImportLocalMediaPanel controller={importController} draft={draft} onDraftChange={handleDraftChange} />
            {draft && (
                <LocalMediaReviewPanel
                    draft={draft}
                    onDraftChange={handleDraftChange}
                    controller={reviewController}
                    renderItemMeta={item => <LocalMediaValidationItemStatus item={item} />}
                    afterReview={
                        draft.confirmedAt ? (
                            <>
                                <TranslationLanguageSelectionPanel draft={draft} onDraftChange={handleDraftChange} controller={languageController} />
                                {draft.languagesConfirmedAt && (
                                    <>
                                        <LocalMediaValidationPanel draft={draft} onDraftChange={handleDraftChange} controller={validationController} />
                                        <CreateTranslationProjectPanel draft={draft} onDraftConsumed={() => setDraft(null)} controller={projectController} />
                                    </>
                                )}
                            </>
                        ) : null
                    }
                />
            )}
            {!draft && <CreateTranslationProjectPanel draft={null} onDraftConsumed={() => setDraft(null)} controller={projectController} />}
        </ScreenScaffold>
    );
}
