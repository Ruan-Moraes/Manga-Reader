import { normalizeReadingProgress } from '../../index';

describe('MOB-FEAT-005/AC-006 reading progress model', () => {
    it('accepts only a valid 1-based progress bounded by total pages', () => {
        expect(normalizeReadingProgress({ titleId: 'title-1', chapterNumber: '7.5', currentPage: 3, totalPages: 9, completed: false })).toEqual({
            titleId: 'title-1',
            chapterNumber: '7.5',
            currentPage: 3,
            totalPages: 9,
            completed: false,
        });
        expect(normalizeReadingProgress({ titleId: 'title-1', chapterNumber: 2, currentPage: 3, totalPages: 9, completed: false })).toBeNull();
        expect(normalizeReadingProgress({ titleId: 'title-1', chapterNumber: '2', currentPage: 0, totalPages: 9, completed: false })).toBeNull();
        expect(normalizeReadingProgress({ titleId: 'title-1', chapterNumber: '2', currentPage: 10, totalPages: 9, completed: false })).toBeNull();
        expect(normalizeReadingProgress({ titleId: 'title-1', chapterNumber: '2', currentPage: 1, totalPages: 0, completed: false })).toBeNull();
    });
});
