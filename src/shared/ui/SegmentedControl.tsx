import { type LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export interface SegmentOption<T extends string> {
    value: T;
    label: string;
    icon?: LucideIcon;
    title?: string;
}

export interface SegmentedControlProps<T extends string> {
    options: SegmentOption<T>[];
    value: T;
    onChange: (value: T) => void;
    size?: 'sm' | 'md';
    fullWidth?: boolean;
    'aria-label'?: string;
    className?: string;
}

/** A small segmented (pill group) control — e.g. layout mode toggle. */
export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    size = 'md',
    fullWidth,
    className,
    ...rest
}: SegmentedControlProps<T>) {
    const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';
    return (
        <div
            role="tablist"
            aria-label={rest['aria-label']}
            className={cn('inline-flex gap-1 p-1 rounded-control bg-surface-2 border border-border', fullWidth && 'w-full', className)}
        >
            {options.map((opt) => {
                const active = opt.value === value;
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.value}
                        role="tab"
                        aria-selected={active}
                        title={opt.title}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-all',
                            pad,
                            fullWidth && 'flex-1',
                            active ? 'bg-elevated text-accent shadow-control' : 'text-text-muted hover:text-text-2',
                        )}
                    >
                        {Icon ? <Icon size={size === 'sm' ? 12 : 14} /> : null}
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
