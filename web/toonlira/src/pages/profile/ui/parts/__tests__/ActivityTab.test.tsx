import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import ActivityTab from '../ActivityTab';

const event = {
    id: 'event-1',
    type: 'TITLE_COMPLETED',
    payload: {
        titleId: 'title-1',
        titleName: 'Naruto',
        titleCover: 'cover.jpg',
    },
    occurredAt: '2026-07-17T12:00:00',
};

const page = {
    content: [event],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    last: true,
};

describe('ActivityTab', () => {
    it('não oferece ocultação para visitante', async () => {
        server.use(
            http.get(`*${API_URLS.USERS}/user-1/activity-feed`, () => HttpResponse.json({ success: true, data: page })),
        );

        renderWithProviders(<ActivityTab profileUserId="user-1" isOwn={false} />);

        expect(await screen.findByText('Marcou Naruto como concluído')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Ocultar' })).not.toBeInTheDocument();
    });

    it('oferece ocultação no perfil próprio', async () => {
        server.use(
            http.get(`*${API_URLS.USERS}/user-1/activity-feed`, () => HttpResponse.json({ success: true, data: page })),
        );

        renderWithProviders(<ActivityTab profileUserId="user-1" isOwn />);

        expect(await screen.findByRole('button', { name: 'Ocultar' })).toBeInTheDocument();
    });

    it('remove o evento do cache após ocultação bem-sucedida', async () => {
        let hidden = false;
        server.use(
            http.get(`*${API_URLS.USERS}/user-1/activity-feed`, () =>
                HttpResponse.json({
                    success: true,
                    data: hidden ? { ...page, content: [], totalElements: 0, totalPages: 0 } : page,
                }),
            ),
            http.delete(`*${API_URLS.USERS}/me/activity-feed/event-1`, () => {
                hidden = true;
                return new HttpResponse(null, { status: 204 });
            }),
        );
        const user = userEvent.setup();

        renderWithProviders(<ActivityTab profileUserId="user-1" isOwn />);

        await user.click(await screen.findByRole('button', { name: 'Ocultar' }));
        await user.click(screen.getByRole('button', { name: 'Sim' }));

        await waitFor(() => expect(screen.queryByText('Marcou Naruto como concluído')).not.toBeInTheDocument());
        expect(screen.getByText('Nenhuma atividade pública')).toBeInTheDocument();
    });

    it('diferencia erro de feed vazio e permite tentar novamente', async () => {
        const requests = vi.fn();
        server.use(
            http.get(`*${API_URLS.USERS}/user-1/activity-feed`, () => {
                requests();
                return HttpResponse.json({}, { status: 500 });
            }),
        );
        const user = userEvent.setup();

        renderWithProviders(<ActivityTab profileUserId="user-1" isOwn={false} />);

        expect(await screen.findByText('Não foi possível carregar o histórico de atividades.')).toBeInTheDocument();
        expect(screen.queryByText('Nenhuma atividade pública')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
        expect(requests).toHaveBeenCalledTimes(2);
    });
});
