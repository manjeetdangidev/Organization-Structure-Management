import React from 'react';

interface StepperProps {
  steps: string[];
  activeStep: number;
  onStepClick: (stepIndex: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, activeStep, onStepClick }) => {
  return (
    <div className="w-full max-w-2xl mx-auto mt-8 px-4 sm:px-0">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-shrink-0">
              <button
                onClick={() => onStepClick(index)}
                className="flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 rounded-md p-1 transition-transform transform hover:scale-105 disabled:cursor-not-allowed"
                aria-current={index === activeStep ? 'step' : undefined}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                    index <= activeStep ? 'bg-cyan-600' : 'bg-gray-300'
                  }`}
                >
                  {index < activeStep && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <p
                  className={`mt-2 text-xs sm:text-sm text-center transition-colors ${
                    index <= activeStep ? 'text-cyan-700 font-semibold' : 'text-gray-500'
                  }`}
                >
                  {step}
                </p>
              </button>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-auto border-t-2 transition-colors duration-500 ease-in-out mx-2 sm:mx-4 ${
                  index < activeStep ? 'border-cyan-600' : 'border-gray-300'
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Stepper;