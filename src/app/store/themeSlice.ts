import type { StateCreator } from 'zustand';
import type { AppState } from './index';
import { applyTheme, getStoredTheme, getSystemTheme, type Theme } from '../theme/applyTheme';

export type { Theme } from '../theme/applyTheme';

export interface ThemeSlice {
    theme: Theme;
    /** Set the theme explicitly ('light' | 'dark' | 'system'). */
    setTheme: (theme: Theme) => void;
    /** Flip between concrete light/dark (resolving 'system' first). */
    toggleTheme: () => void;
}

export const createThemeSlice: StateCreator<AppState, [], [], ThemeSlice> = (set, get) => ({
    // Initial value read synchronously so in-memory state matches the class the
    // index.html boot script already applied (avoids a flash on hydration).
    theme: getStoredTheme(),

    setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
    },

    toggleTheme: () => {
        const current = get().theme;
        const resolved = current === 'system' ? getSystemTheme() : current;
        const next: Theme = resolved === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
    },
});
