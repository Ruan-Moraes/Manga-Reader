import { useState, useRef } from 'react';

const useNavSearch = (onSearchSubmit?: (q: string) => void) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const focusSearch = () => inputRef.current?.focus();

    const handleSearch = () => {
        const q = searchValue.trim();
        if (!q) return;
        onSearchSubmit?.(q);
        setSearchValue('');
        setSearchFocused(false);
        inputRef.current?.blur();
    };

    return {
        searchValue,
        setSearchValue,
        searchFocused,
        setSearchFocused,
        searchContainerRef,
        inputRef,
        handleSearch,
        focusSearch,
    };
};

export default useNavSearch;
