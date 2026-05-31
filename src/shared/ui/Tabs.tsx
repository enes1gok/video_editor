import { type LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export interface TabItem<T extends string> {
    value: T;
    label: React.ReactNode;
    icon?: LucideIcon;
}

export interface TabsProps<T extends string> {
    items: TabItem<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}

/** Underline tab bar. */
export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
    return (
        <div role="tablist" className={cn('flex gap-1 border-b border-border', className)}>
            {items.map((it) => {
                const active = it.value === value;
                const Icon = it.icon;
                return (
                    <button
                        key={it.value}
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(it.value)}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors',
                            active ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-2',
                        )}
                    >
                        {Icon ? <Icon size={15} /> : null}
                        {it.label}
                    </button>
                );
            })}
        </div>
    );
}
