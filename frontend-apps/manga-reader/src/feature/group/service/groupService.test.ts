import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import {
    getGroups,
    getGroupById,
    getGroupsByTitleId,
    getMemberById,
    getGroupStatusLabelKey,
    supportGroup,
    unsupportGroup,
} from './groupService';

const buildGroup = (overrides = {}) => ({
    id: 'group-1',
    name: 'Scan Group',
    username: 'scangroup',
    logo: '/logos/sg.jpg',
    banner: '/banners/sg.jpg',
    description: 'Grupo de traducao',
    website: 'https://scangroup.com',
    totalTitles: 50,
    foundedYear: 2020,
    platformJoinedAt: '2020-01-01',
    status: 'active' as const,
    members: [],
    supporters: [],
    genres: ['Action'],
    focusTags: ['shounen'],
    rating: 4.8,
    popularity: 95,
    translatedWorks: [],
    translatedTitleIds: [],
    ...overrides,
});

const buildPageResponse = (content: unknown[] = []) => ({
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    last: true,
});

describe('groupService', () => {
    describe('getGroups', () => {
        it('deve retornar pagina de grupos', async () => {
            server.use(
                http.get(`*${API_URLS.GROUPS}`, () =>
                    HttpResponse.json({
                        data: buildPageResponse([buildGroup()]),
                        success: true,
                    }),
                ),
            );

            const result = await getGroups();

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('Scan Group');
        });
    });

    describe('getGroupById', () => {
        it('deve retornar grupo pelo id', async () => {
            server.use(
                http.get(`*${API_URLS.GROUPS}/group-1`, () =>
                    HttpResponse.json({ data: buildGroup(), success: true }),
                ),
            );

            const result = await getGroupById('group-1');

            expect(result.id).toBe('group-1');
        });
    });

    describe('getGroupsByTitleId', () => {
        it('deve retornar grupos por titulo', async () => {
            server.use(
                http.get(`*${API_URLS.GROUPS}/title/title-1`, () =>
                    HttpResponse.json({
                        data: buildPageResponse([buildGroup()]),
                        success: true,
                    }),
                ),
            );

            const result = await getGroupsByTitleId('title-1');

            expect(result.content).toHaveLength(1);
        });
    });

    describe('getMemberById', () => {
        it('deve retornar membro pelo id', async () => {
            const member = { id: 'member-1', name: 'Member' };

            server.use(
                http.get(`*${API_URLS.GROUPS}/members/member-1`, () =>
                    HttpResponse.json({ data: member, success: true }),
                ),
            );

            const result = await getMemberById('member-1');

            expect(result).toEqual(member);
        });
    });

    describe('getGroups — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.GROUPS}`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getGroups()).rejects.toThrow();
        });
    });

    describe('getGroupById — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.GROUPS}/group-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getGroupById('group-1')).rejects.toThrow();
        });
    });

    describe('getGroupsByTitleId — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.GROUPS}/title/title-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getGroupsByTitleId('title-1')).rejects.toThrow();
        });
    });

    describe('getMemberById — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.GROUPS}/members/member-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getMemberById('member-1')).rejects.toThrow();
        });
    });

    describe('getGroupStatusLabelKey', () => {
        it('deve retornar status.active para active', () => {
            expect(getGroupStatusLabelKey('active')).toBe('status.active');
        });

        it('deve retornar status.inactive para inactive', () => {
            expect(getGroupStatusLabelKey('inactive')).toBe('status.inactive');
        });

        it('deve retornar status.hiatus para hiatus', () => {
            expect(getGroupStatusLabelKey('hiatus')).toBe('status.hiatus');
        });
    });

    describe('supportGroup', () => {
        it('deve apoiar grupo com sucesso', async () => {
            server.use(
                http.post(`*${API_URLS.GROUPS}/group-1/support`, () =>
                    HttpResponse.json({ data: buildGroup(), success: true }),
                ),
            );

            const result = await supportGroup('group-1');

            expect(result.id).toBe('group-1');
        });
    });

    describe('unsupportGroup', () => {
        it('deve deixar de apoiar grupo com sucesso', async () => {
            server.use(
                http.delete(`*${API_URLS.GROUPS}/group-1/support`, () =>
                    HttpResponse.json({ data: buildGroup(), success: true }),
                ),
            );

            const result = await unsupportGroup('group-1');

            expect(result.id).toBe('group-1');
        });
    });
});
