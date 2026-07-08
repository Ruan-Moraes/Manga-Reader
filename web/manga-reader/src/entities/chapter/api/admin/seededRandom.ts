/**
 * PRNG determinístico (mulberry32) + hash de string (FNV-1a).
 *
 * Usados pelo armazenamento provisório para gerar seeds e métricas estáveis
 * entre reloads: mesma semente ⇒ mesma sequência.
 */

export const hashString = (value: string): number => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
};

export type SeededRandom = {
    /** Próximo float em [0, 1). */
    next(): number;
    /** Inteiro em [min, max] (inclusivo). */
    int(min: number, max: number): number;
    /** Escolhe um item do array. */
    pick<T>(items: T[]): T;
};

export const createSeededRandom = (seed: number): SeededRandom => {
    let state = seed >>> 0;

    const next = (): number => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    return {
        next,
        int: (min, max) => min + Math.floor(next() * (max - min + 1)),
        pick: items => items[Math.floor(next() * items.length)],
    };
};
