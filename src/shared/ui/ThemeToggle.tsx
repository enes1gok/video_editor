import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '../../app/store';
import { IconButton } from './IconButton';
import { Tooltip } from './Tooltip';

/** Header control that flips between light and dark. */
export const ThemeToggle: React.FC = () => {
    // Subscribe to `theme` so the icon re-renders on change; resolve the concrete
    // appearance from the <html> class the store keeps in sync.
    const theme = useAppStore((s) => s.theme);
    const toggleTheme = useAppStore((s) => s.toggleTheme);
    void theme;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    return (
        <Tooltip content={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}>
            <IconButton
                icon={isDark ? Sun : Moon}
                aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
                variant="ghost"
                onClick={toggleTheme}
            />
        </Tooltip>
    );
};
