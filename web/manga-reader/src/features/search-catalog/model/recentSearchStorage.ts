const STORAGE_KEY = 'manga-reader:global-search:recent:v1';
const MAX_RECENT_SEARCHES = 6;

export const normalizeSearchTerm = (value: string) => value.trim().replace(/\s+/g, ' ');

export const readRecentSearches = (): string[] => {
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter((item): item is string => typeof item === 'string')
            .map(normalizeSearchTerm)
            .filter(Boolean)
            .slice(0, MAX_RECENT_SEARCHES);
    } catch {
        return [];
    }
};

const persist = (items: string[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // Storage indisponível ou sem quota: a busca continua funcional.
    }
};

export const addRecentSearch = (term: string): string[] => {
    const normalized = normalizeSearchTerm(term);
    if (!normalized) return readRecentSearches();

    const next = [
        normalized,
        ...readRecentSearches().filter(item => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase()),
    ].slice(0, MAX_RECENT_SEARCHES);
    persist(next);
    return next;
};

export const removeRecentSearch = (term: string): string[] => {
    const next = readRecentSearches().filter(item => item.toLocaleLowerCase() !== term.toLocaleLowerCase());
    persist(next);
    return next;
};

export const clearRecentSearches = (): string[] => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Sem ação: o estado em memória ainda será limpo.
    }
    return [];
};

export { STORAGE_KEY, MAX_RECENT_SEARCHES };
