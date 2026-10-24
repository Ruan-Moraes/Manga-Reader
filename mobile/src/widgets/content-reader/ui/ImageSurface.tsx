import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { lightTokens, useTheme } from '@/shared/theme';
import { StatusMessage } from '@/shared/ui';

import { type ImageReaderItem, overlayBox } from '../model/contentReader';

export type Integrity = 'checking' | 'valid' | 'invalid';

function DemoOverlays({ item }: { item: ImageReaderItem }) {
    const { spacing, typography } = useTheme();
    return item.demoOverlays?.map(region => {
        const box = overlayBox(region.vertices);
        if (!box) return null;
        return (
            <View
                key={region.id}
                testID={`reader-demo-overlay-${region.id}`}
                style={{
                    position: 'absolute',
                    left: `${box.left * 100}%`,
                    top: `${box.top * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: spacing.xs,
                    backgroundColor: lightTokens.surface,
                }}
            >
                <Text
                    allowFontScaling
                    numberOfLines={4}
                    adjustsFontSizeToFit
                    minimumFontScale={0.55}
                    style={{ color: lightTokens.text, fontSize: typography.small, textAlign: 'center' }}
                >
                    {region.translatedText}
                </Text>
            </View>
        );
    });
}

interface ImageSurfaceProps {
    item: ImageReaderItem;
    height: number;
    width: number;
    showOriginal: boolean;
    showDemoOverlay: boolean;
    integrity: Integrity;
    saturation: number;
    onRetry(): void;
}

export function ImageSurface({ item, height, width, showOriginal, showDemoOverlay, integrity, saturation, onRetry }: ImageSurfaceProps) {
    const uri = showOriginal && item.originalUri ? item.originalUri : item.primaryUri;
    // Variant identity owns decode failures; switching variants cannot poison the other image.
    return <ImageVariant key={uri} {...{ item, height, width, showOriginal, showDemoOverlay, integrity, saturation, onRetry, uri }} />;
}

function ImageVariant({ item, height, width, showOriginal, showDemoOverlay, integrity, saturation, onRetry, uri }: ImageSurfaceProps & { uri: string }) {
    const { t } = useTranslation('reader');
    const { tokens, spacing } = useTheme();
    const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [attempt, setAttempt] = useState(0);
    const failed = state === 'error' || (!showOriginal && integrity === 'invalid');
    const scale = Math.min(width / item.width, height / item.height);
    const imageWidth = Number.isFinite(scale) && scale > 0 ? item.width * scale : width;
    const imageHeight = Number.isFinite(scale) && scale > 0 ? item.height * scale : height;
    return (
        <View testID={`reader-page-${item.id}`} style={{ height, width, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {failed ? (
                <View
                    testID={`reader-page-error-${item.id}`}
                    onTouchStart={event => event.stopPropagation()}
                    onTouchEnd={event => event.stopPropagation()}
                    className="w-full flex-1 items-center justify-center"
                    style={{ padding: spacing.md, backgroundColor: tokens.surface }}
                >
                    <StatusMessage
                        title={t('errors.image')}
                        actionLabel={t('actions.retry')}
                        tone="danger"
                        onAction={() => {
                            setState('loading');
                            setAttempt(value => value + 1);
                            onRetry();
                        }}
                    />
                </View>
            ) : (
                <View style={{ height: imageHeight, width: imageWidth }}>
                    <View style={{ filter: [{ saturate: saturation / 100 }] }}>
                        <Image
                            key={attempt}
                            source={{ uri }}
                            contentFit="contain"
                            accessibilityLabel={t(showOriginal ? 'viewport.originalPage' : 'viewport.resultPage')}
                            onLoad={() => setState('ready')}
                            onError={() => setState('error')}
                            style={{ height: imageHeight, width: imageWidth }}
                        />
                    </View>
                    {state === 'loading' ? (
                        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
                            <ActivityIndicator color={tokens.accentText} />
                        </View>
                    ) : null}
                    {!showOriginal && showDemoOverlay ? <DemoOverlays item={item} /> : null}
                </View>
            )}
        </View>
    );
}
