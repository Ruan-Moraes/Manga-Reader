import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    MAX_RECENT_SEARCHES,
    STORAGE_KEY,
    addRecentSearch,
    clearRecentSearches,
    normalizeSearchTerm,
    readRecentSearches,
    removeRecentSearch,
} from '../recentSearchStorage';

describe('recentSearchStorage', () => {
    beforeEach(() => localStorage.clear());

    it('normaliza espaços sem alterar a grafia do termo', () => {
        expect(normalizeSearchTerm('  One   Piece  ')).toBe('One Piece');
    });

    it('mantém o termo mais recente primeiro e deduplica sem diferenciar caixa', () => {
        addRecentSearch('One Piece');
        addRecentSearch('Naruto');

        expect(addRecentSearch(' one   piece ')).toEqual(['one piece', 'Naruto']);
    });

    it('limita o histórico a seis termos', () => {
        Array.from({ length: MAX_RECENT_SEARCHES + 2 }, (_, index) => `Termo ${index}`)
            .forEach(addRecentSearch);

        expect(readRecentSearches()).toEqual([
            'Termo 7',
            'Termo 6',
            'Termo 5',
            'Termo 4',
            'Termo 3',
            'Termo 2',
        ]);
    });

    it('remove um termo e limpa todos', () => {
        addRecentSearch('Berserk');
        addRecentSearch('Vagabond');

        expect(removeRecentSearch('BERSERK')).toEqual(['Vagabond']);
        expect(clearRecentSearches()).toEqual([]);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('tolera JSON inválido e falhas de escrita', () => {
        localStorage.setItem(STORAGE_KEY, '{invalid');
        expect(readRecentSearches()).toEqual([]);

        const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('quota');
        });
        expect(addRecentSearch('Bleach')).toEqual(['Bleach']);
        setItem.mockRestore();
    });

    it('descarta valores não textuais ao ler', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([' Naruto ', null, 2, '']));

        expect(readRecentSearches()).toEqual(['Naruto']);
    });
});
