import { useCallback, useState } from 'react';

/** Seleção múltipla genérica por id (lista de capítulos e grid de páginas). */
const useChapterSelection = () => {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const toggle = useCallback((id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    /**
     * Marca/desmarca o grupo de ids informado (ex.: a página atual da tabela)
     * SEM descartar seleções feitas fora dele — a seleção sobrevive à paginação.
     */
    const toggleAll = useCallback((ids: string[]) => {
        setSelected(prev => {
            const next = new Set(prev);
            const allSelected = ids.length > 0 && ids.every(id => next.has(id));
            if (allSelected) ids.forEach(id => next.delete(id));
            else ids.forEach(id => next.add(id));
            return next;
        });
    }, []);

    const clear = useCallback(() => setSelected(new Set()), []);

    return {
        selected,
        selectedIds: [...selected],
        count: selected.size,
        isSelected: (id: string) => selected.has(id),
        toggle,
        toggleAll,
        clear,
    };
};

export default useChapterSelection;
