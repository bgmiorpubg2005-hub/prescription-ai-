
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (name: string, age: string, email: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age.trim() || !email.trim()) {
      setError('Please fill in all fields to continue');
      return;
    }
    onLogin(name, age, email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light/20 to-secondary/20 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-darkSurface rounded-2xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-sm animate-fade-in">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center text-secondary dark:text-white mb-2">
            Welcome to MediScan AI
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
            Your personal AI health assistant for prescriptions and lab reports.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Age
                    </label>
                    <input
                        type="number"
                        id="age"
                        value={age}
                        onChange={(e) => {
                        setAge(e.target.value);
                        setError('');
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="25"
                        min="0"
                        max="120"
                    />
                </div>
                <div className="col-span-2">
                     <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="john@example.com"
                    />
                </div>
            </div>

            {error && <p className="mt-2 text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              className="w-full mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition hover:-translate-y-0.5 active:translate-y-0 duration-200"
            >
              Login 
            </button>
          </form>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 px-8 py-4 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure • Private • AI-Powered
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
