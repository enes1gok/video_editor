import React from 'react';
import { cn } from '../utils/cn';

/** A keyboard-key chip, e.g. <Kbd>Space</Kbd>. */
export const Kbd: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
    <kbd
        className={cn(
            'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5',
            'rounded-md border border-border bg-surface-2 text-text-2',
            'font-mono text-[10px] font-semibold leading-none',
            className,
        )}
        {...props}
    />
);
