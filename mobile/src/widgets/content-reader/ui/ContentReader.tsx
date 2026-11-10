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
import { AppText, BackButton, BottomSheet, Button, Icon, IconButton, PressableBox as Pressable } from '@/shared/ui';

import { effectiveImageMode, type ReaderDocument, type ReaderLocation, restoreLocationById } from '../model/contentReader';
import { textReaderPalette } from '../model/textReader';
import { useReaderInteraction } from '../model/useReaderInteraction';
import { ImageViewport } from './ImageViewport';
import { type ReaderControlSection, ReaderPanel } from './ReaderPanel';
import { ReaderRevealGesture } from './ReaderRevealGesture';
import { TextViewport } from './TextViewport';
import { ZoomableSurface } from './ZoomableSurface';

const CONTROLS_ANIMATION_MS = 160;

/** Kit reader bars (063): fixed side columns keep the chapter title centred. */
const KIT_SIDE_WIDTH = 96;

const ignoreLocation = () => undefined;

/** Chapters of the work being read (063); only the local work reader provides them. */
export interface ReaderChapterNavigation {
    items: readonly { id: string; title: string }[];
    currentId: string;
    onSelect(id: string): void;
}

/** End of chapter in the vertical flow (063). `work` returns to the work screen; `back` just leaves the reader. */
export interface ReaderEndOfChapter {
    workTitle?: string;
    backTarget: 'work' | 'back';
    onBack(): void;
}

