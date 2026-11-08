import { type ImageSourcePropType, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Button } from './Button';

export type StateViewKind = 'empty' | 'error' | 'offline' | 'notfound';

export interface StateViewAction {
    label: string;
    onPress: () => void;
}

const ILLUSTRATIONS: Record<StateViewKind, ImageSourcePropType> = {
    empty: require('../../../assets/images/mascot-pensando.png'),
    error: require('../../../assets/images/mascot-triste.webp'),
    offline: require('../../../assets/images/mascot-duvida.webp'),
    notfound: require('../../../assets/images/mascot-404.webp'),
};

const ILLUSTRATION_SIZE = { notfound: 200, screen: 140, inline: 96 } as const;
const TEXT_MAX_WIDTH = 300;
const ACTIONS_MAX_WIDTH = 280;
const LARGE_FONT_SCALE = 1.6;
const LOW_HEIGHT = 600;

interface StateViewBase {
    title: string;
    text?: string;
    eyebrow?: string;
    inline?: boolean;
    /** Replaces the default illustration; `null` hides it. */
    image?: ImageSourcePropType | null;
    /** Extra actions rendered after the required ones. */
    actions?: ReactNode;
    testID?: string;
}

export type StateViewProps =
    | (StateViewBase & { kind: 'empty' | 'offline' })
    | (StateViewBase & { kind: 'error'; retry: StateViewAction })
    | (StateViewBase & { kind: 'notfound'; goHome: StateViewAction; back?: StateViewAction });

/** Standard empty, error, offline and not-found states. Error always offers retry; not-found always offers going home. */
export function StateView(props: StateViewProps) {
    const { kind, title, text, eyebrow, inline = false, image, actions, testID = 'state-view' } = props;

    const { height } = useWindowDimensions();

    const { fontScale, layout, radii, spacing, tokens } = useTheme();

    const eyebrowColor = { empty: tokens.subtle, error: tokens.danger, offline: tokens.warn, notfound: tokens.accentText }[kind];
    const showIllustration = image !== null && fontScale < LARGE_FONT_SCALE && height >= LOW_HEIGHT;
    const illustrationSize = inline ? ILLUSTRATION_SIZE.inline : kind === 'notfound' ? ILLUSTRATION_SIZE.notfound : ILLUSTRATION_SIZE.screen;

    const inlineSurface = {
        empty: { backgroundColor: 'transparent', borderColor: tokens.borderStrong, borderStyle: 'dashed' as const },
        error: { backgroundColor: tokens.dangerSoft, borderColor: tokens.danger, borderStyle: 'solid' as const },
        offline: { backgroundColor: 'transparent', borderColor: tokens.separator, borderStyle: 'solid' as const },
        notfound: { backgroundColor: 'transparent', borderColor: tokens.separator, borderStyle: 'solid' as const },
    }[kind];

    const primary =
        props.kind === 'error' ? (
            <Button onPress={props.retry.onPress}>{props.retry.label}</Button>
        ) : props.kind === 'notfound' ? (
            <Button onPress={props.goHome.onPress}>{props.goHome.label}</Button>
        ) : null;
    const secondary =
        props.kind === 'notfound' && props.back ? (
            <Button variant="ghost" onPress={props.back.onPress}>
                {props.back.label}
            </Button>
        ) : null;
    const hasActions = Boolean(primary || secondary || actions);

    return (
        <View
            testID={testID}
            accessible={!hasActions}
            role={kind === 'error' ? 'alert' : 'status'}
            accessibilityLiveRegion={kind === 'error' ? 'assertive' : 'polite'}
            style={
                inline
                    ? {
                          ...inlineSurface,
                          alignItems: 'center',
                          borderRadius: radii.card,
                          borderWidth: 1,
                          gap: spacing.sm,
                          paddingHorizontal: layout.screenGutter,
                          paddingVertical: spacing.xl,
                      }
                    : {
                          alignItems: 'center',
                          flex: 1,
                          gap: spacing.md,
                          justifyContent: 'center',
                          paddingHorizontal: spacing.xl,
                          paddingVertical: spacing['2xl'],
                      }
            }
        >
            {showIllustration ? (
                <Image
                    testID={`${testID}-illustration`}
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    source={image ?? ILLUSTRATIONS[kind]}
                    contentFit="contain"
                    style={{ height: illustrationSize, marginBottom: inline ? 0 : spacing.sm, width: illustrationSize }}
                />
            ) : null}
            {eyebrow ? (
                <AppText variant="eyebrow" style={{ color: eyebrowColor, textAlign: 'center' }}>
                    {eyebrow}
                </AppText>
            ) : null}
            <AppText accessibilityRole="header" variant={inline ? 'label' : 'title'} style={{ maxWidth: TEXT_MAX_WIDTH, textAlign: 'center' }}>
                {title}
            </AppText>
            {text ? (
                <AppText variant={inline ? 'caption' : 'body'} tone={inline ? 'subtle' : 'muted'} style={{ maxWidth: TEXT_MAX_WIDTH, textAlign: 'center' }}>
                    {text}
                </AppText>
            ) : null}
            {hasActions ? (
                <View
                    testID={`${testID}-actions`}
                    style={{ alignSelf: 'stretch', alignItems: 'center', gap: spacing.sm, marginTop: inline ? spacing.sm : spacing.md }}
                >
                    <View style={{ gap: spacing.sm, maxWidth: ACTIONS_MAX_WIDTH, width: '100%' }}>
                        {primary}
                        {secondary}
                        {actions}
                    </View>
                </View>
            ) : null}
        </View>
    );
}
