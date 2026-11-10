import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

interface SlotStore {
    get(): ReactNode;
    set(owner: symbol, node: ReactNode): void;
    clear(owner: symbol): void;
    subscribe(listener: () => void): () => void;
}

function createSlotStore(): SlotStore {
    // The most recently mounted registrant owns the outlet, whatever order re-renders happen in.
    const entries = new Map<symbol, { order: number; node: ReactNode }>();
    const listeners = new Set<() => void>();
    let counter = 0;
    let current: ReactNode = null;
    const emit = () => {
        let winner: { order: number; node: ReactNode } | null = null;
        for (const entry of entries.values()) if (!winner || entry.order > winner.order) winner = entry;
        current = winner?.node ?? null;
        listeners.forEach(listener => listener());
    };
    return {
        get: () => current,
        set(owner, node) {
            const entry = entries.get(owner);
            entries.set(owner, { order: entry?.order ?? ++counter, node });
            emit();
        },
        clear(owner) {
            if (!entries.delete(owner)) return;
            emit();
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}

const SlotContext = createContext<SlotStore | null>(null);

/** Lets a nested panel send its primary action to a fixed footer owned by the screen (056). */
export function ActionSlotProvider({ children }: { children: ReactNode }) {
    const store = useMemo(createSlotStore, []);
    return <SlotContext.Provider value={store}>{children}</SlotContext.Provider>;
}

/** Renders the primary action registered by the visible panel, if any. */
export function ActionSlotOutlet({ fallback = null }: { fallback?: ReactNode }) {
    const store = useContext(SlotContext);
    const node = useSyncExternalStore(
        store?.subscribe ?? (() => () => undefined),
        () => store?.get() ?? null,
        () => null,
    );
    return <>{node ?? fallback}</>;
}

/** Inline outside an `ActionSlotProvider`; inside one, the action moves to the outlet. The most recently mounted one wins. */
export function PrimaryAction({ children }: { children: ReactNode }) {
    const store = useContext(SlotContext);
    const owner = useRef(Symbol('primary-action')).current;
    useEffect(() => {
        store?.set(owner, children);
    });
    useEffect(() => () => store?.clear(owner), [owner, store]);
    return store ? null : <>{children}</>;
}
