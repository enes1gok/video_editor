import React from 'react';
import { useAppStore } from '../../../store/useAppStore';

export const Step3Edit: React.FC = () => {
    const { setStep } = useAppStore();

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <h2 className="text-2xl font-bold">Step 3: Edit & Cut</h2>
            <p className="text-gray-500">Timeline and cutting tools will go here.</p>
            <div className="flex space-x-4">
                <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                    Back
                </button>
                <button
                    onClick={() => setStep(4)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Next: Export
                </button>
            </div>
        </div>
    );
};
