import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme, getStoredTheme, resolveTheme, THEME_STORAGE_KEY } from '../applyTheme';

describe('applyTheme', () => {
    beforeEach(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = '';
        localStorage.clear();
    });

    it('adds the dark class, sets color-scheme and persists the mirror for dark', () => {
        applyTheme('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.style.colorScheme).toBe('dark');
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });

    it('removes the dark class for light', () => {
        applyTheme('dark');
        applyTheme('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    });

    it('getStoredTheme defaults to system and round-trips a stored value', () => {
        expect(getStoredTheme()).toBe('system');
        applyTheme('dark');
        expect(getStoredTheme()).toBe('dark');
    });

    it('resolveTheme returns the concrete value for explicit themes', () => {
        expect(resolveTheme('light')).toBe('light');
        expect(resolveTheme('dark')).toBe('dark');
        // 'system' resolves via matchMedia (absent in jsdom) → defaults to light
        expect(resolveTheme('system')).toBe('light');
    });
});
