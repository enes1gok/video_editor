import { useEffect, type RefObject } from 'react';

/** Calls `handler` when a pointer/touch event lands outside `ref`. */
export function useOnClickOutside(
    ref: RefObject<HTMLElement | null>,
    handler: (e: MouseEvent | TouchEvent) => void,
    enabled = true,
) {
    useEffect(() => {
        if (!enabled) return;
        const listener = (e: MouseEvent | TouchEvent) => {
            const el = ref.current;
            if (!el || el.contains(e.target as Node)) return;
            handler(e);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler, enabled]);
}
