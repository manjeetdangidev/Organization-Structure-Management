import React from 'react';
import { Check } from 'lucide-react';

interface CongratulationsPageProps {
  onReset: () => void;
}

const CongratulationsPage: React.FC<CongratulationsPageProps> = ({ onReset }) => (
  <div className="text-center py-20 px-6 bg-green-50 rounded-lg border border-green-200">
    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
    </div>
    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Congratulations!</h2>
    <p className="mt-2 text-lg text-gray-600">Your labor structure has been submitted successfully.</p>
    <div className="mt-8">
      <button
        onClick={onReset}
        className="px-6 py-3 text-base font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800"
      >
        Create Another Structure
      </button>
    </div>
  </div>
);

export default CongratulationsPage;
