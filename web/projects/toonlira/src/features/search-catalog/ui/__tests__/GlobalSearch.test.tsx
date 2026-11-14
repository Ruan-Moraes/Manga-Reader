import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import { server } from '@/test/mocks/server';

import { STORAGE_KEY, addRecentSearch } from '../../model/recentSearchStorage';
import GlobalSearch from '../GlobalSearch';

const wrapSuggestions = <T,>(items: T[]) => ({
    success: true,
    data: {
        sections: items.length > 0 ? [{ type: 'TITLE', totalElements: items.length, items }] : [],
        totalElements: items.length,
    },
});

const result = {
    id: 'berserk',
    slug: null,
    entityType: 'TITLE',
    name: 'Berserk',
    image: null,
    matchedBy: 'PRIMARY_NAME',
    matchedText: 'Berserk',
    roles: [],
    workCount: 0,
    titleType: 'MANGA',
    titleStatus: 'ONGOING',
    adult: false,
    primaryContributor: 'Kentaro Miura',
    country: null,
};

describe('GlobalSearch', () => {
    beforeEach(() => localStorage.clear());

    it('não possui violações axe com o dropdown aberto', async () => {
        addRecentSearch('Vagabond');
        const { container } = renderWithProviders(<GlobalSearch onNavigate={vi.fn()} />);

        await userEvent.click(screen.getByRole('combobox', { name: /buscar/i }));
        await screen.findByRole('option', { name: /one piece/i });

        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('abre com sugestões reais e buscas recentes', async () => {
        addRecentSearch('Vagabond');
        renderWithProviders(<GlobalSearch onNavigate={vi.fn()} />);

        await userEvent.click(screen.getByRole('combobox', { name: /buscar/i }));

        expect(await screen.findByRole('option', { name: /one piece/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /vagabond/i })).toBeInTheDocument();
    });

    it('orienta termos curtos sem consultar o endpoint', async () => {
        let requests = 0;
        server.use(http.get('*/api/search/suggestions', () => {
            requests += 1;
            return HttpResponse.json(wrapSuggestions([result]));
        }));
        renderWithProviders(<GlobalSearch onNavigate={vi.fn()} />);

        await userEvent.type(screen.getByRole('combobox', { name: /buscar/i }), 'b');

        expect(screen.getByText(/pelo menos 2 caracteres/i)).toBeInTheDocument();
        expect(requests).toBe(0);
    });

    it('aplica debounce, permite navegar por teclado e registra o termo', async () => {
        const onNavigate = vi.fn();
        server.use(http.get('*/api/search/suggestions', () => HttpResponse.json(wrapSuggestions([result]))));
        renderWithProviders(<GlobalSearch onNavigate={onNavigate} />);
        const input = screen.getByRole('combobox', { name: /buscar/i });

        await userEvent.type(input, 'Berserk');
        const [option] = await screen.findAllByRole('option', undefined, { timeout: 1500 });
        expect(option).toBeInTheDocument();

        await userEvent.keyboard('{ArrowDown}{Enter}');

        expect(onNavigate).toHaveBeenCalledWith('/titles/berserk');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual(['Berserk']);
        expect(input).toHaveValue('');
        expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('envia Enter sem opção ativa para a página completa e permite tentar novamente após erro', async () => {
        const onNavigate = vi.fn();
        let requests = 0;
        server.use(http.get('*/api/search/suggestions', () => {
            requests += 1;
            return requests === 1
                ? HttpResponse.json({ success: false }, { status: 500 })
                : HttpResponse.json(wrapSuggestions([result]));
        }));
        renderWithProviders(<GlobalSearch onNavigate={onNavigate} />);
        const input = screen.getByRole('combobox', { name: /buscar/i });

        await userEvent.type(input, 'Berserk');
        await userEvent.click(await screen.findByRole('button', { name: /tentar novamente/i }, { timeout: 1500 }));
        expect((await screen.findAllByRole('option'))[0]).toHaveTextContent('Berserk');

        fireEvent.mouseEnter(screen.getByRole('option', { name: /todos os resultados/i }));
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(input).toHaveAttribute('aria-expanded', 'false');

        await userEvent.click(input);
        await userEvent.keyboard('{Enter}');
        expect(onNavigate).toHaveBeenCalledWith('/search?q=Berserk');
    });

    it('fecha ao clicar fora e o atalho foca apenas uma instância visível', async () => {
        const rectangles = [{ width: 10 }] as unknown as DOMRectList;
        vi.spyOn(HTMLInputElement.prototype, 'getClientRects')
            .mockReturnValueOnce(rectangles)
            .mockReturnValueOnce([] as unknown as DOMRectList);
        renderWithProviders(
            <div>
                <GlobalSearch onNavigate={vi.fn()} />
                <GlobalSearch onNavigate={vi.fn()} />
                <button type="button">Fora</button>
            </div>,
        );

        fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
        await waitFor(() => expect(screen.getAllByRole('combobox')[0]).toHaveFocus());

        await userEvent.click(screen.getByRole('button', { name: 'Fora' }));
        expect(screen.getAllByRole('combobox')[0]).toHaveAttribute('aria-expanded', 'false');
    });

    it('fecha com Tab sem impedir a navegação de foco padrão', async () => {
        renderWithProviders(
            <div>
                <GlobalSearch onNavigate={vi.fn()} />
                <button type="button">Próximo</button>
            </div>,
        );
        const input = screen.getByRole('combobox', { name: /buscar/i });
        await userEvent.click(input);

        await userEvent.tab();

        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'Próximo' })).toHaveFocus();
    });
});
