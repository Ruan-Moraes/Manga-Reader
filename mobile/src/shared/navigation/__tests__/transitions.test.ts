import { Platform } from 'react-native';

import { MOTION_DURATIONS } from '@/shared/theme';

import { screenTransition, tabTransition } from '../transitions';

const motion = { screen: MOTION_DURATIONS.screen, screenSlide: MOTION_DURATIONS.screenSlide };
const on = { decorativeMotionEnabled: true, motion };
const off = { decorativeMotionEnabled: false, motion };

const originalOS = Platform.OS;
const setOS = (os: typeof Platform.OS) => Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });

describe('MOB-FEAT-069 tipos de transição', () => {
    afterEach(() => setOS(originalOS));

    it('trocas de tela são mais curtas que os elementos da tela (pedido de 2026-11-14)', () => {
        expect(MOTION_DURATIONS.screen).toBe(140);
        expect(MOTION_DURATIONS.screenSlide).toBe(220);
        expect(MOTION_DURATIONS.screen).toBeLessThan(MOTION_DURATIONS.base);
        expect(MOTION_DURATIONS.screenSlide).toBeLessThan(MOTION_DURATIONS.sheet);
    });

    it('AC-001 no iOS: fade curto na troca de módulo e no leitor; ir mais fundo com simple_push curto; fluxo sobe de baixo', () => {
        setOS('ios');
        expect(screenTransition('contextSwitch', on)).toEqual({ animation: 'fade', animationDuration: 140 });
        expect(screenTransition('drillIn', on)).toEqual({ animation: 'simple_push', animationDuration: 220, fullScreenGestureEnabled: true });
        expect(screenTransition('modalFlow', on)).toEqual({ animation: 'slide_from_bottom', animationDuration: 220, fullScreenGestureEnabled: false });
        expect(screenTransition('reader', on)).toEqual({ animation: 'fade', animationDuration: 140, fullScreenGestureEnabled: false });
    });

    it('AC-001 no Android ir mais fundo desliza da direita com a duração do sistema', () => {
        setOS('android');
        expect(screenTransition('drillIn', on)).toEqual({ animation: 'slide_from_right', fullScreenGestureEnabled: true });
    });

    it('AC-001 com animações desligadas nenhuma tela anima, mas os gestos continuam', () => {
        expect(screenTransition('contextSwitch', off)).toEqual({ animation: 'none' });
        expect(screenTransition('drillIn', off)).toEqual({ animation: 'none', fullScreenGestureEnabled: true });
        expect(screenTransition('modalFlow', off)).toEqual({ animation: 'none', fullScreenGestureEnabled: false });
        expect(screenTransition('reader', off)).toEqual({ animation: 'none', fullScreenGestureEnabled: false });
    });

    it('AC-004 o leitor nunca liga o gesto de voltar em tela inteira', () => {
        expect(screenTransition('reader', on).fullScreenGestureEnabled).toBe(false);
        expect(screenTransition('reader', off).fullScreenGestureEnabled).toBe(false);
    });

    it('AC-003 abas trocam com fade em motion.screen, ou sem animação', () => {
        expect(tabTransition(on)).toEqual({ animation: 'fade', transitionSpec: { animation: 'timing', config: { duration: 140 } } });
        expect(tabTransition(off)).toEqual({ animation: 'none' });
    });
});
