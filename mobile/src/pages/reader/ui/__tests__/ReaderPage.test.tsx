jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('expo-image', () => {
    const Image = () => null;
    Image.prefetch = jest.fn().mockResolvedValue(true);
    return { Image };
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';

import { subscribeReadingProgressDiagnostics } from '@/src/entities/reading-progress';
import { useSessionStore } from '@/src/entities/session';
import { DEFAULT_USER_SETTINGS } from '@/src/entities/user-setting';
import { resetSettingsRuntimeForTests, useSettingsStore } from '@/src/features/manage-settings';
import { api } from '@/src/shared/api';
import i18n from '@/src/shared/i18n';
import { ThemeProvider } from '@/src/shared/theme';

import { ReaderPage } from '../ReaderPage';

const chapterEnvelope = {
    data: {
        id: 'chapter-1',
        titleId: 'title-1',
        number: '1',
        title: 'Título vindo da API',
        status: 'PUBLISHED',
        pages: [
            { id: 'page-1', order: 1, imageUrl: 'https://cdn/1', thumbnailUrl: 'https://cdn/1-t', width: 800, height: 1200 },
            { id: 'page-2', order: 2, imageUrl: 'https://cdn/2', thumbnailUrl: 'https://cdn/2-t', width: 800, height: 1300 },
            { id: 'page-3', order: 3, imageUrl: 'https://cdn/3', thumbnailUrl: 'https://cdn/3-t', width: 800, height: 1100 },
        ],
    },
};

describe('MOB-FEAT-005/AC-005/006 ReaderPage session integration', () => {
    const apiMock = new AxiosMockAdapter(api);

    beforeEach(async () => {
        apiMock.reset();
        resetSettingsRuntimeForTests();
        useSettingsStore.setState({ settings: DEFAULT_USER_SETTINGS, guestSettings: DEFAULT_USER_SETTINGS, isHydrated: true, activeIdentityEpoch: null });
        useSessionStore.setState({ user: null, tokens: null, isAuthenticated: false, identityEpoch: 0 });
        await i18n.changeLanguage('pt-BR');
    });

    afterAll(() => apiMock.restore());

    it('loads a public chapter for guest without any private progress request', async () => {
        apiMock.onGet('/titles/title-1/chapters/1/reader').reply(200, chapterEnvelope);
        const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
        const screen = render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                    <ReaderPage titleId="title-1" requestedChapter="1" />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        await waitFor(() => expect(screen.getByText('Título vindo da API')).toBeTruthy());
        await new Promise(resolve => setTimeout(resolve, 400));
        expect(apiMock.history.get.map(request => request.url)).toEqual(['/titles/title-1/chapters/1/reader']);
        expect(apiMock.history.put).toHaveLength(0);
        screen.unmount();
        await queryClient.cancelQueries();
        queryClient.clear();
    });

    it('keeps public reading, exposes GET retry and sends no PUT until hydration succeeds', async () => {
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 1, tokens: { accessToken: 'access', refreshToken: 'refresh' } });
        apiMock.onGet('/titles/title-1/chapters/7.5/reader').reply(200, { data: { ...chapterEnvelope.data, number: '7.5' } });
        apiMock.onGet('/users/me/reading-progress/title-1').replyOnce(503);
        apiMock.onPut('/users/me/reading-progress').reply(200);
        const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
        const screen = render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                    <ReaderPage titleId="title-1" requestedChapter="7.5" />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        const retry = await screen.findByRole('button', { name: 'Tentar carregar o progresso novamente' });
        expect(screen.getByText('Título vindo da API')).toBeTruthy();
        await new Promise(resolve => setTimeout(resolve, 400));
        expect(apiMock.history.put).toHaveLength(0);

        apiMock.onGet('/users/me/reading-progress/title-1').replyOnce(200, {
            data: { titleId: 'title-1', chapterNumber: '7.5', currentPage: 2, totalPages: 3, completed: false },
        });
        fireEvent.press(retry);
        await waitFor(() => expect(screen.getByTestId('reader-current-page').props.children).toBe('Página 2 de 3'));
        await waitFor(() => expect(apiMock.history.put).toHaveLength(1), { timeout: 1000 });
        expect(JSON.parse(apiMock.history.put[0].data as string)).toMatchObject({ chapterNumber: '7.5', currentPage: 2 });
        screen.unmount();
        await queryClient.cancelQueries();
        queryClient.clear();
    });

    it('remounts synchronously for a new identity and ignores the previous late GET response', async () => {
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 10, tokens: { accessToken: 'a', refreshToken: 'r' } });
        apiMock.onGet('/titles/title-1/chapters/1/reader').reply(200, chapterEnvelope);
        let resolveAccountA!: (response: [number, unknown]) => void;
        apiMock.onGet('/users/me/reading-progress/title-1').replyOnce(
            () =>
                new Promise(resolve => {
                    resolveAccountA = resolve;
                }),
        );
        apiMock.onGet('/users/me/reading-progress/title-1').replyOnce(200, {
            data: { titleId: 'title-1', chapterNumber: '1', currentPage: 2, totalPages: 3, completed: false },
        });
        apiMock.onPut('/users/me/reading-progress').reply(200);
        const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
        const screen = render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                    <ReaderPage titleId="title-1" requestedChapter="1" />
                </ThemeProvider>
            </QueryClientProvider>,
        );
        await waitFor(() => expect(apiMock.history.get.filter(request => request.url?.includes('reading-progress'))).toHaveLength(1));

        act(() => useSessionStore.setState({ identityEpoch: 11 }));
        await waitFor(() => expect(apiMock.history.get.filter(request => request.url?.includes('reading-progress'))).toHaveLength(2));
        await waitFor(() => expect(screen.getByTestId('reader-current-page').props.children).toBe('Página 2 de 3'));

        await act(async () => {
            resolveAccountA([200, { data: { titleId: 'title-1', chapterNumber: '7.5', currentPage: 3, totalPages: 3, completed: false } }]);
        });
        expect(screen.queryByText('Continuar de onde parou?')).toBeNull();
        expect(screen.getByTestId('reader-current-page').props.children).toBe('Página 2 de 3');
        screen.unmount();
        await queryClient.cancelQueries();
        queryClient.clear();
    });

    it('rejects remote 3/3 against a two-page chapter, falls back to page 1 and never persists completion from a clamp', async () => {
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 20, tokens: { accessToken: 'a', refreshToken: 'r' } });
        apiMock
            .onGet('/titles/title-1/chapters/7.5/reader')
            .reply(200, { data: { ...chapterEnvelope.data, number: '7.5', pages: chapterEnvelope.data.pages.slice(0, 2) } });
        apiMock.onGet('/users/me/reading-progress/title-1').reply(200, {
            data: { titleId: 'title-1', chapterNumber: '7.5', currentPage: 3, totalPages: 3, completed: true },
        });
        apiMock.onPut('/users/me/reading-progress').reply(200);
        const diagnostic = jest.fn();
        const unsubscribe = subscribeReadingProgressDiagnostics(diagnostic);
        const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
        const screen = render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                    <ReaderPage titleId="title-1" requestedChapter="7.5" />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId('reader-current-page').props.children).toBe('Página 1 de 2');
            expect(diagnostic).toHaveBeenCalledWith({ code: 'INVALID_READING_PROGRESS', titleId: 'title-1' });
        });
        await act(async () => new Promise(resolve => setTimeout(resolve, 450)));
        expect(apiMock.history.put).toHaveLength(0);
        unsubscribe();
        screen.unmount();
        await queryClient.cancelQueries();
        queryClient.clear();
    });

    it('reports an unavailable recent chapter and offers the requested chapter without an incorrect PUT', async () => {
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 30, tokens: { accessToken: 'a', refreshToken: 'r' } });
        apiMock.onGet('/titles/title-1/chapters/1/reader').reply(200, chapterEnvelope);
        apiMock.onGet('/titles/title-1/chapters/7.5/reader').reply(404);
        apiMock.onGet('/users/me/reading-progress/title-1').reply(200, {
            data: { titleId: 'title-1', chapterNumber: '7.5', currentPage: 1, totalPages: 3, completed: false },
        });
        const diagnostic = jest.fn();
        const unsubscribe = subscribeReadingProgressDiagnostics(diagnostic);
        const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
        const screen = render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                    <ReaderPage titleId="title-1" requestedChapter="1" />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent.press(await screen.findByText('Continuar leitura'));
        await screen.findByText('Não foi possível carregar o capítulo.');
        expect(screen.getByText('Abrir capítulo solicitado')).toBeTruthy();
        expect(diagnostic).toHaveBeenCalledWith({ code: 'INVALID_READING_PROGRESS', titleId: 'title-1' });
        await new Promise(resolve => setTimeout(resolve, 450));
        expect(apiMock.history.put).toHaveLength(0);
        unsubscribe();
        screen.unmount();
        await queryClient.cancelQueries();
        queryClient.clear();
    });
});
