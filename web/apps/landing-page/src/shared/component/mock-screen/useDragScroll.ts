import { useRef, type PointerEvent } from 'react';

/**
 * Hook para rolagem vertical com arrasto de ponteiro (mouse/touch) em mockups.
 */
export function useDragScroll<T extends HTMLElement>() {
    const scrollRef = useRef<T>(null);
    const drag = useRef({ active: false, startY: 0, startTop: 0 });
    const rafId = useRef<number | null>(null);

    const onPointerDown = (e: PointerEvent<T>) => {
        const el = scrollRef.current;
        if (!el) return;
        drag.current = {
            active: true,
            startY: e.clientY,
            startTop: el.scrollTop,
        };
        el.setPointerCapture(e.pointerId);
        el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent<T>) => {
        const el = scrollRef.current;
        if (!el || !drag.current.active) return;
        const targetScroll =
            drag.current.startTop - (e.clientY - drag.current.startY);

        if (rafId.current === null) {
            rafId.current = requestAnimationFrame(() => {
                if (scrollRef.current && drag.current.active) {
                    scrollRef.current.scrollTop = targetScroll;
                }
                rafId.current = null;
            });
        }
    };

    const endDrag = (e: PointerEvent<T>) => {
        if (!drag.current.active) return;
        drag.current.active = false;
        if (rafId.current !== null) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }
        const el = scrollRef.current;
        el?.releasePointerCapture(e.pointerId);
        if (el) el.style.cursor = 'grab';
    };

    return {
        scrollRef,
        pointerEvents: {
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
        },
    };
}
