import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StatusBar, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    DEFAULT_READER_GESTURES,
    DEFAULT_TEXT_READER_PREFERENCES,
    type ReaderGesturePreferences,
    type ReaderSettings,
    type TextReaderPreferences,
} from '@/entities/user-setting';
import { ThemePaletteProvider, useTheme } from '@/shared/theme';
import { AppText, Button, IconButton } from '@/shared/ui';

import { effectiveImageMode, type ReaderDocument, type ReaderLocation, restoreLocationById } from '../model/contentReader';
import { textReaderPalette } from '../model/textReader';
import { useReaderInteraction } from '../model/useReaderInteraction';
import { ImageViewport } from './ImageViewport';
import { type ReaderControlSection, ReaderPanel } from './ReaderPanel';
import { ReaderRevealGesture } from './ReaderRevealGesture';
import { TextViewport } from './TextViewport';

const CONTROLS_ANIMATION_MS = 160;

const ignoreLocation = () => undefined;

export interface ContentReaderProps {
    document: ReaderDocument;
    location?: ReaderLocation;
    settings?: ReaderSettings;
    textPreferences?: TextReaderPreferences;
    gesturePreferences?: ReaderGesturePreferences;
    controlsContent?: ReactNode;
    controlSections?: readonly ReaderControlSection[];
    statusContent?: ReactNode;
    onExit(): void;
    onLocationChange?(location: ReaderLocation): void;
    onValidateItem?(itemId: string): Promise<boolean>;
}

export function ContentReader(props: ContentReaderProps) {
    const theme = useTheme();

    const background = props.textPreferences?.background ?? 'APP';

    const palette = useMemo(
        () => textReaderPalette(background, theme.tokens, theme.colorScheme, theme.effectiveHighContrast),
        [background, theme.tokens, theme.colorScheme, theme.effectiveHighContrast],
    );

    if (props.document.kind === 'IMAGE_SEQUENCE') return <ReaderSession key={props.document.id} {...props} />;

    return (
        <ThemePaletteProvider tokens={palette.tokens} colorScheme={palette.colorScheme}>
            <ReaderSession key={props.document.id} {...props} />
        </ThemePaletteProvider>
    );
}

