import { useEffect, useState } from 'react';

export interface Countdown {
    d: number;
    h: number;
    m: number;
    s: number;
}

/**
 * Contagem regressiva ao vivo até `targetIso` (data `YYYY-MM-DD`, fim do dia).
 * Atualiza a cada 1s e limpa o interval no unmount. Retorna `null` quando zera.
 */
export const useCountdown = (targetIso: string): Countdown | null => {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const target = new Date(`${targetIso}T23:59:59`);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return null;

    return {
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1000),
    };
};

export default useCountdown;
