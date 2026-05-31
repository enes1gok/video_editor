import React from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Padding scale. */
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
} as const;

/** An elevated surface (panel/card) using design tokens. */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
    { padding = 'md', className, ...props },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                'bg-elevated border border-border rounded-card shadow-panel',
                PADDING[padding],
                className,
            )}
            {...props}
        />
    );
});

/** Alias — "Panel" reads better for editor docks/rails. */
export const Panel = Card;
