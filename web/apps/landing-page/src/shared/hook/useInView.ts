import { useEffect, useRef, useState, type RefObject } from 'react';

export interface UseInViewOptions extends IntersectionObserverInit {
    once?: boolean;
}

type ObserverCallback = (
    isIntersecting: boolean,
    entry: IntersectionObserverEntry,
) => void;

interface SharedObserver {
    observer: IntersectionObserver;
    callbacks: Map<Element, ObserverCallback>;
}

const observersMap = new Map<string, SharedObserver>();

function getObserverKey(options: IntersectionObserverInit): string {
    const rootMargin = options.rootMargin ?? '0px';
    const threshold = Array.isArray(options.threshold)
        ? options.threshold.join(',')
        : String(options.threshold ?? 0);
    return `${rootMargin}_${threshold}`;
}

function observeElement(
    el: Element,
    options: IntersectionObserverInit,
    callback: ObserverCallback,
): () => void {
    const key = getObserverKey(options);
    let shared = observersMap.get(key);

    if (!shared) {
        const callbacks = new Map<Element, ObserverCallback>();
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.target) {
                        const cb = callbacks.get(entry.target);
                        if (cb) cb(entry.isIntersecting, entry);
                    } else {
                        // Fallback para mocks de teste que não preenchem target
                        callbacks.forEach(cb => cb(entry.isIntersecting, entry));
                    }
                });
            },
            options,
        );

        shared = { observer, callbacks };
        observersMap.set(key, shared);
    }

    shared.callbacks.set(el, callback);
    shared.observer.observe(el);

    return () => {
        const currentShared = observersMap.get(key);
        if (!currentShared) return;

        currentShared.callbacks.delete(el);
        currentShared.observer.unobserve(el);

        if (currentShared.callbacks.size === 0) {
            currentShared.observer.disconnect();
            observersMap.delete(key);
        }
    };
}

export function useInView<T extends HTMLElement = HTMLElement>(
    options: UseInViewOptions = {},
): { ref: RefObject<T | null>; inView: boolean } {
    const {
        once = true,
        threshold = 0.12,
        rootMargin = '0px 0px -8% 0px',
        root,
    } = options;
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Se já intersectou e é apenas uma vez, não precisa reobservar
        if (once && inView) return;

        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        if (reduce || !('IntersectionObserver' in window)) {
            setInView(true);
            return;
        }

        const cleanup = observeElement(
            el,
            { threshold, rootMargin, root },
            isIntersecting => {
                if (isIntersecting) {
                    setInView(true);
                    if (once) {
                        cleanup();
                    }
                } else if (!once) {
                    setInView(false);
                }
            },
        );

        return cleanup;
    }, [once, threshold, rootMargin, root, inView]);

    return { ref, inView };
}
