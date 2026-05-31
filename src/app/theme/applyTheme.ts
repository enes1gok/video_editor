/**
 * Theme application helpers.
 *
 * The user's choice ('light' | 'dark' | 'system') is the source of truth; it is
 * persisted authoritatively in the Zustand store (IndexedDB) AND mirrored
 * synchronously to localStorage so the inline boot script in index.html can set
 * the `.dark` class before first paint (no FOUC). `applyTheme` keeps the mirror,
 * the `<html>` class and `color-scheme` in sync.
 */

export type Theme = 'light' | 'dark' | 'system';

/** Must match the key read by the inline boot script in index.html. */
export const THEME_STORAGE_KEY = 'podcut-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
    return theme === 'system' ? getSystemTheme() : theme;
}

/** Read the persisted theme synchronously (used for initial store state). */
export function getStoredTheme(): Theme {
    try {
        const v = localStorage.getItem(THEME_STORAGE_KEY);
        if (v === 'light' || v === 'dark' || v === 'system') return v;
    } catch {
        /* localStorage unavailable (SSR / privacy mode) — fall through */
    }
    return 'system';
}

/** Apply a theme to the document and persist the localStorage mirror. */
export function applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    const resolved = resolveTheme(theme);
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        /* ignore */
    }
}

/**
 * Re-apply the theme when the OS scheme changes, but only while the user's
 * choice is 'system'. Returns an unsubscribe function.
 */
export function watchSystemTheme(getTheme: () => Theme): () => void {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mq = window.matchMedia(DARK_QUERY);
    const handler = () => {
        if (getTheme() === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
}
