/**
 * Base mock API utility.
 *
 * Provides a simulated network delay and typed helpers that every
 * feature-level mock service can reuse.  When the real backend is
 * ready, only the service implementations need to change — hooks
 * and components stay untouched.
 */

// ---------------------------------------------------------------------------
// Delay simulation
// ---------------------------------------------------------------------------

export const simulateDelay = (ms = 300): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Generic response wrapper
// ---------------------------------------------------------------------------

export type MockApiResponse<T> = {
    data: T;
    success: boolean;
    message?: string;
};

export const ok = <T>(data: T, message?: string): MockApiResponse<T> => ({
    data,
    success: true,
    message,
});

export const fail = <T>(data: T, message: string): MockApiResponse<T> => ({
    data,
    success: false,
    message,
});

// ---------------------------------------------------------------------------
// localStorage helpers (centralised so every service uses the same pattern)
// ---------------------------------------------------------------------------

export const getFromStorage = <T>(key: string, fallback: T): T => {
    const raw = localStorage.getItem(key);

    if (!raw) return fallback;

    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

export const saveToStorage = <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const removeFromStorage = (key: string): void => {
    localStorage.removeItem(key);
};
