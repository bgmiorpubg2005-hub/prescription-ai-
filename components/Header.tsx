
import React from 'react';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  return (
    <header className="bg-primary shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            MediScan AI
          </h1>
          <p className="text-primary-light mt-1">Your Personal Health Report Assistant</p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;