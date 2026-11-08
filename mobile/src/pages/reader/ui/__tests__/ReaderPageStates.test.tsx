jest.mock('expo-router', () => ({ router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn() } }));
jest.mock('expo-image', () => {
    const Image = () => null;
    Image.prefetch = jest.fn().mockResolvedValue(true);
    return { Image };
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/entities/session';
import { DEFAULT_USER_SETTINGS } from '@/entities/user-setting';
import { resetSettingsRuntimeForTests, useSettingsStore } from '@/features/manage-settings';
import { api } from '@/shared/api';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { ReaderPage } from '../ReaderPage';

const CHAPTER_URL = '/titles/title-1/chapters/1/reader';

const chapter = (pages: unknown[]) => ({
    data: { id: 'chapter-1', titleId: 'title-1', number: '1', title: 'Capítulo da API', status: 'PUBLISHED', pages },
});

const page = { id: 'page-1', order: 1, imageUrl: 'https://cdn/1', thumbnailUrl: 'https://cdn/1-t', width: 800, height: 1200 };

describe('MOB-FEAT-058 estados do leitor de capítulos', () => {
    const apiMock = new AxiosMockAdapter(api);
    let queryClient: QueryClient;

    const renderPage = () =>
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                        <ReaderPage titleId="title-1" requestedChapter="1" />
                    </ThemeProvider>
                </QueryClientProvider>
            </SafeAreaProvider>,
        );

    beforeEach(async () => {
        apiMock.reset();
        resetSettingsRuntimeForTests();
        useSettingsStore.setState({
            readerGestures: { controlsMode: 'VISIBLE', sideTapNavigation: false },
            settings: DEFAULT_USER_SETTINGS,
            guestSettings: DEFAULT_USER_SETTINGS,
            isHydrated: true,
            activeIdentityEpoch: null,
        });
        useSessionStore.setState({ user: null, tokens: null, isAuthenticated: false, identityEpoch: 0 });
        queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
        await i18n.changeLanguage('pt-BR');
    });

    afterEach(async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
    });

    afterAll(() => apiMock.restore());

    it('AC-003 mostra o carregamento como status com rótulo', () => {
        apiMock.onGet(CHAPTER_URL).reply(() => new Promise(() => undefined));
        const screen = renderPage();

        const loading = screen.getByTestId('loading-block');
        expect(loading.props.role).toBe('status');
        expect(loading.props.accessibilityLabel).toBe('Carregando capítulo…');
        expect(screen.getByRole('button', { name: 'Sair do leitor' })).toBeTruthy();
        screen.unmount();
    });

    it('AC-004 mostra o erro como alerta e tenta de novo uma vez', async () => {
        apiMock
            .onGet(CHAPTER_URL)
            .replyOnce(500)
            .onGet(CHAPTER_URL)
            .reply(200, chapter([page]));
        const screen = renderPage();

        const error = await screen.findByTestId('state-view');
        expect(error.props.role).toBe('alert');
        expect(screen.getByText('Não foi possível carregar o capítulo.')).toBeTruthy();
        expect(screen.queryByText('Abrir capítulo solicitado')).toBeNull();

        fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));

        await waitFor(() => expect(screen.getByText('Capítulo da API')).toBeTruthy());
        expect(apiMock.history.get.filter(request => request.url === CHAPTER_URL)).toHaveLength(2);
        screen.unmount();
    });

    it('AC-005 capítulo sem páginas mostra o estado vazio com a ação de sair', async () => {
        apiMock.onGet(CHAPTER_URL).reply(200, chapter([]));
        const screen = renderPage();

        await screen.findByText('Este capítulo não possui páginas disponíveis.');
        expect(screen.getByTestId('state-view').props.role).toBe('status');
        expect(screen.getAllByRole('button', { name: 'Sair do leitor' })).toHaveLength(2);
        screen.unmount();
    });

    it('AC-005 a escolha de retomada usa os papéis tipográficos do tema', async () => {
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 40, tokens: { accessToken: 'a', refreshToken: 'r' } });
        apiMock.onGet(CHAPTER_URL).reply(200, chapter([page]));
        apiMock.onGet('/users/me/reading-progress/title-1').reply(200, {
            data: { titleId: 'title-1', chapterNumber: '3', currentPage: 2, totalPages: 3, completed: false },
        });
        const screen = renderPage();

        const title = await screen.findByRole('header', { name: 'Continuar de onde parou?' });
        expect(title.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ letterSpacing: -0.35 })]));
        expect(screen.getByText('Seu progresso mais recente está no capítulo 3, página 2.')).toBeTruthy();
        screen.unmount();
    });
});
