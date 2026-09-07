import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import { followUser, unfollowUser, getFollowers, getFollowing, getFollowedGroups } from '../followService';

const wrap = <T,>(data: T) => ({ data, success: true });

const page = <T,>(content: T[]) => ({
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    last: true,
});

const summary = (id: string, name: string) => ({
    id,
    name,
    username: name,
    photoUrl: null,
    verified: false,
});

describe('followService (DT-48)', () => {
    it('followUser envia POST e devolve o estado do follow', async () => {
        server.use(
            http.post(`*${API_URLS.USERS}/u1/follow`, () => HttpResponse.json(wrap({ following: true, followersCount: 5 }))),
        );

        const status = await followUser('u1');

        expect(status).toEqual({ following: true, followersCount: 5 });
    });

    it('unfollowUser envia DELETE e devolve o estado atualizado', async () => {
        server.use(
            http.delete(`*${API_URLS.USERS}/u1/follow`, () => HttpResponse.json(wrap({ following: false, followersCount: 4 }))),
        );

        const status = await unfollowUser('u1');

        expect(status).toEqual({ following: false, followersCount: 4 });
    });

    it('getFollowers devolve a página de resumos', async () => {
        server.use(
            http.get(`*${API_URLS.USERS}/u1/followers`, () => HttpResponse.json(wrap(page([summary('a', 'alice'), summary('b', 'bob')])))),
        );

        const result = await getFollowers('u1');

        expect(result.totalElements).toBe(2);
        expect(result.content[0].name).toBe('alice');
    });

    it('getFollowing devolve a página de resumos', async () => {
        server.use(http.get(`*${API_URLS.USERS}/u1/following`, () => HttpResponse.json(wrap(page([summary('c', 'carol')])))));

        const result = await getFollowing('u1');

        expect(result.content).toHaveLength(1);
        expect(result.content[0].username).toBe('carol');
    });

    it('getFollowedGroups devolve a lista de grupos seguidos', async () => {
        server.use(
            http.get(`*${API_URLS.USERS}/u1/followed-groups`, () =>
                HttpResponse.json(wrap([{ id: 'g1', name: 'Scan BR', username: 'scan-br', status: 'active', totalTitles: 3 }])),
            ),
        );

        const groups = await getFollowedGroups('u1');

        expect(groups).toHaveLength(1);
        expect(groups[0].username).toBe('scan-br');
    });
});
