import { useMemo } from 'react';
import { Platform } from 'react-native';

import { type MotionScale, useTheme } from '@/shared/theme';

/**
 * MOB-FEAT-069: a transição diz que tipo de navegação aconteceu.
 * - `contextSwitch`: trocar de módulo (seletor → plataforma, seletor → biblioteca).
 * - `drillIn`: ir mais fundo (Configurações → Aparência, biblioteca → obra).
 * - `modalFlow`: fluxo que abre e fecha (Traduzir capítulo).
 * - `reader`: entrar no leitor, sem o conteúdo atravessar a tela.
 */
export type ScreenTransitionKind = 'contextSwitch' | 'drillIn' | 'modalFlow' | 'reader';

export interface ScreenTransitionOptions {
    animation: 'fade' | 'none' | 'simple_push' | 'slide_from_bottom' | 'slide_from_right';
    /** iOS only; Android uses the system duration. */
    animationDuration?: number;
    /** iOS: back gesture from anywhere on the screen instead of only the edge. */
    fullScreenGestureEnabled?: boolean;
}

export interface ScreenTransitionContext {
    decorativeMotionEnabled: boolean;
    motion: Pick<MotionScale, 'screen' | 'screenSlide'>;
}

export function screenTransition(kind: ScreenTransitionKind, { decorativeMotionEnabled, motion }: ScreenTransitionContext): ScreenTransitionOptions {
    // Os gestos não dependem do movimento: com animações desligadas só a animação some.
    const animate = (animation: ScreenTransitionOptions['animation'], animationDuration?: number): ScreenTransitionOptions =>
        decorativeMotionEnabled ? { animation, ...(animationDuration === undefined ? {} : { animationDuration }) } : { animation: 'none' };

    switch (kind) {
        case 'contextSwitch':
            return animate('fade', motion.screen);
        case 'drillIn':
            // O push nativo do iOS (~350 ms) não aceita duração; `simple_push` é o mesmo deslize, sem a sombra, com
            // duração própria. O gesto de voltar continua o nativo. No Android a duração é a do sistema.
            return {
                ...(Platform.OS === 'ios' ? animate('simple_push', motion.screenSlide) : animate('slide_from_right')),
                fullScreenGestureEnabled: true,
            };
        case 'modalFlow':
            // Só pela borda: puxar a tela para baixo brigaria com a rolagem do fluxo.
            return { ...animate('slide_from_bottom', motion.screenSlide), fullScreenGestureEnabled: false };
        case 'reader':
            // O deslizar lateral pertence à leitura; no iOS 26 o gesto em tela inteira vem ligado por padrão.
            return { ...animate('fade', motion.screen), fullScreenGestureEnabled: false };
    }
}

export type TabTransitionOptions = { animation: 'none' } | { animation: 'fade'; transitionSpec: { animation: 'timing'; config: { duration: number } } };

/** Tab switch inside a bottom tab navigator: fade in `motion.screen`, or no animation. */
export function tabTransition({ decorativeMotionEnabled, motion }: ScreenTransitionContext): TabTransitionOptions {
    return decorativeMotionEnabled
        ? { animation: 'fade', transitionSpec: { animation: 'timing', config: { duration: motion.screen } } }
        : { animation: 'none' };
}

/** All transition kinds resolved from the current theme motion preferences. */
export function useScreenTransitions(): Record<ScreenTransitionKind, ScreenTransitionOptions> {
    const { decorativeMotionEnabled, motion } = useTheme();
    const { screen, screenSlide } = motion;

    return useMemo(() => {
        const context = { decorativeMotionEnabled, motion: { screen, screenSlide } };
        return {
            contextSwitch: screenTransition('contextSwitch', context),
            drillIn: screenTransition('drillIn', context),
            modalFlow: screenTransition('modalFlow', context),
            reader: screenTransition('reader', context),
        };
    }, [decorativeMotionEnabled, screen, screenSlide]);
}
