import { useCallback, useEffect, useRef } from 'react';

/**
 * Retorna uma versão debounced do callback. Cada chamada reinicia o timer;
 * o callback só dispara após `delayMs` sem novas chamadas. Limpa o timer no unmount.
 *
 * Usado no auto-save do modal de perfil: campos de texto persistem 1s após a
 * última digitação, evitando um PATCH por tecla.
 */
export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delayMs: number) {
    const callbackRef = useRef(callback);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(
        () => () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        },
        [],
    );

    return useCallback(
        (...args: Args) => {
            if (timerRef.current) clearTimeout(timerRef.current);

            timerRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
        },
        [delayMs],
    );
}

export default useDebouncedCallback;
