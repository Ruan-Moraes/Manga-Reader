import { useEffect, useState } from 'react';

/** Retorna `value` com atraso de `delay` ms — para typeahead/busca. */
export const useDebouncedValue = <T>(value: T, delay = 300): T => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
};

export default useDebouncedValue;
