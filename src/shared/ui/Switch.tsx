import React from 'react';
import { cn } from '../utils/cn';

export interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    'aria-label': string;
    disabled?: boolean;
    className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled, className, ...rest }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={rest['aria-label']}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
            'relative inline-flex h-6 w-10 shrink-0 items-center rounded-pill transition-colors disabled:opacity-50',
            checked ? 'bg-accent' : 'bg-border',
            className,
        )}
    >
        <span
            className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                checked ? 'translate-x-5' : 'translate-x-1',
            )}
        />
    </button>
);
