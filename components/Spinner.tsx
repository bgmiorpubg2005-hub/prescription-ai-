
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-dark"></div>
      <p className="text-lg font-medium text-secondary">Analyzing Document...</p>
    </div>
  );
};

export default Spinner;
