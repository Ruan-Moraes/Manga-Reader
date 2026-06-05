import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Accessibility focus trap for modal-like overlays.
 *
 * While `active`, focuses the first focusable element inside `containerRef`,
 * keeps Tab / Shift+Tab cycling within the container, and restores focus to the
 * element that was focused before activation once it deactivates/unmounts.
 *
 * Escape-to-close stays with the caller — overlays already own that handler and
 * the close semantics differ per component.
 *
 * The container element should declare `tabIndex={-1}` so it can receive focus
 * as a fallback when it holds no focusable children.
 */
export function useFocusTrap(active: boolean, containerRef: RefObject<HTMLElement | null>) {
    useEffect(() => {
        if (!active) return;

        const container = containerRef.current;

        if (!container) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;

        const getFocusable = () =>
            Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
                el => el.tabIndex !== -1 && !el.hasAttribute('disabled'),
            );

        const items = getFocusable();

        (items[0] ?? container).focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            const focusable = getFocusable();

            if (focusable.length === 0) {
                event.preventDefault();

                container.focus();

                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const activeEl = document.activeElement;

            if (event.shiftKey && activeEl === first) {
                event.preventDefault();

                last.focus();
            } else if (!event.shiftKey && activeEl === last) {
                event.preventDefault();

                first.focus();
            }
        };

        container.addEventListener('keydown', onKeyDown);

        return () => {
            container.removeEventListener('keydown', onKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [active, containerRef]);
}

export default useFocusTrap;
