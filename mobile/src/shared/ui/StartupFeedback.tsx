import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { FONTS, useTheme } from '@/shared/theme';

/** Mesma imagem e largura do splash nativo (`expo-splash-screen` em `app.json`), para a troca não saltar. */
export const STARTUP_LOGO = require('../../../assets/images/splash-icon.png');
export const STARTUP_LOGO_SIZE = 240;
/** O desenho do logo termina a 74% da altura da imagem (757 de 1024 px); a barra fica logo abaixo dele. */
const LOGO_VISIBLE_BOTTOM = 757 / 1024;
/** Abaixo desta espera só o logo e a barra aparecem; o texto não pisca numa abertura rápida. */
export const STARTUP_TEXT_DELAY_MS = 800;

const TRACK_WIDTH = 96;
const TRACK_HEIGHT = 3;
const SEGMENT_WIDTH = 32;

interface StartupFeedbackProps {
    /** Announced to screen readers: the exact step (preferences, session, sync). */
    label: string;
    /** Visible phrase shown after a short wait; the same for every step so it doesn't change under the reader. */
    title: string;
    testID?: string;
}

/** Thin bar with a segment sliding side to side; still and centred when decorative motion is off. */
function StartupBar({ testID }: { testID: string }) {
    const { decorativeMotionEnabled, motion, radii, tokens } = useTheme();
    const position = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!decorativeMotionEnabled) {
            position.setValue(0.5);
            return;
        }
        position.setValue(0);
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(position, { toValue: 1, duration: motion.pulse / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(position, { toValue: 0, duration: motion.pulse / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [decorativeMotionEnabled, motion.pulse, position]);

    return (
        <View
            testID={testID}
            style={{ backgroundColor: tokens.separator, borderRadius: radii.pill, height: TRACK_HEIGHT, overflow: 'hidden', width: TRACK_WIDTH }}
        >
            <Animated.View
                testID={`${testID}-segment`}
                style={{
                    backgroundColor: tokens.accent,
                    borderRadius: radii.pill,
                    height: TRACK_HEIGHT,
                    transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, TRACK_WIDTH - SEGMENT_WIDTH] }) }],
                    width: SEGMENT_WIDTH,
                }}
            />
        </View>
    );
}

/**
 * Tela de abertura do app, entre o splash nativo e a primeira tela: continua o splash (mesmo logo, tamanho, posição e
 * fundo) e acrescenta só uma barra fina. O texto entra depois de `STARTUP_TEXT_DELAY_MS` e é o mesmo em todas as
 * etapas; o leitor de tela continua ouvindo a etapa exata pelo `label`.
 */
export function StartupFeedback({ label, title, testID = 'startup-feedback' }: StartupFeedbackProps) {
    const { decorativeMotionEnabled, motion, spacing, tokens, typography } = useTheme();
    const [showTitle, setShowTitle] = useState(false);
    const titleOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => setShowTitle(true), STARTUP_TEXT_DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!showTitle) return;
        const fade = Animated.timing(titleOpacity, { toValue: 1, duration: decorativeMotionEnabled ? motion.base : 0, useNativeDriver: true });
        fade.start();
        return () => fade.stop();
    }, [decorativeMotionEnabled, motion.base, showTitle, titleOpacity]);

    return (
        <View
            testID={testID}
            accessible
            accessibilityLabel={label}
            accessibilityLiveRegion="polite"
            accessibilityRole="progressbar"
            style={{ alignItems: 'center', backgroundColor: tokens.bg, flex: 1, justifyContent: 'center' }}
        >
            <View style={{ height: STARTUP_LOGO_SIZE, width: STARTUP_LOGO_SIZE }}>
                <Image
                    testID={`${testID}-logo`}
                    source={STARTUP_LOGO}
                    contentFit="contain"
                    accessible={false}
                    style={{ height: STARTUP_LOGO_SIZE, width: STARTUP_LOGO_SIZE }}
                />
                <View
                    style={{
                        alignItems: 'center',
                        gap: spacing.md,
                        left: -spacing.xl * 2,
                        position: 'absolute',
                        right: -spacing.xl * 2,
                        top: Math.round(STARTUP_LOGO_SIZE * LOGO_VISIBLE_BOTTOM) + spacing.lg,
                    }}
                >
                    <StartupBar testID={`${testID}-bar`} />
                    {showTitle ? (
                        <Animated.View style={{ opacity: titleOpacity }}>
                            <Text
                                testID={`${testID}-title`}
                                style={{ color: tokens.muted, fontFamily: FONTS.regular, fontSize: typography.small, textAlign: 'center' }}
                            >
                                {title}
                            </Text>
                        </Animated.View>
                    ) : null}
                </View>
            </View>
        </View>
    );
}
