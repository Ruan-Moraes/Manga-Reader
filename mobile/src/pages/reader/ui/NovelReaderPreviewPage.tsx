import { useMemo, useState } from 'react';
import { Image } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ReaderGestureControls } from '@/features/configure-chapter-reader';
import { TextReaderControls } from '@/features/configure-text-reader';
import { useSettingsStore } from '@/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { ContentReader, type ReaderLocation } from '@/widgets/content-reader';

import { createNovelPreviewDocument, isNovelPreviewEnabled } from '../model/novelPreview';

function DevelopmentNovelReaderPreview() {
    const { t } = useTranslation('reader');
    const textReader = useSettingsStore(state => state.textReader);
    const updateTextReader = useSettingsStore(state => state.updateTextReader);
    const resetTextReader = useSettingsStore(state => state.resetTextReader);
    const readerGestures = useSettingsStore(state => state.readerGestures);
    const updateReaderGestures = useSettingsStore(state => state.updateReaderGestures);
    const localError = useSettingsStore(state => state.localError);
    const retryPersistence = useSettingsStore(state => state.retryReaderGesturesPersistence);
    const [location, setLocation] = useState<ReaderLocation>({ itemId: 'heading-1', index: 0 });
    const document = useMemo(
        () =>
            createNovelPreviewDocument({
                illustration: {
                    ...Image.resolveAssetSource(require('../../../../assets/images/launcher-hero.png')),
                    description: t('novelPreview.illustration'),
                },
                title: t('novelPreview.title'),
                heading: t('novelPreview.heading'),
                paragraphOne: t('novelPreview.paragraphOne'),
                speaker: t('novelPreview.speaker'),
                dialogue: t('novelPreview.dialogue'),
                paragraphTwo: t('novelPreview.paragraphTwo'),
            }),
        [t],
    );

    return (
        <ContentReader
            document={document}
            location={location}
            gesturePreferences={readerGestures}
            textPreferences={textReader}
            controlsContent={
                <>
                    <TextReaderControls
                        value={textReader}
                        onChange={patch => void updateTextReader(patch)}
                        onReset={() => void resetTextReader()}
                        persistenceError={!!localError}
                        onRetry={() => void retryPersistence()}
                    />
                    <ReaderGestureControls
                        value={readerGestures}
                        onChange={patch => void updateReaderGestures(patch)}
                        sideNavigationAvailable={false}
                        persistenceError={!!localError}
                        onRetry={() => void retryPersistence()}
                    />
                </>
            }
            onExit={() => navigateBackOrReplace(ROUTES.ROOT)}
            onLocationChange={setLocation}
        />
    );
}

export function NovelReaderPreviewPage() {
    if (!isNovelPreviewEnabled(__DEV__)) return <Redirect href={ROUTES.ROOT} />;
    return <DevelopmentNovelReaderPreview />;
}
