import { fireEvent, render } from '@testing-library/react-native';

import type { Chapter } from '@/src/entities/chapter';
import { DEFAULT_USER_SETTINGS } from '@/src/entities/user-setting';
import i18n from '@/src/shared/i18n';
import { ThemeProvider } from '@/src/shared/theme';

import { ChapterReader } from '../ChapterReader';

const chapter: Chapter = {
    id: 'c1',
    titleId: 't1',
    number: '1',
    title: 'Capítulo da API',
    status: 'PUBLISHED',
    pages: [
        { id: 'p1', order: 1, imageUrl: 'one', thumbnailUrl: 'one-t', width: 800, height: 1200 },
        { id: 'p2', order: 2, imageUrl: 'two', thumbnailUrl: 'two-t', width: 800, height: 1200 },
    ],
};

describe('MOB-FEAT-005/AC-002/004/008/009 chapter reader UI', () => {
    beforeEach(() => i18n.changeLanguage('pt-BR'));

    it('keeps discoverable accessible controls and does not expose unavailable quality options', () => {
        const onCurrentPageChange = jest.fn();
        const screen = render(
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ChapterReader
                    chapter={chapter}
                    settings={{ ...DEFAULT_USER_SETTINGS.reader, mode: 'PAGED' }}
                    capabilities={{ low: false, medium: false, high: false }}
                    currentPage={1}
                    controlsVisible
                    progressHydrationError={false}
                    syncStatus="idle"
                    onCurrentPageChange={onCurrentPageChange}
                    onSettingsChange={jest.fn()}
                    onToggleControls={jest.fn()}
                    onExit={jest.fn()}
                    onRetryProgress={jest.fn()}
                    onRetryProgressHydration={jest.fn()}
                />
            </ThemeProvider>,
        );

        expect(screen.getByRole('button', { name: 'Próxima página' }).props.style.minHeight).toBeGreaterThanOrEqual(44);
        fireEvent.press(screen.getByRole('button', { name: 'Próxima página' }));
        expect(onCurrentPageChange).toHaveBeenCalledWith(2);
        expect(screen.getByRole('button', { name: 'Qualidade: Automática' })).toBeTruthy();
        expect(screen.queryByRole('radio', { name: 'Baixa' })).toBeNull();
        expect(screen.queryByRole('radio', { name: 'Média' })).toBeNull();
        expect(screen.queryByRole('radio', { name: 'Alta' })).toBeNull();
        expect(screen.getByLabelText('Página 1 de 2')).toBeTruthy();
    });

    it('offers localized retry without removing loaded pages when sync is pending', () => {
        const retry = jest.fn();
        const screen = render(
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ChapterReader
                    chapter={chapter}
                    settings={DEFAULT_USER_SETTINGS.reader}
                    capabilities={{ low: false, medium: false, high: false }}
                    currentPage={1}
                    controlsVisible
                    progressHydrationError={false}
                    syncStatus="error"
                    onCurrentPageChange={jest.fn()}
                    onSettingsChange={jest.fn()}
                    onToggleControls={jest.fn()}
                    onExit={jest.fn()}
                    onRetryProgress={retry}
                    onRetryProgressHydration={jest.fn()}
                />
            </ThemeProvider>,
        );
        fireEvent.press(screen.getByRole('button', { name: 'Tentar sincronizar o progresso novamente' }));
        expect(retry).toHaveBeenCalledTimes(1);
        expect(screen.getAllByLabelText(/Página \d de 2/)).toHaveLength(2);
    });

    it('really hides navigation, keeps the toggle discoverable and uses a scrollable panel under larger text', () => {
        const screen = render(
            <ThemeProvider fontSize="COMFORTABLE" initialOverride="dark" waitForPlatform={false}>
                <ChapterReader
                    chapter={chapter}
                    settings={{ ...DEFAULT_USER_SETTINGS.reader, direction: 'RTL', mode: 'PAGED' }}
                    capabilities={{ low: false, medium: false, high: false }}
                    currentPage={1}
                    controlsVisible={false}
                    progressHydrationError={false}
                    syncStatus="idle"
                    onCurrentPageChange={jest.fn()}
                    onSettingsChange={jest.fn()}
                    onToggleControls={jest.fn()}
                    onExit={jest.fn()}
                    onRetryProgress={jest.fn()}
                    onRetryProgressHydration={jest.fn()}
                />
            </ThemeProvider>,
        );

        expect(screen.queryByRole('button', { name: 'Próxima página' })).toBeNull();
        expect(screen.queryByTestId('reader-navigation-controls')).toBeNull();
        expect(screen.queryByTestId('reader-controls-panel')).toBeNull();
        expect(screen.getByRole('button', { name: 'Mostrar controles' }).props.style.minHeight).toBeGreaterThanOrEqual(44);

        screen.rerender(
            <ThemeProvider fontSize="COMFORTABLE" initialOverride="dark" waitForPlatform={false}>
                <ChapterReader
                    chapter={chapter}
                    settings={{ ...DEFAULT_USER_SETTINGS.reader, direction: 'RTL', mode: 'PAGED' }}
                    capabilities={{ low: false, medium: false, high: false }}
                    currentPage={1}
                    controlsVisible
                    progressHydrationError
                    syncStatus="idle"
                    onCurrentPageChange={jest.fn()}
                    onSettingsChange={jest.fn()}
                    onToggleControls={jest.fn()}
                    onExit={jest.fn()}
                    onRetryProgress={jest.fn()}
                    onRetryProgressHydration={jest.fn()}
                />
            </ThemeProvider>,
        );

        expect(screen.getByTestId('reader-controls-panel')).toBeTruthy();
        expect(screen.getByTestId('reader-navigation-controls').props.style.flexDirection).toBe('row-reverse');
        expect(screen.getByRole('button', { name: 'Tentar carregar o progresso novamente' })).toBeTruthy();
        expect(screen.getByTestId('reader-controls-panel').props.contentContainerStyle.height).toBeUndefined();
        expect(screen.getByText('Pré-carregamento')).toBeTruthy();
        expect(screen.getByText('3 páginas')).toBeTruthy();
    });
});
