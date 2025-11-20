
import React from 'react';
import ThemeToggle from './ThemeToggle';
import { UserProfile } from '../types';

interface HeaderProps {
  user?: UserProfile | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="bg-white/20 p-1 rounded-lg">💊</span> MediScan AI
          </h1>
          {user && (
            <p className="text-primary-light text-xs sm:text-sm mt-1">
              Hello, <span className="font-semibold text-white">{user.name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && onLogout && (
            <button 
              onClick={onLogout}
              className="text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
