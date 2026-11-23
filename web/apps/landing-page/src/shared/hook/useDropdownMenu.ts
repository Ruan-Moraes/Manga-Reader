import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export function getNextMenuIndex(
    key: string,
    currentIndex: number,
    itemCount: number,
): number {
    if (currentIndex === -1) {
        return key === 'ArrowUp' || key === 'End' ? itemCount - 1 : 0;
    }
    if (key === 'Home') return 0;
    if (key === 'End') return itemCount - 1;
    if (key === 'ArrowDown') return (currentIndex + 1) % itemCount;
    if (key === 'ArrowUp') return (currentIndex - 1 + itemCount) % itemCount;
    return currentIndex;
}

export interface UseDropdownMenuOptions {
    itemCount: number;
    enabled?: boolean;
}

export function useDropdownMenu({
    itemCount,
    enabled = true,
}: UseDropdownMenuOptions) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const blurTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!open || !enabled) return;

        const onPointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open, enabled]);

    useEffect(
        () => () => {
            if (blurTimeoutRef.current !== null) {
                window.clearTimeout(blurTimeoutRef.current);
            }
        },
        [],
    );

    function closeAfterFocusLeaves() {
        if (blurTimeoutRef.current !== null) {
            window.clearTimeout(blurTimeoutRef.current);
        }

        blurTimeoutRef.current = window.setTimeout(() => {
            if (!rootRef.current?.contains(document.activeElement)) {
                setOpen(false);
            }
            blurTimeoutRef.current = null;
        }, 0);
    }

    function toggleMenu() {
        if (blurTimeoutRef.current !== null) {
            window.clearTimeout(blurTimeoutRef.current);
        }

        if (open) {
            setOpen(false);
            triggerRef.current?.focus();
            return;
        }

        setOpen(true);
    }

    function closeMenu(restoreFocus = true) {
        if (blurTimeoutRef.current !== null) {
            window.clearTimeout(blurTimeoutRef.current);
        }
        setOpen(false);
        if (restoreFocus) {
            triggerRef.current?.focus();
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeMenu(true);
            return;
        }

        if (
            !open ||
            !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
        ) {
            return;
        }

        event.preventDefault();
        const currentIndex = optionRefs.current.findIndex(
            option => option === document.activeElement,
        );
        const nextIndex = getNextMenuIndex(event.key, currentIndex, itemCount);
        optionRefs.current[nextIndex]?.focus();
    }

    return {
        open,
        setOpen,
        toggleMenu,
        closeMenu,
        rootRef,
        triggerRef,
        optionRefs,
        handleKeyDown,
        closeAfterFocusLeaves,
    };
}
