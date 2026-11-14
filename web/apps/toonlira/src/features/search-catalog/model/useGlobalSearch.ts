import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useRecentTitles } from '@entities/manga';
import { ROUTES } from '@shared/constant/ROUTES';
import { useDebouncedValue } from '@shared/hook/useDebouncedValue';

import type { GlobalSearchOption } from './globalSearch.types';
import {
    addRecentSearch,
    clearRecentSearches,
    normalizeSearchTerm,
    readRecentSearches,
    removeRecentSearch,
} from './recentSearchStorage';
import { useGlobalSearchSuggestions } from './useCatalogSearch';
import type { GlobalSearchResult } from './globalSearch.types';

const SEARCH_DELAY_MS = 350;
const RECENT_TITLE_LIMIT = 6;
const RESULTS_PER_CATEGORY = 2;

type Options = {
    onNavigate: (path: string) => void;
};

const useGlobalSearch = ({ onNavigate }: Options) => {
    const location = useLocation();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState('');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const normalizedTerm = normalizeSearchTerm(value);
    const debouncedTerm = useDebouncedValue(normalizedTerm, SEARCH_DELAY_MS);
    const isSearchable = normalizedTerm.length >= 2 && normalizedTerm.length <= 100;
    const queryReady = debouncedTerm === normalizedTerm && isSearchable;

    const suggestions = useRecentTitles(RECENT_TITLE_LIMIT);
    const search = useGlobalSearchSuggestions(queryReady ? debouncedTerm : '', RESULTS_PER_CATEGORY);

    const options = useMemo<GlobalSearchOption[]>(() => {
        if (!normalizedTerm) {
            return [
                ...(suggestions.data?.content ?? []).map(title => ({ kind: 'suggestion' as const, title })),
                ...recentSearches.map(term => ({ kind: 'recent' as const, term })),
            ];
        }
        if (!queryReady || !search.data) return [];

        const resultOptions = search.data.sections.flatMap(section =>
            section.items.map(result => ({ kind: 'result' as const, result, sectionType: section.type })),
        );
        return resultOptions.length > 0
            ? [...resultOptions, { kind: 'all' as const, term: normalizedTerm }]
            : resultOptions;
    }, [normalizedTerm, queryReady, recentSearches, search.data, suggestions.data]);

    const close = useCallback(() => {
        setOpen(false);
        setActiveIndex(-1);
    }, []);

    const resetAndClose = useCallback(() => {
        setValue('');
        close();
        inputRef.current?.blur();
    }, [close]);

    const record = useCallback((term: string) => {
        setRecentSearches(addRecentSearch(term));
    }, []);

    const navigateToAll = useCallback(
        (term: string) => {
            const normalized = normalizeSearchTerm(term);
            if (normalized.length < 2 || normalized.length > 100) return;
            record(normalized);
            onNavigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(normalized)}`);
            resetAndClose();
        },
        [onNavigate, record, resetAndClose],
    );

    const selectOption = useCallback(
        (option: GlobalSearchOption) => {
            if (option.kind === 'recent') {
                setRecentSearches(addRecentSearch(option.term));
                setValue(option.term);
                setActiveIndex(-1);
                setOpen(true);
                inputRef.current?.focus();
                return;
            }
            if (option.kind === 'all') {
                navigateToAll(option.term);
                return;
            }

            if (option.kind === 'result') {
                record(normalizedTerm);
                onNavigate(routeForResult(option.result));
            } else {
                onNavigate(ROUTES.TITLE_DETAIL(option.title.id));
            }
            resetAndClose();
        },
        [navigateToAll, normalizedTerm, onNavigate, record, resetAndClose],
    );

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown' && options.length > 0) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex(index => (index + 1) % options.length);
            return;
        }
        if (event.key === 'ArrowUp' && options.length > 0) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex(index => (index <= 0 ? options.length - 1 : index - 1));
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            const active = options[activeIndex];
            if (active) selectOption(active);
            else navigateToAll(normalizedTerm);
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            inputRef.current?.blur();
            return;
        }
        if (event.key === 'Tab') close();
    };

    const onFocus = () => {
        setRecentSearches(readRecentSearches());
        setOpen(true);
    };

    useEffect(() => {
        const onPointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) close();
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [close]);

    useEffect(() => {
        const onShortcut = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
            if (!inputRef.current || inputRef.current.getClientRects().length === 0) return;
            event.preventDefault();
            inputRef.current.focus();
            onFocus();
        };
        document.addEventListener('keydown', onShortcut);
        return () => document.removeEventListener('keydown', onShortcut);
    });

    useEffect(() => {
        close();
    }, [close, location.pathname, location.search]);

    useEffect(() => {
        setActiveIndex(-1);
    }, [normalizedTerm]);

    return {
        value,
        setValue,
        open,
        activeIndex,
        setActiveIndex,
        normalizedTerm,
        debouncedTerm,
        queryReady,
        isSearchable,
        options,
        recentSearches,
        suggestions,
        search,
        containerRef,
        inputRef,
        onFocus,
        onKeyDown,
        selectOption,
        close,
        removeRecent: (term: string) => setRecentSearches(removeRecentSearch(term)),
        clearRecents: () => setRecentSearches(clearRecentSearches()),
    };
};

const routeForResult = (result: GlobalSearchResult): string => {
    if (result.entityType === 'TITLE') return ROUTES.TITLE_DETAIL(result.id);
    if (result.entityType === 'AUTHOR') return ROUTES.AUTHOR_DETAIL(result.slug ?? result.id);
    if (result.entityType === 'ARTIST') return ROUTES.ARTIST_DETAIL(result.slug ?? result.id);
    if (result.entityType === 'PUBLISHER') return ROUTES.PUBLISHER_DETAIL(result.slug ?? result.id);
    return ROUTES.GROUP_DETAIL(result.id);
};

export default useGlobalSearch;
