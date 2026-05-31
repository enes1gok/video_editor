import React from 'react';
import { cn } from '../utils/cn';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'ai';

const VARIANTS: Record<BadgeVariant, string> = {
    neutral: 'bg-surface-2 text-text-2',
    accent: 'bg-accent-muted text-accent',
    success: 'bg-success-muted text-success',
    danger: 'bg-danger-muted text-danger',
    warning: 'bg-warning-muted text-warning',
    ai: 'bg-ai-muted text-ai',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className, ...props }) => (
    <span
        className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-semibold tracking-wide uppercase',
            VARIANTS[variant],
            className,
        )}
        {...props}
    />
);
