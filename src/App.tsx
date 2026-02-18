import React from 'react';
import { Step1Input } from './components/steps/Step1Input/Step1Input';
import { Step2Sync } from './components/steps/Step2Sync/Step2Sync';
import { Step3Edit } from './components/steps/Step3Edit/Step3Edit';
import { Step4Export } from './components/steps/Step4Export/Step4Export';
import { useAppStore } from './store/useAppStore';

function App() {
  const { currentStep } = useAppStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Input />;
      case 2:
        return <Step2Sync />;
      case 3:
        return <Step3Edit />;
      case 4:
        return <Step4Export />;
      default:
        return <Step1Input />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">PodCut PWA</h1>
          <div className="flex space-x-2 text-sm font-medium">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === step
                    ? 'bg-blue-600 text-white'
                    : currentStep > step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        {renderStep()}
      </main>
    </div>
  );
}

export default App;
