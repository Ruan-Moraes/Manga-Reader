import {
    createTypographyStyles,
    darkHighContrastTokens,
    LAYOUT_SCALES,
    lightHighContrastTokens,
    minimumTouchTarget,
    RADII,
    resolveColorScheme,
    resolveDecorativeMotion,
    resolveEffectiveHighContrast,
    resolveEffectiveReduceMotion,
    resolveThemeTokens,
    SPACING_SCALES,
    TYPOGRAPHY_SCALES,
} from '../appearance';
import { darkTokens, lightTokens } from '../tokens';

describe('MOB-FEAT-002 appearance resolution', () => {
    it('resolve SYSTEM pelo esquema atual e mantém overrides estáveis', () => {
        expect(resolveColorScheme('SYSTEM', 'dark')).toBe('dark');
        expect(resolveColorScheme('SYSTEM', 'light')).toBe('light');
        expect(resolveColorScheme('SYSTEM', null)).toBe('light');
        expect(resolveColorScheme('LIGHT', 'dark')).toBe('light');
        expect(resolveColorScheme('DARK', 'light')).toBe('dark');
    });

    it('expõe todas as escalas tipográficas base e de densidade da spec', () => {
        expect(TYPOGRAPHY_SCALES).toEqual({
            COMPACT: { h1: 30, h2: 22, h3: 18, h4: 15, body: 13, small: 11, minimum: 10 },
            DEFAULT: { h1: 32, h2: 24, h3: 20, h4: 16, body: 14, small: 12, minimum: 11 },
            COMFORTABLE: { h1: 34, h2: 26, h3: 22, h4: 17, body: 15, small: 13, minimum: 12 },
        });
        expect(SPACING_SCALES.COMPACT).toEqual({ xs: 4, sm: 6, md: 12, lg: 18, xl: 24, '2xl': 36, '3xl': 48 });
        expect(SPACING_SCALES.COMFORTABLE).toEqual({ xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 });
        expect(LAYOUT_SCALES).toEqual({
            COMFORTABLE: { screenGutter: 20, sectionGap: 32, controlHeight: 52, compactControlHeight: 44 },
            COMPACT: { screenGutter: 16, sectionGap: 24, controlHeight: 52, compactControlHeight: 44 },
        });
        expect(RADII).toEqual({ sm: 8, control: 12, card: 16, feature: 24, pill: 999 });
        expect(minimumTouchTarget('ios')).toBe(44);
        expect(minimumTouchTarget('android')).toBe(48);
    });

    it('define a paleta editorial e papéis tipográficos sem tracking de leitura', () => {
        expect(lightTokens).toMatchObject({ bg: '#F6F4EE', surface: '#FFFEFA', text: '#1B1A17', accent: '#DCD629' });
        expect(darkTokens).toMatchObject({ bg: '#11110F', surface: '#1B1B18', text: '#F7F4EA', accent: '#E6E037' });

        const styles = createTypographyStyles(TYPOGRAPHY_SCALES.DEFAULT);
        expect(styles.body).toMatchObject({ fontSize: 14, letterSpacing: 0, lineHeight: 21 });
        expect(styles.eyebrow).toMatchObject({ fontSize: 11, textTransform: 'uppercase' });
        expect(styles.button.textTransform).toBeUndefined();
    });

    it('combina tema e contraste sem reutilizar a paleta da variante oposta', () => {
        expect(resolveThemeTokens('dark', false, { dark: darkTokens, light: lightTokens })).toBe(darkTokens);
        expect(resolveThemeTokens('light', false, { dark: darkTokens, light: lightTokens })).toBe(lightTokens);
        expect(resolveThemeTokens('dark', true, { dark: darkTokens, light: lightTokens })).toBe(darkHighContrastTokens);
        expect(resolveThemeTokens('light', true, { dark: darkTokens, light: lightTokens })).toBe(lightHighContrastTokens);
        expect(darkHighContrastTokens).toMatchObject({ bg: '#000000', surface: '#181818', text: '#ffffff', focus: '#fff86a' });
        expect(lightHighContrastTokens).toMatchObject({ bg: '#ffffff', surface: '#ffffff', text: '#000000', focus: '#4d4a00', link: '#333100' });
    });

    it('combina preferências manuais e do sistema para movimento, animação e contraste', () => {
        expect(resolveEffectiveReduceMotion(false, true)).toBe(true);
        expect(resolveEffectiveReduceMotion(true, false)).toBe(true);
        expect(resolveEffectiveHighContrast(false, true)).toBe(true);
        expect(resolveEffectiveHighContrast(true, false)).toBe(true);
        expect(resolveDecorativeMotion(true, false)).toBe(true);
        expect(resolveDecorativeMotion(false, false)).toBe(false);
        expect(resolveDecorativeMotion(true, true)).toBe(false);
    });
});
