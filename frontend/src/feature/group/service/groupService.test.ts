import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import {
    getGroups,
    getGroupById,
    getGroupsByTitleId,
    getMemberById,
    getGroupStatusLabel,
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

    describe('getGroupStatusLabel', () => {
        it('deve retornar Ativo para active', () => {
            expect(getGroupStatusLabel('active')).toBe('Ativo');
        });

        it('deve retornar Inativo para inactive', () => {
            expect(getGroupStatusLabel('inactive')).toBe('Inativo');
        });

        it('deve retornar Hiato para hiatus', () => {
            expect(getGroupStatusLabel('hiatus')).toBe('Hiato');
        });
    });
});
