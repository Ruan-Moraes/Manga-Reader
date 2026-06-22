const authExpiredListeners = new Set<() => void>();

export const subscribeAuthExpired = (listener: () => void) => {
    authExpiredListeners.add(listener);

    return () => {
        authExpiredListeners.delete(listener);
    };
};

export const notifyAuthExpired = () => {
    for (const listener of authExpiredListeners) listener();
};
