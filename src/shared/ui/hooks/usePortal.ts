import { useEffect, useState } from 'react';

/** Creates a detached <div> appended to <body> for portal rendering. */
export function usePortal(): HTMLElement | null {
    const [container] = useState<HTMLElement | null>(() =>
        typeof document === 'undefined' ? null : document.createElement('div')
    );

    useEffect(() => {
        if (!container) return;
        document.body.appendChild(container);
        return () => {
            document.body.removeChild(container);
        };
    }, [container]);

    return container;
}
