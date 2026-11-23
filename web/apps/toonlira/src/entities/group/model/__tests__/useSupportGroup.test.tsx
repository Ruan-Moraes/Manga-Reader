import { describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';
import type { Group, GroupSupporter } from '../group.types';

import useSupportGroup from '../useSupportGroup';

const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;

const wrap = <T,>(data: T) => ({ data, success: true });

const supporter = (id: string): GroupSupporter => ({ id, name: id, avatar: '', joinedAt: '2020-01-01' });

const buildGroup = (supporters: GroupSupporter[]): Group => ({
    id: 'g1',
    name: 'Scan Brasileiro',
    username: 'scan-br',
    logo: '',
    banner: '',
    description: '',
    website: '',
    totalTitles: 0,
    foundedYear: 2019,
    platformJoinedAt: '2020-01-01',
    status: 'active',
    members: [],
    supporters,
    genres: [],
    focusTags: [],
    rating: 0,
    popularity: 0,
    translatedWorks: [],
    translatedTitleIds: [],
});

vi.mock('@shared/service/session', async importOriginal => ({
    ...(await importOriginal<typeof import('@shared/service/session')>()),
    getStoredSession: () => ({ userId: 'u1' }),
    getAccessToken: () => 'token',
}));

describe('useSupportGroup', () => {
    it('segue com atualização otimista e reconcilia com o servidor', async () => {
        server.use(
            http.post(`*${API_URLS.GROUPS}/g1/support`, () => HttpResponse.json(wrap(buildGroup([supporter('me'), supporter('other')])))),
        );

        const { result } = renderHook(() => useSupportGroup('g1', 'me', { following: false, supportersCount: 1 }), { wrapper });

        act(() => {
            void result.current.toggle();
        });

        expect(result.current.following).toBe(true);
        expect(result.current.supportersCount).toBe(2);

        await waitFor(() => expect(result.current.supportersCount).toBe(2));
        expect(result.current.following).toBe(true);
    });

    it('deixa de seguir e reconcilia', async () => {
        server.use(http.delete(`*${API_URLS.GROUPS}/g1/support`, () => HttpResponse.json(wrap(buildGroup([])))));

        const { result } = renderHook(() => useSupportGroup('g1', 'me', { following: true, supportersCount: 1 }), { wrapper });

        act(() => {
            void result.current.toggle();
        });

        expect(result.current.following).toBe(false);

        await waitFor(() => expect(result.current.supportersCount).toBe(0));
    });

    it('faz rollback no erro do servidor', async () => {
        server.use(http.post(`*${API_URLS.GROUPS}/g1/support`, () => new HttpResponse(null, { status: 500 })));

        const { result } = renderHook(() => useSupportGroup('g1', 'me', { following: false, supportersCount: 1 }), { wrapper });

        act(() => {
            void result.current.toggle();
        });

        expect(result.current.following).toBe(true);

        await waitFor(() => expect(result.current.following).toBe(false));
        expect(result.current.supportersCount).toBe(1);
    });
});
