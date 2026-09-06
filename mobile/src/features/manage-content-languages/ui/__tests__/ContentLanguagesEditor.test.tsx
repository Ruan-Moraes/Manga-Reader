import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';

import { api } from '@/shared/api';
import { ThemeProvider } from '@/shared/theme';

import { ContentLanguagesEditor, useContentLanguagesStore } from '../../index';

const renderEditor = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <ContentLanguagesEditor />
            </ThemeProvider>
        </QueryClientProvider>,
    );
};

describe('MOB-FEAT-004 ContentLanguagesEditor', () => {
    const apiMock = new AxiosMockAdapter(api);

    beforeEach(() => apiMock.reset());
    afterAll(() => apiMock.restore());

    it('fica oculto para guest', () => {
        useContentLanguagesStore.getState().beginGuest('en-US');
        renderEditor();
        expect(screen.queryByText('Idiomas do conteúdo')).toBeNull();
    });

    it('anuncia posição/fallback, expõe touch targets e impede remover pt-BR', () => {
        useContentLanguagesStore.getState().beginAccount(1, 'pt-BR');
        useContentLanguagesStore.getState().hydrate(1, ['en-US', 'pt-BR']);
        renderEditor();

        const fallbackRow = screen.getByLabelText(/Posição 2: Português \(Brasil\) fallback obrigatório/);
        const removeFallback = screen.getByLabelText('Remover Português (Brasil)');
        expect(fallbackRow).toBeOnTheScreen();
        expect(removeFallback).toBeDisabled();
        expect(removeFallback.props.style).toEqual(expect.objectContaining({ minHeight: 44, minWidth: 44 }));
        expect(screen.getByLabelText('Mover Inglês para baixo')).not.toBeDisabled();
        fireEvent.press(removeFallback);
        expect(apiMock.history.patch).toHaveLength(0);
    });

    it('preserva ordem exibida, enviada e confirmada ao mover', async () => {
        useContentLanguagesStore.getState().beginAccount(1, 'pt-BR');
        useContentLanguagesStore.getState().hydrate(1, ['pt-BR', 'en-US', 'es-ES']);
        apiMock.onPatch('/users/me/content-locales').reply(config => [200, { data: JSON.parse(config.data as string) }]);
        renderEditor();

        fireEvent.press(screen.getByLabelText('Mover Inglês para cima'));

        await waitFor(() => expect(useContentLanguagesStore.getState().confirmed).toEqual(['en-US', 'pt-BR', 'es-ES']));
        expect(JSON.parse(apiMock.history.patch[0].data as string)).toEqual({ contentLocales: ['en-US', 'pt-BR', 'es-ES'] });
        expect(screen.getByLabelText(/Posição 1: Inglês/)).toBeOnTheScreen();
    });

    it('mostra fallback e retry identificável quando a leitura falha', () => {
        useContentLanguagesStore.getState().beginAccount(1, 'en-US');
        useContentLanguagesStore.getState().failHydration(1, 'offline');
        renderEditor();

        expect(screen.getByText(/política da interface/)).toBeOnTheScreen();
        expect(screen.getByText('Tentar carregar novamente')).toBeOnTheScreen();
        expect(screen.getByLabelText(/Posição 1: Inglês/)).toBeOnTheScreen();
    });

    it('oferece retry acessível para consumidores sem confundi-lo com o retry do PATCH', () => {
        useContentLanguagesStore.getState().beginAccount(1, 'pt-BR');
        useContentLanguagesStore.getState().hydrate(1, ['en-US', 'pt-BR']);
        useContentLanguagesStore.getState().completeConsumerInvalidation(1, 'catalog unavailable');
        renderEditor();

        expect(screen.getByRole('alert')).toHaveTextContent(/preferência foi salva/);
        expect(screen.getByRole('button', { name: 'Tentar atualizar conteúdos novamente' })).not.toBeDisabled();
        expect(screen.queryByText('Tentar salvar novamente')).toBeNull();
    });
});