/** Single reader sheet (063, decision D2): quick settings plus a link to every reader setting. */
export interface ReaderSettingsSheet {
    content: ReactNode;
    onOpenAllSettings(): void;
}

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
    /** Line under the title, e.g. the work name. */
    subtitle?: string;
    chapters?: ReaderChapterNavigation;
    endOfChapter?: ReaderEndOfChapter;
    /** Whether a translated result exists to compare with the original; defaults to "every item has an original". */
    comparison?: boolean;
    /** Replaces the pages in translated mode while the whole chapter has no readable translation. */
    blockingState?: (actions: { readOriginal(): void }) => ReactNode;
    settingsSheet?: ReaderSettingsSheet;
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
    subtitle,
    chapters,
    endOfChapter,
    comparison,
    blockingState,
    settingsSheet,
}: ContentReaderProps) {
    const { t } = useTranslation('reader');

    const { colorScheme, metrics, radii, spacing, tokens, minimumTouchTarget, decorativeMotionEnabled } = useTheme();

    const insets = useSafeAreaInsets();

    const [textPercent, setTextPercent] = useState(0);

    const [showOriginal, setShowOriginal] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showOverflow, setShowOverflow] = useState(false);
    const [screenReader, setScreenReader] = useState(false);
    const [chapterListOpen, setChapterListOpen] = useState(false);

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

    const panelAvailable = !!settingsSheet || !!controlSections?.length || !!controlsContent || hasOriginal || overflow.length > 0;

    const comparisonAvailable = comparison ?? hasOriginal;

    const versionToggle = !!imageDocument && !!settingsSheet && (comparisonAvailable || !!blockingState);

    const blocked = !!imageDocument && !!blockingState && !showOriginal;

    const chapterIndex = chapters ? chapters.items.findIndex(item => item.id === chapters.currentId) : -1;

    const previousChapter = chapters && chapterIndex > 0 ? chapters.items[chapterIndex - 1] : null;

    const nextChapter = chapters && chapterIndex >= 0 ? (chapters.items[chapterIndex + 1] ?? null) : null;

    const rtl = settings?.direction === 'RTL';

    const kitBars = !!imageDocument && !!settingsSheet;
    // Kit (063): controles das barras na cor do texto, ícone 24; fora do kit mantém o padrão de acento.
    const barIcon = kitBars ? ({ tone: 'default', iconSize: 24 } as const) : {};
    const kitSubtitle = [
        subtitle ?? (imageDocument?.chapterNumber ? t('viewport.chapter', { chapter: imageDocument.chapterNumber }) : null),
        imageDocument?.sourceKind === 'DEMO' ? t('demo.badge') : null,
    ]
        .filter(Boolean)
        .join(' · ');

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

    const endFooter = endOfChapter ? (
        <View
            testID="reader-end-of-chapter"
            style={{
                alignItems: 'center',
                gap: spacing.xs,
                paddingBottom: insets.bottom + minimumTouchTarget * 3,
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.xl,
            }}
        >
            <AppText variant="eyebrow" tone="muted">
                {t('kit.endEyebrow')}
            </AppText>
            <AppText variant="section" style={{ textAlign: 'center' }}>
                {nextChapter
                    ? t('kit.nextTitle', { name: nextChapter.title })
                    : endOfChapter.workTitle
                      ? t('kit.upToDate', { name: endOfChapter.workTitle })
                      : t('kit.upToDateUntitled')}
            </AppText>
            <View style={{ marginTop: spacing.md, maxWidth: 320, width: '100%' }}>
                <Button fullWidth onPress={() => (nextChapter ? chapters!.onSelect(nextChapter.id) : endOfChapter.onBack())}>
                    {nextChapter ? t('kit.readNext') : endOfChapter.backTarget === 'work' ? t('kit.backToWork') : t('kit.back')}
                </Button>
            </View>
        </View>
    ) : null;

    const comparisonControls = (
        <>
            {hasOriginal && !settingsSheet ? (
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
            {controlsContent}
        </>
    );

    const versionToggleNode = (
        <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('kit.version')}
            testID="reader-version-toggle"
            style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.control, flexDirection: 'row', gap: 2, padding: 3 }}
        >
            {([false, true] as const).map(original => {
                const selected = showOriginal === original;
                return (
                    <Pressable
                        key={String(original)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={t(original ? 'kit.original' : 'kit.translated')}
                        onPress={() => setShowOriginal(original)}
                        style={{
                            backgroundColor: selected ? tokens.accent : 'transparent',
                            borderRadius: radii.sm,
                            justifyContent: 'center',
                            minHeight: Math.max(32, minimumTouchTarget - 8),
                            paddingHorizontal: spacing.md,
                        }}
                    >
                        <AppText variant="button" style={{ color: selected ? tokens.onAccent : tokens.muted }}>
                            {t(original ? 'kit.original' : 'kit.translated')}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );

    // Kit footer (063/AC-003): one back and one forward arrow. Paged modes turn pages and cross into the
    // neighbouring chapter at the edges; vertical modes step between chapters.
    const chapterStep = (target: typeof previousChapter, label: string) =>
        chapters && target ? { label, onPress: () => chapters.onSelect(target.id) } : { label, onPress: null };
    const stepBack: { label: string; onPress: (() => void) | null } =
        paged && groupIndex > 0
            ? { label: t('actions.previousPage'), onPress: () => navigate('previous') }
            : chapterStep(previousChapter, t('kit.previousChapter'));
    const stepForward: { label: string; onPress: (() => void) | null } =
        paged && groupIndex < lastGroup ? { label: t('actions.nextPage'), onPress: () => navigate('next') } : chapterStep(nextChapter, t('kit.nextChapter'));

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
                {blocked ? (
                    <View testID="reader-blocking-state" style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg }}>
                        {blockingState!({ readOriginal: () => setShowOriginal(true) })}
                    </View>
                ) : imageDocument ? (
                    <ZoomableSurface resetKey={`${current.itemId}:${showOriginal}`} bottomInset={insets.bottom + minimumTouchTarget}>
                        <ImageViewport
                            document={imageDocument}
                            settings={settings!}
                            location={current}
                            showOriginal={showOriginal}
                            onLocationChange={onLocationChange ?? ignoreLocation}
                            onValidateItem={onValidateItem}
                            onScrollPhase={interaction.onScrollPhase}
                            footer={endOfChapter && !paged ? endFooter : undefined}
                        />
                    </ZoomableSurface>
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
                <View style={kitBars ? { alignItems: 'flex-start', width: KIT_SIDE_WIDTH } : undefined}>
                    <BackButton accessibilityLabel={t('actions.exit')} tone={kitBars ? 'neutral' : 'default'} onPress={onExit} />
                </View>
                <View style={{ alignItems: kitBars ? 'center' : undefined, flex: 1, minWidth: 0, paddingVertical: spacing.xs }}>
                    <AppText numberOfLines={1} variant="heading" style={kitBars ? { textAlign: 'center' } : undefined}>
                        {document.title}
                    </AppText>
                    {kitBars ? (
                        // Kit (063): duas linhas — capítulo e obra; o selo de demonstração segue na mesma linha da obra.
                        kitSubtitle ? (
                            <AppText testID="reader-subtitle" numberOfLines={1} variant="caption" tone="subtle" style={{ textAlign: 'center' }}>
                                {kitSubtitle}
                            </AppText>
                        ) : null
                    ) : (
                        <>
                            {subtitle ? (
                                <AppText testID="reader-subtitle" numberOfLines={1} variant="caption" tone="subtle">
                                    {subtitle}
                                </AppText>
                            ) : null}
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
                        </>
                    )}
                </View>
                <View style={kitBars ? { flexDirection: 'row', justifyContent: 'flex-end', width: KIT_SIDE_WIDTH } : { flexDirection: 'row' }}>
                    {panelAvailable ? (
                        settingsSheet ? (
                            <IconButton {...barIcon} accessibilityLabel={t('kit.settingsTitle')} icon="options-outline" onPress={() => setSettingsOpen(true)} />
                        ) : (
                            <IconButton accessibilityLabel={t('actions.settings')} icon="settings-outline" onPress={() => setSettingsOpen(true)} />
                        )
                    ) : null}
                    {chapters ? (
                        <IconButton
                            {...barIcon}
                            accessibilityLabel={t('kit.chapterList')}
                            icon="list-outline"
                            disabled={chapters.items.length < 2}
                            onPress={() => setChapterListOpen(true)}
                        />
                    ) : null}
                </View>
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
                {kitBars ? (
                    <View testID="reader-progress-row" style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 32 }}>
                        <View
                            accessible
                            accessibilityRole="progressbar"
                            accessibilityLabel={t('viewport.progress')}
                            accessibilityValue={{ min: 0, max: ids.length, now: current.index + 1 }}
                            style={{ backgroundColor: tokens.separator, borderRadius: 2, flex: 1, height: 4, overflow: 'hidden' }}
                        >
                            <View
                                style={{ backgroundColor: tokens.accent, height: '100%', width: `${((current.index + 1) / Math.max(1, ids.length)) * 100}%` }}
                            />
                        </View>
                        <AppText
                            testID="reader-current-page"
                            variant="caption"
                            tone="muted"
                            accessibilityLabel={t('viewport.page', { page: current.index + 1, total: ids.length })}
                            style={{ minWidth: 44, textAlign: 'right' }}
                        >
                            {t('kit.pageOfTotal', { page: current.index + 1, total: ids.length })}
                        </AppText>
                    </View>
                ) : (
                    <>
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
                            <AppText
                                testID="reader-current-page"
                                variant="caption"
                                accessibilityLabel={imageDocument ? t('viewport.page', { page: current.index + 1, total: ids.length }) : undefined}
                                style={{ flex: 1, textAlign: 'center' }}
                            >
                                {imageDocument
                                    ? t('viewport.page', { page: current.index + 1, total: ids.length })
                                    : t('text.progress', { percent: textPercent })}
                            </AppText>
                            {paged ? (
                                <IconButton
                                    accessibilityLabel={t('actions.nextPage')}
                                    disabled={groupIndex >= lastGroup}
                                    icon={settings?.direction === 'RTL' ? 'chevron-back' : 'chevron-forward'}
                                    onPress={() => navigate('next')}
                                />
                            ) : null}
                            <IconButton
                                accessibilityLabel={t('actions.hideControls')}
                                icon="eye-off-outline"
                                onPress={() => interaction.dispatch({ type: 'hide' })}
                            />
                        </View>
                    </>
                )}
                {kitBars && (chapters || versionToggle || paged) ? (
                    <View
                        testID="reader-chapter-row"
                        style={{
                            alignItems: 'center',
                            flexDirection: rtl ? 'row-reverse' : 'row',
                            gap: spacing.sm,
                            justifyContent: 'space-between',
                            minHeight: minimumTouchTarget,
                        }}
                    >
                        {paged || chapters ? (
                            <IconButton
                                {...barIcon}
                                accessibilityLabel={stepBack.label}
                                disabled={!stepBack.onPress}
                                icon={rtl ? 'chevron-forward' : 'chevron-back'}
                                onPress={() => stepBack.onPress?.()}
                            />
                        ) : (
                            <View style={{ width: minimumTouchTarget }} />
                        )}
                        {versionToggle ? versionToggleNode : <View style={{ flex: 1 }} />}
                        {paged || chapters ? (
                            <IconButton
                                {...barIcon}
                                accessibilityLabel={stepForward.label}
                                disabled={!stepForward.onPress}
                                icon={rtl ? 'chevron-back' : 'chevron-forward'}
                                onPress={() => stepForward.onPress?.()}
                            />
                        ) : (
                            <View style={{ width: minimumTouchTarget }} />
                        )}
                    </View>
                ) : !kitBars && (chapters || versionToggle) ? (
                    <View
                        testID="reader-chapter-row"
                        style={{
                            alignItems: 'center',
                            flexDirection: rtl ? 'row-reverse' : 'row',
                            gap: spacing.xs,
                            justifyContent: 'space-between',
                            minHeight: minimumTouchTarget,
                        }}
                    >
                        {chapters ? (
                            <ChapterStepButton
                                accessibilityLabel={t('kit.previousChapter')}
                                disabled={!previousChapter}
                                icon={rtl ? 'chevron-forward' : 'chevron-back'}
                                trailing={rtl}
                                label={t('kit.previous')}
                                onPress={() => previousChapter && chapters.onSelect(previousChapter.id)}
                            />
                        ) : (
                            <View />
                        )}
                        {versionToggle ? versionToggleNode : null}
                        {chapters ? (
                            <ChapterStepButton
                                accessibilityLabel={t('kit.nextChapter')}
                                disabled={!nextChapter}
                                icon={rtl ? 'chevron-back' : 'chevron-forward'}
                                trailing={!rtl}
                                label={t('kit.next')}
                                onPress={() => nextChapter && chapters.onSelect(nextChapter.id)}
                            />
                        ) : (
                            <View />
                        )}
                    </View>
                ) : null}
                {statusContent}
            </Animated.View>
            {!controlsVisible && screenReader ? (
                <View style={{ position: 'absolute', top: insets.top, right: insets.right + spacing.sm, backgroundColor: tokens.surface }}>
                    <IconButton icon="eye-outline" accessibilityLabel={t('actions.showControls')} onPress={reveal} />
                </View>
            ) : null}
            <ReaderPanel
                visible={settingsOpen}
                title={settingsSheet ? t('kit.settingsTitle') : t('actions.settings')}
                description={settingsSheet ? t('kit.settingsDescription') : undefined}
                footer={
                    settingsSheet ? (
                        <Button
                            size="compact"
                            variant="ghost"
                            leading={<Icon name="settings-outline" size={metrics.icon.md} />}
                            onPress={() => {
                                setSettingsOpen(false);
                                settingsSheet.onOpenAllSettings();
                            }}
                        >
                            {t('kit.allSettings')}
                        </Button>
                    ) : undefined
                }
                onClose={() => setSettingsOpen(false)}
                sections={
                    settingsSheet
                        ? undefined
                        : controlSections?.map(section =>
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
                          )
                }
            >
                {settingsSheet ? settingsSheet.content : null}
                {comparisonControls}
            </ReaderPanel>
            {chapters ? (
                <BottomSheet visible={chapterListOpen} onClose={() => setChapterListOpen(false)} closeLabel={t('kit.close')} title={t('kit.chapterListTitle')}>
                    <View style={{ gap: spacing.xs }}>
                        {chapters.items.map(item => {
                            const selected = item.id === chapters.currentId;
                            return (
                                <Pressable
                                    key={item.id}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: selected }}
                                    accessibilityLabel={item.title}
                                    accessibilityHint={selected ? t('kit.currentChapter') : undefined}
                                    onPress={() => {
                                        setChapterListOpen(false);
                                        if (!selected) chapters.onSelect(item.id);
                                    }}
                                    style={({ pressed }) => ({
                                        alignItems: 'center',
                                        backgroundColor: pressed ? tokens.surfacePressed : selected ? tokens.surfaceSelected : 'transparent',
                                        borderRadius: radii.control,
                                        flexDirection: 'row',
                                        gap: spacing.md,
                                        minHeight: Math.max(minimumTouchTarget, metrics.row.single),
                                        paddingHorizontal: spacing.sm,
                                    })}
                                >
                                    <AppText variant="label" tone={selected ? 'accent' : 'default'} style={{ flex: 1 }} numberOfLines={2}>
                                        {item.title}
                                    </AppText>
                                    {selected ? <Icon name="checkmark" size={metrics.icon.md} /> : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </BottomSheet>
            ) : null}
        </View>
    );
}

/** Kit reader chapter step (063/AC-003): compact, text-colored, never full width. */
function ChapterStepButton({
    accessibilityLabel,
    disabled,
    icon,
    label,
    onPress,
    trailing = false,
}: {
    accessibilityLabel: string;
    disabled: boolean;
    icon: 'chevron-back' | 'chevron-forward';
    label: string;
    onPress(): void;
    trailing?: boolean;
}) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const glyph = <Icon name={icon} size={24} color={tokens.text} />;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? tokens.surfacePressed : 'transparent',
                borderRadius: radii.control,
                flexDirection: 'row',
                gap: spacing.xs,
                minHeight: minimumTouchTarget,
                minWidth: minimumTouchTarget,
                opacity: disabled ? 0.35 : 1,
                paddingHorizontal: spacing.sm,
            })}
        >
            {trailing ? null : glyph}
            <AppText variant="button" style={{ color: tokens.text }}>
                {label}
            </AppText>
            {trailing ? glyph : null}
        </Pressable>
    );
}
