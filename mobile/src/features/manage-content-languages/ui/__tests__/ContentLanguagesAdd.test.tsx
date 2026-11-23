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

describe('MOB-FEAT-062 adicionar idiomas do conteúdo', () => {
    const apiMock = new AxiosMockAdapter(api);

    beforeEach(() => apiMock.reset());
    afterAll(() => apiMock.restore());

    it('AC-005 lista idiomas restantes em linhas com "+ Adicionar" e adiciona ao fim da ordem', async () => {
        useContentLanguagesStore.getState().beginAccount(1, 'pt-BR');
        useContentLanguagesStore.getState().hydrate(1, ['pt-BR']);
        apiMock.onPatch('/users/me/content-locales').reply(config => [200, { data: JSON.parse(config.data as string) }]);
        renderEditor();

        expect(screen.getAllByText('Adicionar').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: 'Adicionar Inglês' }).props.style).toEqual(expect.objectContaining({ minHeight: expect.any(Number) }));

        fireEvent.press(screen.getByRole('button', { name: 'Adicionar Inglês' }));

        await waitFor(() => expect(useContentLanguagesStore.getState().confirmed).toEqual(['pt-BR', 'en-US']));
        expect(screen.queryByRole('button', { name: 'Adicionar Inglês' })).toBeNull();
    });
});
