import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import HideActivityEventAction from '../HideActivityEventAction';

const renderAction = () =>
    render(
        <QueryClientProvider client={createTestQueryClient()}>
            <HideActivityEventAction eventId="event-1" />
        </QueryClientProvider>,
    );

describe('HideActivityEventAction', () => {
    it('permite cancelar sem chamar a API', async () => {
        const deleted = vi.fn();
        server.use(http.delete(`*${API_URLS.USERS}/me/activity-feed/event-1`, deleted));
        const user = userEvent.setup();
        renderAction();

        await user.click(screen.getByRole('button', { name: 'Ocultar' }));
        await user.click(screen.getByRole('button', { name: 'Não' }));

        expect(deleted).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Ocultar' })).toBeInTheDocument();
    });

    it('oculta o evento após confirmação bem-sucedida', async () => {
        const deleted = vi.fn();
        server.use(
            http.delete(`*${API_URLS.USERS}/me/activity-feed/event-1`, () => {
                deleted();
                return new HttpResponse(null, { status: 204 });
            }),
        );
        const user = userEvent.setup();
        renderAction();

        await user.click(screen.getByRole('button', { name: 'Ocultar' }));
        await user.click(screen.getByRole('button', { name: 'Sim' }));

        await waitFor(() => expect(deleted).toHaveBeenCalledTimes(1));
        expect(await screen.findByRole('button', { name: 'Ocultar' })).toBeInTheDocument();
    });

    it('mantém a confirmação e informa erro quando a API falha', async () => {
        server.use(http.delete(`*${API_URLS.USERS}/me/activity-feed/event-1`, () => HttpResponse.json({}, { status: 500 })));
        const user = userEvent.setup();
        renderAction();

        await user.click(screen.getByRole('button', { name: 'Ocultar' }));
        await user.click(screen.getByRole('button', { name: 'Sim' }));

        expect(await screen.findByText('Não foi possível ocultar. Tente novamente.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sim' })).toBeInTheDocument();
    });
});
