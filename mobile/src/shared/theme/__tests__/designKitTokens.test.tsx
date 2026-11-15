import { renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import {
    createShadowStyle,
    darkHighContrastTokens,
    lightHighContrastTokens,
    METRIC_SCALES,
    MOTION_DURATIONS,
    MOTION_EASING,
    resolveMotionDurations,
    SHADOWS,
} from '../appearance';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { darkTokens, lightTokens, type ThemeTokens } from '../tokens';

type Rgb = [number, number, number];

function parseColor(value: string): { rgb: Rgb; alpha: number } {
    const hex = /^#([0-9a-f]{6})$/i.exec(value);

    if (hex) {
        const int = parseInt(hex[1], 16);

        return { rgb: [(int >> 16) & 255, (int >> 8) & 255, int & 255], alpha: 1 };
    }

    const rgba = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(value);

    if (!rgba) throw new Error(`Unsupported color ${value}`);

    return { rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])], alpha: rgba[4] === undefined ? 1 : Number(rgba[4]) };
}

function blend(top: string, bottom: string): Rgb {
    const upper = parseColor(top);
    const lower = parseColor(bottom).rgb;

    return upper.rgb.map((channel, index) => channel * upper.alpha + lower[index] * (1 - upper.alpha)) as Rgb;
}

function luminance([r, g, b]: Rgb): number {
    const linear = [r, g, b].map(channel => {
        const value = channel / 255;

        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: Rgb, background: Rgb): number {
    const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);

    return (light + 0.05) / (dark + 0.05);
}

const palettes: [string, ThemeTokens][] = [
    ['light', lightTokens],
    ['dark', darkTokens],
    ['light high contrast', lightHighContrastTokens],
    ['dark high contrast', darkHighContrastTokens],
];

describe('MOB-FEAT-057 design kit tokens', () => {
    it('AC-001 expõe as medidas do kit por densidade', () => {
        expect(METRIC_SCALES.COMFORTABLE).toEqual({
            icon: { sm: 16, md: 20, lg: 24 },
            iconTile: { default: 40, feature: 48 },
            row: { single: 56, double: 64 },
            control: { compact: 40, default: 44, comfortable: 52 },
            chip: { action: 36, value: 28, count: 24 },
            rhythm: { itemGap: 12, groupGap: 24, cardPadding: 16 },
            accentBar: { width: 4, height: 16 },
        });
        expect(METRIC_SCALES.COMPACT.rhythm).toEqual({ itemGap: 8, groupGap: 18, cardPadding: 12 });
        expect(METRIC_SCALES.COMPACT.row).toEqual(METRIC_SCALES.COMFORTABLE.row);
        expect(SHADOWS).toEqual({
            card: { offsetY: 8, opacity: 0.12, radius: 18, elevation: 3 },
            sheet: { offsetY: -8, opacity: 0.28, radius: 22, elevation: 18 },
        });
        expect(createShadowStyle('sheet', darkTokens.overlay)).toEqual({
            shadowColor: darkTokens.overlay,
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.28,
            shadowRadius: 22,
            elevation: 18,
        });
        expect(MOTION_DURATIONS).toEqual({ instant: 0, fast: 120, base: 200, sheet: 280, exit: 180, pulse: 1200, screen: 140, screenSlide: 220 });
        expect(resolveMotionDurations(false)).toBe(MOTION_DURATIONS);
    });

    it('AC-009 zera todas as durações com movimento reduzido e mantém a saída mais curta que a entrada', () => {
        const reduced = resolveMotionDurations(true);

        expect(Object.keys(reduced).sort()).toEqual(Object.keys(MOTION_DURATIONS).sort());
        expect(Object.values(reduced).every(duration => duration === 0)).toBe(true);
        expect(MOTION_DURATIONS.exit).toBeLessThan(MOTION_DURATIONS.sheet);
        expect(Object.values(MOTION_DURATIONS).every(duration => duration <= 300 || duration === MOTION_DURATIONS.pulse)).toBe(true);
    });

    it('define curvas de movimento que começam em 0 e terminam em 1', () => {
        expect(Object.keys(MOTION_EASING).sort()).toEqual(['enter', 'exit', 'pulse', 'standard']);
        for (const easing of Object.values(MOTION_EASING)) {
            expect(easing(0)).toBeCloseTo(0);
            expect(easing(1)).toBeCloseTo(1);
        }
        expect(MOTION_EASING.enter(0.5)).toBeGreaterThan(0.5);
        expect(MOTION_EASING.exit(0.5)).toBeLessThan(0.5);
    });

    it('AC-001 entrega medidas e movimento pelo contexto do tema', () => {
        const compact = ({ children }: PropsWithChildren) => (
            <ThemeProvider density="COMPACT" reduceMotion>
                {children}
            </ThemeProvider>
        );
        const { result } = renderHook(() => useTheme(), { wrapper: compact });

        expect(result.current.metrics).toBe(METRIC_SCALES.COMPACT);
        expect(result.current.shadows).toBe(SHADOWS);
        expect(result.current.motion).toEqual({ instant: 0, fast: 0, base: 0, sheet: 0, exit: 0, pulse: 0, screen: 0, screenSlide: 0 });

        const comfortable = renderHook(() => useTheme(), { wrapper: ({ children }: PropsWithChildren) => <ThemeProvider>{children}</ThemeProvider> });

        expect(comfortable.result.current.metrics).toBe(METRIC_SCALES.COMFORTABLE);
        expect(comfortable.result.current.motion).toBe(MOTION_DURATIONS);
    });

    it.each(palettes)('AC-002 define superfícies suaves com texto AA na paleta %s', (_name, tokens) => {
        const pairs: [string, string][] = [
            [tokens.dangerSoft, tokens.danger],
            [tokens.successSoft, tokens.success],
            [tokens.warnSoft, tokens.warn],
        ];

        pairs.forEach(([soft, tone]) => {
            expect(soft).toEqual(expect.any(String));

            const background = blend(soft, tokens.bg);

            expect(contrast(parseColor(tone).rgb, background)).toBeGreaterThanOrEqual(4.5);
        });
    });

    it.each(palettes)('superfície de hover fica entre surface e surfacePressed com texto AA na paleta %s', (_name, tokens) => {
        const brightness = (color: string) => luminance(parseColor(color).rgb);
        const [low, high] = [brightness(tokens.surface), brightness(tokens.surfacePressed)].sort((a, b) => a - b);

        expect(brightness(tokens.surfaceHover)).toBeGreaterThan(low);
        expect(brightness(tokens.surfaceHover)).toBeLessThan(high);
        expect(contrast(parseColor(tokens.text).rgb, parseColor(tokens.surfaceHover).rgb)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(parseColor(tokens.accentText).rgb, parseColor(tokens.surfaceHover).rgb)).toBeGreaterThanOrEqual(4.5);
    });
});
