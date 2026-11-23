import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'react-native-reanimated';

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

/** Reader pages: local files in memory only; remote (platform) pages also on disk. */
export function readerCachePolicy(uri: string): 'memory' | 'memory-disk' {
    return /^https?:\/\//i.test(uri) ? 'memory-disk' : 'memory';
}

/** Duration of the fade that brings a page's translation in over its original (MOB-FEAT-024). */
export const TRANSLATION_FADE_MS = 300;

export function ImageSurface({ item, height, width, showOriginal, showDemoOverlay, integrity, saturation, onRetry }: ImageSurfaceProps) {
    const uri = showOriginal && item.originalUri ? item.originalUri : item.primaryUri;
    // When the translation replaces the original being read, the original stays underneath while the translation
    // fades in over it. Decided while rendering, so the first frame of the translation never shows an empty page.
    const previous = useRef({ uri, pending: !!item.pending });
    const [underlay, setUnderlay] = useState<string | null>(null);
    if (previous.current.uri !== uri) {
        const replacing = previous.current.pending && !item.pending && !showOriginal;
        previous.current = { uri, pending: !!item.pending };
        if (replacing !== (underlay !== null)) setUnderlay(replacing ? previousUri(item) : null);
    } else if (previous.current.pending !== !!item.pending) {
        previous.current = { uri, pending: !!item.pending };
    }
    // Variant identity owns decode failures; switching variants cannot poison the other image.
    return (
        <View style={{ height, width }}>
            {underlay ? (
                <View
                    testID={`reader-underlay-${item.id}`}
                    pointerEvents="none"
                    style={{ position: 'absolute', height, width, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Image source={{ uri: underlay }} contentFit="contain" style={{ height, width }} />
                </View>
            ) : null}
            <ImageVariant
                key={uri}
                {...{ item, height, width, showOriginal, showDemoOverlay, integrity, saturation, onRetry, uri }}
                fadeIn={underlay !== null}
                onFaded={() => setUnderlay(null)}
            />
        </View>
    );
}

/** The original a page showed while it was being translated. */
function previousUri(item: ImageReaderItem): string | null {
    return item.originalUri ?? null;
}

function ImageVariant({
    item,
    height,
    width,
    showOriginal,
    showDemoOverlay,
    integrity,
    saturation,
    onRetry,
    uri,
    fadeIn,
    onFaded,
}: ImageSurfaceProps & { uri: string; fadeIn: boolean; onFaded(): void }) {
    const reducedMotion = useReducedMotion();
    const opacity = useRef(new Animated.Value(fadeIn ? 0 : 1)).current;
    const reveal = () => {
        if (!fadeIn) return;
        if (reducedMotion) {
            opacity.setValue(1);
            onFaded();
            return;
        }
        Animated.timing(opacity, { toValue: 1, duration: TRANSLATION_FADE_MS, useNativeDriver: true }).start(() => onFaded());
    };
    useEffect(() => () => opacity.stopAnimation(), [opacity]);
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
                <Animated.View testID={`reader-image-${item.id}`} style={{ height: imageHeight, width: imageWidth, opacity }}>
                    {/* The filter layer costs GPU work per page: only add it when saturation actually changes (revisão 2026-11-13). */}
                    <View style={saturation === 100 ? undefined : { filter: [{ saturate: saturation / 100 }] }}>
                        <Image
                            key={attempt}
                            source={{ uri }}
                            // Local files already on the device stay out of the disk cache; server pages keep it so a chapter
                            // reopened later does not download again (revisão 2026-11-13).
                            cachePolicy={readerCachePolicy(uri)}
                            contentFit="contain"
                            accessibilityLabel={t(showOriginal || uri === item.originalUri ? 'viewport.originalPage' : 'viewport.resultPage')}
                            onLoad={() => {
                                setState('ready');
                                reveal();
                            }}
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
                </Animated.View>
            )}
        </View>
    );
}
