import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-accent-fg hover:bg-accent-hover shadow-control',
    secondary: 'bg-surface text-text-2 border border-border hover:bg-surface-2',
    ghost: 'text-text-2 hover:bg-surface-2',
    danger: 'bg-danger text-danger-fg hover:bg-danger-hover shadow-control',
    ai: 'bg-ai-muted text-ai border border-transparent hover:border-ai',
    subtle: 'bg-surface-2 text-text-2 hover:bg-border',
};

const SIZES: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-11 px-6 text-base gap-2',
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Leading icon. */
    icon?: LucideIcon;
    /** Trailing icon (e.g. an arrow). */
    iconRight?: LucideIcon;
    loading?: boolean;
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading, fullWidth, className, children, disabled, ...props },
    ref,
) {
    const iconSize = ICON_SIZE[size];
    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center font-semibold rounded-control select-none',
                'transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
                SIZES[size],
                VARIANTS[variant],
                fullWidth && 'w-full',
                className,
            )}
            {...props}
        >
            {loading ? <Loader2 size={iconSize} className="animate-spin" /> : Icon ? <Icon size={iconSize} /> : null}
            {children}
            {IconRight && !loading ? <IconRight size={iconSize} /> : null}
        </button>
    );
});
