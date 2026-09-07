/**
 * Pub/sub de "sessão expirou" — espelho do canal usado no mobile.
 *
 * Direção FSD correta: o interceptor HTTP (shared) emite; o AuthProvider
 * (features/auth) assina e reage (zera o user, toast, redirect). Assim o
 * shared nunca importa de features.
 */
type AuthExpiredListener = () => void;

const listeners = new Set<AuthExpiredListener>();

export const subscribeAuthExpired = (listener: AuthExpiredListener): (() => void) => {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
};

export const notifyAuthExpired = (): void => {
    listeners.forEach(listener => listener());
};
