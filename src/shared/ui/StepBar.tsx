import React from 'react';
import { Check } from 'lucide-react';
import { useAppStore } from '../../app/store';
import { STEPS, TOTAL_STEPS } from '../../app/steps';

interface StepBarProps {
    hideLogo?: boolean;
}

export const StepBar: React.FC<StepBarProps> = ({ hideLogo }) => {
    const { currentStep, setStep, isExporting } = useAppStore();

    const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

    return (
        <div className="flex-1">
            <div className="px-6 py-2">
                <div className="flex items-center gap-8">
                    {!hideLogo && (
                        <h1 className="text-lg font-bold text-accent whitespace-nowrap select-none">PodCut</h1>
                    )}

                    <div className="flex-1 relative">
                        {/* Track + progress (inset to align with dot centers) */}
                        <div className="absolute top-4 left-4 right-4">
                            <div className="absolute inset-0 h-[3px] bg-border rounded-full" />
                            <div
                                className="absolute left-0 top-0 h-[3px] bg-accent rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {/* Step dots */}
                        <div className="relative flex justify-between">
                            {STEPS.map(({ id, shortLabel, icon: Icon }) => {
                                const isActive = currentStep === id;
                                const isCompleted = currentStep > id;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => !isExporting && setStep(id)}
                                        disabled={isExporting}
                                        aria-current={isActive ? 'step' : undefined}
                                        aria-label={`Adım ${id}: ${shortLabel}`}
                                        className={`group flex flex-col items-center gap-1.5 transition-transform duration-300 rounded-md
                                            ${isExporting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-105'}
                                            ${isActive ? 'scale-110' : ''}`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ease-out
                                                ${isActive
                                                    ? 'bg-accent text-accent-fg shadow-control ring-4 ring-accent-muted'
                                                    : isCompleted
                                                        ? 'bg-success text-white shadow-control'
                                                        : 'bg-surface-2 text-text-muted group-hover:bg-border group-hover:text-text-2'
                                                }`}
                                        >
                                            {isCompleted ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                                        </div>
                                        <span
                                            className={`text-[11px] font-semibold transition-colors duration-300
                                                ${isActive ? 'text-accent' : isCompleted ? 'text-success' : 'text-text-muted group-hover:text-text-2'}`}
                                        >
                                            {shortLabel}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
