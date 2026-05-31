import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export type IconButtonVariant = 'ghost' | 'solid' | 'subtle' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<IconButtonVariant, string> = {
    ghost: 'text-text-2 hover:bg-surface-2',
    solid: 'bg-accent text-accent-fg hover:bg-accent-hover shadow-control',
    subtle: 'bg-surface-2 text-text-2 hover:bg-border',
    danger: 'text-danger hover:bg-danger-muted',
};

// Hit targets stay >= 32px even when the icon is small (a11y).
const SIZES: Record<IconButtonSize, string> = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
};

const ICON_SIZE: Record<IconButtonSize, number> = { sm: 16, md: 18, lg: 20 };

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    icon: LucideIcon;
    /** Required — icon-only buttons must be labelled for screen readers. */
    'aria-label': string;
    variant?: IconButtonVariant;
    size?: IconButtonSize;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { icon: Icon, variant = 'ghost', size = 'md', className, ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center rounded-control transition-all active:scale-95',
                'disabled:opacity-40 disabled:pointer-events-none',
                SIZES[size],
                VARIANTS[variant],
                className,
            )}
            {...props}
        >
            <Icon size={ICON_SIZE[size]} />
        </button>
    );
});
