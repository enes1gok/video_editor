import React from 'react';
import { useAppStore } from '../../../store/useAppStore';

export const Step4Export: React.FC = () => {
    const { setStep } = useAppStore();

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <h2 className="text-2xl font-bold">Step 4: Export</h2>
            <p className="text-gray-500">Rendering options and progress will go here.</p>
            <button
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
                Back
            </button>
        </div>
    );
};