function ReaderSession({
    document,
    location,
    settings,
    gesturePreferences = DEFAULT_READER_GESTURES,
    textPreferences = DEFAULT_TEXT_READER_PREFERENCES,
    controlsContent,
    controlSections,
    statusContent,
    onExit,
    onLocationChange,
    onValidateItem,
}: ContentReaderProps) {
    const { t } = useTranslation('reader');

    const { colorScheme, spacing, tokens, minimumTouchTarget, decorativeMotionEnabled } = useTheme();

    const insets = useSafeAreaInsets();

    const [textPercent, setTextPercent] = useState(0);

    const [showOriginal, setShowOriginal] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showOverflow, setShowOverflow] = useState(false);
    const [screenReader, setScreenReader] = useState(false);

    const imageDocument = document.kind === 'IMAGE_SEQUENCE' ? document : null;

    const ids = useMemo(() => (document.kind === 'IMAGE_SEQUENCE' ? document.items.map(item => item.id) : document.blocks.map(block => block.id)), [document]);

    const current = useMemo(() => restoreLocationById(ids, location ?? document.initialLocation), [ids, location, document.initialLocation]);

    const hasOriginal = !!imageDocument?.items.length && imageDocument.items.every(item => !!item.originalUri);

    const overflow = useMemo(() => imageDocument?.items.flatMap(item => item.demoOverlays?.filter(region => region.overflow) ?? []) ?? [], [imageDocument]);

    const paged = !!imageDocument && !!settings && effectiveImageMode(settings) !== 'VERTICAL';

    const step = paged && settings?.mode === 'DOUBLE' ? 2 : 1;

    const groupIndex = Math.floor(current.index / step);
    const lastGroup = Math.ceil(ids.length / step) - 1;

    const navigate = (direction: 'next' | 'previous') => {
        const nextGroup = Math.min(lastGroup, Math.max(0, groupIndex + (direction === 'next' ? 1 : -1)));

        if (nextGroup !== groupIndex) onLocationChange?.({ itemId: ids[nextGroup * step], index: nextGroup * step });
    };

    const interaction = useReaderInteraction(gesturePreferences, paged, settings?.direction === 'RTL', navigate);

    const controlsVisible = interaction.state.visible;

    const progress = useRef(new Animated.Value(controlsVisible ? 1 : 0)).current;

    const surfaceRef = useRef<View>(null);

    const panelAvailable = !!controlSections?.length || !!controlsContent || hasOriginal || overflow.length > 0;

    useEffect(() => {
        let active = true;

        void AccessibilityInfo.isScreenReaderEnabled().then(value => {
            if (active && value) setScreenReader(true);
        });

        const listener = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);

        return () => {
            active = false;
            listener.remove();
        };
    }, []);

    useEffect(() => {
        const animation = Animated.timing(progress, {
            toValue: controlsVisible ? 1 : 0,
            duration: decorativeMotionEnabled ? CONTROLS_ANIMATION_MS : 0,
            useNativeDriver: true,
        });

        animation.start();

        return () => animation.stop();
    }, [controlsVisible, decorativeMotionEnabled, progress]);

    if (imageDocument && !settings) throw new Error('ContentReader requires settings for IMAGE_SEQUENCE');

    const hiddenProps = {
        pointerEvents: controlsVisible ? ('box-none' as const) : ('none' as const),
        accessibilityElementsHidden: !controlsVisible,
        importantForAccessibility: controlsVisible ? ('auto' as const) : ('no-hide-descendants' as const),
    };

    const reveal = () => interaction.dispatch({ type: 'reveal' });

    const comparisonControls = (
        <>
            {hasOriginal ? (
                <Button variant="outline" onPress={() => setShowOriginal(value => !value)}>
                    {t(showOriginal ? 'actions.showResult' : 'actions.showOriginal')}
                </Button>
            ) : null}
            {overflow.length ? (
                <Button variant="ghost" onPress={() => setShowOverflow(value => !value)}>
                    {t('actions.overflow')}
                </Button>
            ) : null}
            {showOverflow ? overflow.map(region => <AppText key={region.id}>{region.translatedText}</AppText>) : null}
        </>
    );

    return (
        <View style={{ flex: 1, backgroundColor: tokens.bg }}>
            <StatusBar hidden={false} barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <View
                ref={surfaceRef}
                testID="reader-touch-surface"
                style={{ flex: 1 }}
                accessibilityActions={[{ name: 'activate', label: t(controlsVisible ? 'actions.hideControls' : 'actions.showControls') }]}
                onAccessibilityAction={() => interaction.dispatch({ type: 'toggle' })}
                onLayout={event => {
                    interaction.surface.current.width = event.nativeEvent.layout.width;
                    surfaceRef.current?.measureInWindow(x => {
                        interaction.surface.current.x = x;
                    });
                }}
                {...interaction.touchHandlers}
            >
                {imageDocument ? (
                    <ImageViewport
                        document={imageDocument}
                        settings={settings!}
                        location={current}
                        showOriginal={showOriginal}
                        onLocationChange={onLocationChange ?? ignoreLocation}
                        onValidateItem={onValidateItem}
                        onScrollPhase={interaction.onScrollPhase}
                    />
                ) : (
                    <TextViewport
                        document={document as Extract<ReaderDocument, { kind: 'TEXT_FLOW' }>}
                        location={current}
                        preferences={textPreferences}
                        onProgressChange={setTextPercent}
                        onLocationChange={onLocationChange}
                        onScrollPhase={interaction.onScrollPhase}
                    />
                )}
            </View>
            {!controlsVisible && (gesturePreferences.controlsMode === 'SWIPE' || gesturePreferences.controlsMode === 'TAP_OR_SWIPE') && !screenReader ? (
                <ReaderRevealGesture
                    bottom={insets.bottom + spacing.xs}
                    targetSize={minimumTouchTarget}
                    blocked={() => interaction.busy() || settingsOpen}
                    onReveal={reveal}
                />
            ) : null}
            <Animated.View
                {...hiddenProps}
                testID="reader-top-bar"
                style={{
                    borderBottomWidth: 1,
                    borderBottomColor: tokens.separator,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    paddingTop: insets.top,
                    paddingBottom: 6,
                    paddingLeft: insets.left + spacing.sm,
                    paddingRight: insets.right + spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    backgroundColor: tokens.surface,
                    opacity: progress,
                    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-spacing.sm, 0] }) }],
                }}
            >
                <IconButton accessibilityLabel={t('actions.exit')} icon="chevron-back" onPress={onExit} />
                <View style={{ flex: 1, minWidth: 0, paddingVertical: spacing.xs }}>
                    <AppText numberOfLines={1} variant="label">
                        {document.title}
                    </AppText>
                    {imageDocument?.chapterNumber ? (
                        <AppText numberOfLines={1} variant="caption">
                            {t('viewport.chapter', { chapter: imageDocument.chapterNumber })}
                        </AppText>
                    ) : null}
                    {imageDocument?.sourceKind === 'DEMO' ? (
                        <AppText numberOfLines={1} variant="caption">
                            {t('demo.badge')}
                        </AppText>
                    ) : null}
                </View>
                {panelAvailable ? (
                    <IconButton accessibilityLabel={t('actions.settings')} icon="settings-outline" onPress={() => setSettingsOpen(true)} />
                ) : null}
            </Animated.View>
            <Animated.View
                {...hiddenProps}
                testID="reader-bottom-bar"
                style={{
                    borderTopWidth: 1,
                    borderTopColor: tokens.separator,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingBottom: Math.max(insets.bottom, spacing.sm),
                    paddingLeft: insets.left + spacing.sm,
                    paddingRight: insets.right + spacing.sm,
                    paddingTop: spacing.xs,
                    backgroundColor: tokens.surface,
                    opacity: progress,
                    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [spacing.sm, 0] }) }],
                }}
            >
                <View
                    accessible
                    accessibilityRole="progressbar"
                    accessibilityLabel={t('viewport.progress')}
                    accessibilityValue={imageDocument ? { min: 0, max: ids.length, now: current.index + 1 } : { min: 0, max: 100, now: textPercent }}
                    style={{ height: spacing.xs, backgroundColor: tokens.separator }}
                >
                    <View
                        style={{
                            width: `${imageDocument ? ((current.index + 1) / Math.max(1, ids.length)) * 100 : textPercent}%`,
                            height: '100%',
                            backgroundColor: tokens.accentText,
                        }}
                    />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: minimumTouchTarget }}>
                    {paged ? (
                        <IconButton
                            accessibilityLabel={t('actions.previousPage')}
                            disabled={groupIndex <= 0}
                            icon={settings?.direction === 'RTL' ? 'chevron-forward' : 'chevron-back'}
                            onPress={() => navigate('previous')}
                        />
                    ) : null}
                    <AppText testID="reader-current-page" variant="caption" style={{ flex: 1, textAlign: 'center' }}>
                        {imageDocument ? t('viewport.page', { page: current.index + 1, total: ids.length }) : t('text.progress', { percent: textPercent })}
                    </AppText>
                    {paged ? (
                        <IconButton
                            accessibilityLabel={t('actions.nextPage')}
                            disabled={groupIndex >= lastGroup}
                            icon={settings?.direction === 'RTL' ? 'chevron-back' : 'chevron-forward'}
                            onPress={() => navigate('next')}
                        />
                    ) : null}
                    <IconButton accessibilityLabel={t('actions.hideControls')} icon="eye-off-outline" onPress={() => interaction.dispatch({ type: 'hide' })} />
                </View>
                {statusContent}
            </Animated.View>
            {!controlsVisible && screenReader ? (
                <View style={{ position: 'absolute', top: insets.top, right: insets.right + spacing.sm, backgroundColor: tokens.surface }}>
                    <IconButton icon="eye-outline" accessibilityLabel={t('actions.showControls')} onPress={reveal} />
                </View>
            ) : null}
            <ReaderPanel
                visible={settingsOpen}
                title={t('actions.settings')}
                onClose={() => setSettingsOpen(false)}
                sections={controlSections?.map(section =>
                    section.id === 'appearance'
                        ? {
                              ...section,
                              content: (
                                  <>
                                      {comparisonControls}
                                      {section.content}
                                  </>
                              ),
                          }
                        : section,
                )}
            >
                {comparisonControls}
                {controlsContent}
            </ReaderPanel>
        </View>
    );
}
