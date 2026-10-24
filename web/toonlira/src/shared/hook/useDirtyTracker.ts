import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Detecta alterações não salvas comparando um snapshot serializado do estado
 * do formulário com o estado atual.
 *
 * O baseline é capturado quando `open` vira `true`. Para edição com carga
 * assíncrona, chamar `reset()` no mesmo efeito que preenche o formulário —
 * o baseline é recapturado no render seguinte, já com os dados carregados.
 */
export function useDirtyTracker(open: boolean, snapshot: unknown): { dirty: boolean; reset: () => void } {
    const serialized = JSON.stringify(snapshot);
    const baseline = useRef<string | null>(null);
    const wasOpen = useRef(false);
    const [resetPending, setResetPending] = useState(false);

    useEffect(() => {
        if (open && !wasOpen.current) {
            baseline.current = serialized;
        }

        if (!open) {
            baseline.current = null;
        }

        wasOpen.current = open;
        // Captura apenas na transição de abertura — mudanças subsequentes são exatamente o que queremos detectar.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (resetPending) {
            baseline.current = serialized;
            setResetPending(false);
        }
    }, [resetPending, serialized]);

    const reset = useCallback(() => setResetPending(true), []);

    const dirty = open && !resetPending && baseline.current !== null && baseline.current !== serialized;

    return { dirty, reset };
}

export default useDirtyTracker;
