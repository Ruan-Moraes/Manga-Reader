import { describe, expect, it } from 'vitest';

import { removeActivityEventFromFeed } from '../useHideActivityEvent';

describe('removeActivityEventFromFeed', () => {
    it('atualiza o total global quando o evento está em uma página posterior', () => {
        const data = {
            pageParams: [0, 1],
            pages: [
                { content: [{ id: 'a' }], page: 0, size: 1, totalElements: 2, totalPages: 2, last: false },
                { content: [{ id: 'b' }], page: 1, size: 1, totalElements: 2, totalPages: 2, last: true },
            ],
        } as never;

        const result = removeActivityEventFromFeed(data, 'b');

        expect(result?.pages[0].totalElements).toBe(1);
        expect(result?.pages[1].totalElements).toBe(1);
        expect(result?.pages[1].content).toEqual([]);
    });
});
