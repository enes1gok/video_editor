import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Traps Tab focus within `ref` while `active`, focuses the first element on
 * mount, and restores focus to the previously-focused element on unmount.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active = true) {
    useEffect(() => {
        if (!active) return;
        const el = ref.current;
        if (!el) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        const getFocusable = () =>
            Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
                (n) => n.offsetParent !== null || n === document.activeElement
            );

        getFocusable()[0]?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            const nodes = getFocusable();
            if (nodes.length === 0) return;
            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        el.addEventListener('keydown', onKeyDown);
        return () => {
            el.removeEventListener('keydown', onKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [ref, active]);
}
