import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, useColorScheme, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import {
    createTypographyStyles,
    type DensityPreference,
    type FontSizePreference,
    LAYOUT_SCALES,
    type LayoutScale,
    minimumTouchTarget,
    RADII,
    type RadiusScale,
    resolveColorScheme,
    resolveDecorativeMotion,
    resolveEffectiveHighContrast,
    resolveEffectiveReduceMotion,
    resolveThemeTokens,
    SPACING_SCALES,
    type SpacingScale,
    TYPOGRAPHY_SCALES,
    type TypographyScale,
    type TypographyStyleScale,
} from './appearance';
import { type ColorScheme, darkTokens, lightTokens, type ThemeTokens } from './tokens';

interface ThemeContextValue {
    tokens: ThemeTokens;
    colorScheme: ColorScheme;
    override: ColorScheme | null;
    typography: TypographyScale;
    textStyles: TypographyStyleScale;
    spacing: SpacingScale;
    radii: RadiusScale;
    layout: LayoutScale;
    fontScale: number;
    minimumTouchTarget: number;
    effectiveReduceMotion: boolean;
    effectiveHighContrast: boolean;
    decorativeMotionEnabled: boolean;
    setOverride: (scheme: ColorScheme | null) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    tokens: lightTokens,
    colorScheme: 'light',
    override: null,
    typography: TYPOGRAPHY_SCALES.DEFAULT,
    textStyles: createTypographyStyles(TYPOGRAPHY_SCALES.DEFAULT),
    spacing: SPACING_SCALES.COMFORTABLE,
    radii: RADII,
    layout: LAYOUT_SCALES.COMFORTABLE,
    fontScale: 1,
    minimumTouchTarget: 48,
    effectiveReduceMotion: false,
    effectiveHighContrast: false,
    decorativeMotionEnabled: true,
    setOverride: () => {},
});

const PLATFORM_ACCESSIBILITY_TIMEOUT_MS = 1500;

function resolveWithTimeout(operation: Promise<boolean>): Promise<boolean> {
    return new Promise(resolve => {
        let settled = false;

        const finish = (value: boolean) => {
            if (settled) return;

            settled = true;

            clearTimeout(timeout);

            resolve(value);
        };

        const timeout = setTimeout(() => finish(false), PLATFORM_ACCESSIBILITY_TIMEOUT_MS);

        operation.then(finish, () => finish(false));
    });
}

interface Props {
    children: React.ReactNode;
    initialOverride?: ColorScheme | null;
    fontSize?: FontSizePreference;
    density?: DensityPreference;
    animations?: boolean;
    reduceMotion?: boolean;
    highContrast?: boolean;
    waitForPlatform?: boolean;
    onOverrideChange?: (scheme: ColorScheme | null) => void;
}

export function ThemeProvider({
    children,
    initialOverride = null,
    fontSize = 'DEFAULT',
    density = 'COMFORTABLE',
    animations = true,
    reduceMotion = false,
    highContrast = false,
    waitForPlatform = false,
    onOverrideChange,
}: Props) {
    const systemScheme = useColorScheme();

    const { fontScale } = useWindowDimensions();

    const [override, setOverrideState] = useState<ColorScheme | null>(initialOverride);
    const [systemReduceMotion, setSystemReduceMotion] = useState(false);
    const [systemHighTextContrast, setSystemHighTextContrast] = useState(false);
    const [systemDarkerColors, setSystemDarkerColors] = useState(false);
    const [platformReady, setPlatformReady] = useState(!waitForPlatform);

    useEffect(() => {
        if (!waitForPlatform) return;

        let mounted = true;

        const reduceMotion = AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
        const highTextContrast = AccessibilityInfo.isHighTextContrastEnabled().catch(() => false);
        const darkerColors = AccessibilityInfo.isDarkerSystemColorsEnabled().catch(() => false);

        void reduceMotion.then(value => {
            if (mounted) setSystemReduceMotion(value);
        });

        void highTextContrast.then(value => {
            if (mounted) setSystemHighTextContrast(value);
        });

        void darkerColors.then(value => {
            if (mounted) setSystemDarkerColors(value);
        });

        void Promise.all([resolveWithTimeout(reduceMotion), resolveWithTimeout(highTextContrast), resolveWithTimeout(darkerColors)]).then(
            ([motion, highTextContrast, darkerColors]) => {
                if (!mounted) return;

                setSystemReduceMotion(motion);
                setSystemHighTextContrast(highTextContrast);
                setSystemDarkerColors(darkerColors);
                setPlatformReady(true);
            },
        );

        const reduceMotionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduceMotion);
        const highTextContrastSubscription = AccessibilityInfo.addEventListener('highTextContrastChanged', setSystemHighTextContrast);
        const darkerColorsSubscription = AccessibilityInfo.addEventListener('darkerSystemColorsChanged', setSystemDarkerColors);

        return () => {
            mounted = false;
            reduceMotionSubscription.remove();
            highTextContrastSubscription.remove();
            darkerColorsSubscription.remove();
        };
    }, [waitForPlatform]);

    useEffect(() => {
        setOverrideState(initialOverride);
    }, [initialOverride]);

    const colorScheme = resolveColorScheme(override === 'dark' ? 'DARK' : override === 'light' ? 'LIGHT' : 'SYSTEM', systemScheme);
    const effectiveReduceMotion = resolveEffectiveReduceMotion(reduceMotion, systemReduceMotion);
    const effectiveHighContrast = resolveEffectiveHighContrast(highContrast, systemHighTextContrast || systemDarkerColors);
    const tokens = resolveThemeTokens(colorScheme, effectiveHighContrast, { dark: darkTokens, light: lightTokens });

    const context = useMemo<ThemeContextValue>(
        () => ({
            tokens,
            colorScheme,
            override,
            typography: TYPOGRAPHY_SCALES[fontSize],
            textStyles: createTypographyStyles(TYPOGRAPHY_SCALES[fontSize]),
            spacing: SPACING_SCALES[density],
            radii: RADII,
            layout: LAYOUT_SCALES[density],
            fontScale,
            minimumTouchTarget: minimumTouchTarget(),
            effectiveReduceMotion,
            effectiveHighContrast,
            decorativeMotionEnabled: resolveDecorativeMotion(animations, effectiveReduceMotion),
            setOverride: scheme => {
                setOverrideState(scheme);
                onOverrideChange?.(scheme);
            },
        }),
        [animations, colorScheme, density, effectiveHighContrast, effectiveReduceMotion, fontScale, fontSize, onOverrideChange, override, tokens],
    );

    if (waitForPlatform && !platformReady) {
        return (
            <View accessible accessibilityRole="progressbar" style={{ alignItems: 'center', backgroundColor: tokens.bg, flex: 1, justifyContent: 'center' }}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <ActivityIndicator color={tokens.accent} />
            </View>
        );
    }

    return <ThemeContext.Provider value={context}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}
