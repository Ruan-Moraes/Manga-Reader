import { Animated, StyleSheet } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/shared/theme';

import { STARTUP_LOGO, STARTUP_LOGO_SIZE, STARTUP_TEXT_DELAY_MS, StartupFeedback } from '../StartupFeedback';

const appJson = require('../../../../app.json');

const theme = (node: ReactElement, reduceMotion = false) => (
    <ThemeProvider initialOverride="light" reduceMotion={reduceMotion} waitForPlatform={false}>
        {node}
    </ThemeProvider>
);

describe('abertura do app continua o splash', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('desenha o logo do splash nativo no mesmo tamanho e anuncia a etapa exata', () => {
        render(theme(<StartupFeedback label="Verificando a sessão…" title="Abrindo o Toonlira…" />));
        const splash = appJson.expo.plugins.find((plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen')[1];

        expect(STARTUP_LOGO_SIZE).toBe(splash.imageWidth);
        expect([screen.getByTestId('startup-feedback-logo').props.source].flat()).toEqual([STARTUP_LOGO]);
        expect(StyleSheet.flatten(screen.getByTestId('startup-feedback').props.style).backgroundColor).toBe(splash.backgroundColor);
        expect(screen.getByRole('progressbar').props.accessibilityLabel).toBe('Verificando a sessão…');
    });

    it('o texto só aparece depois da espera e é o mesmo em todas as etapas', () => {
        const view = render(theme(<StartupFeedback label="Carregando suas preferências…" title="Abrindo o Toonlira…" />));

        expect(screen.queryByTestId('startup-feedback-title')).toBeNull();
        act(() => jest.advanceTimersByTime(STARTUP_TEXT_DELAY_MS - 50));
        expect(screen.queryByTestId('startup-feedback-title')).toBeNull();
        act(() => jest.advanceTimersByTime(100));
        expect(screen.getByText('Abrindo o Toonlira…')).toBeOnTheScreen();

        view.rerender(theme(<StartupFeedback label="Sincronizando preferências…" title="Abrindo o Toonlira…" />));
        expect(screen.getByText('Abrindo o Toonlira…')).toBeOnTheScreen();
        expect(screen.getByRole('progressbar').props.accessibilityLabel).toBe('Sincronizando preferências…');
    });

    it('a barra desliza de um lado para o outro e fica parada com movimento reduzido', () => {
        const loop = jest.spyOn(Animated, 'loop');
        const view = render(theme(<StartupFeedback label="Abrindo" title="Abrindo o Toonlira…" />));
        expect(loop).toHaveBeenCalledTimes(1);
        view.unmount();

        loop.mockClear();
        render(theme(<StartupFeedback label="Abrindo" title="Abrindo o Toonlira…" />, true));
        expect(loop).not.toHaveBeenCalled();
        expect(screen.getByTestId('startup-feedback-bar-segment')).toBeOnTheScreen();
    });
});
