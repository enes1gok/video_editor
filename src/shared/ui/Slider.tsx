import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export interface SliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    'aria-label': string;
    disabled?: boolean;
    className?: string;
}

/** Token-themed range input (native element kept for full keyboard a11y). */
export const Slider: React.FC<SliderProps> = ({ value, min, max, step = 1, onChange, disabled, className, ...rest }) => {
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
    return (
        <input
            type="range"
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-label={rest['aria-label']}
            onChange={(e) => onChange(Number(e.target.value))}
            // Filled portion via gradient; thumb styled by .range-themed in index.css
            style={{ background: `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)` }}
            className={cn('range-themed w-full disabled:opacity-50', className)}
        />
    );
};

export interface RangeFieldProps extends SliderProps {
    label: React.ReactNode;
    /** Formatted value to display (defaults to the raw value). */
    displayValue?: React.ReactNode;
    suffix?: string;
    icon?: LucideIcon;
}

/** Labelled slider: label + live value + themed track. Replaces the repeated
 *  `<label class="flex justify-between">…</label><input type=range>` pattern. */
export const RangeField: React.FC<RangeFieldProps> = ({ label, displayValue, suffix, icon: Icon, ...slider }) => (
    <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-text-2">
                {Icon ? <Icon size={13} className="text-text-muted" /> : null}
                {label}
            </span>
            <span className="font-mono text-xs text-text-2">
                {displayValue ?? slider.value}
                {suffix}
            </span>
        </div>
        <Slider {...slider} />
    </div>
);
