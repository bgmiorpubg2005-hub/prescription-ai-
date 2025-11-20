
import React, { useState, useEffect } from 'react';
import { AnalysisType, PrescriptionData, LabReportData, UserProfile, FileInput } from './types';
import { analyzePrescription, analyzeLabReport } from './services/geminiService';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import PrescriptionResult from './components/PrescriptionResult';
import LabReportResult from './components/LabReportResult';
import Spinner from './components/Spinner';
import LoginPage from './components/LoginPage';
import NotificationManager from './components/NotificationManager';
import { PrescriptionIcon, LabReportIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.Prescription);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [labReportData, setLabReportData] = useState<LabReportData | null>(null);

  // Check for logged in user on boot
  useEffect(() => {
    const storedUser = localStorage.getItem('mediscan_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (name: string, age: string, email: string) => {
    const newUser: UserProfile = { name, age, email, isLoggedIn: true };
    setUser(newUser);
    localStorage.setItem('mediscan_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mediscan_user');
    clearResults();
  };

  const clearResults = () => {
    setPrescriptionData(null);
    setLabReportData(null);
    setError(null);
  };

  const handleAnalyze = async (files: FileInput[]) => {
    setIsLoading(true);
    clearResults();

    try {
      if (analysisType === AnalysisType.Prescription) {
        const data = await analyzePrescription(files);
        if (!data.is_document_valid) {
          setError('The uploaded document does not appear to be a prescription. Please upload the correct document type.');
          setIsLoading(false);
          return;
        }
        setPrescriptionData(data);
      } else {
        const data = await analyzeLabReport(files);
        if (!data.is_document_valid) {
          setError('The uploaded document does not appear to be a lab report. Please upload the correct document type.');
          setIsLoading(false);
          return;
        }
        setLabReportData(data);
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(`Analysis failed: ${errorMessage}. Please ensure your image is clear and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = () => {
    if (isLoading) {
      return <div className="mt-8"><Spinner /></div>;
    }
    if (error) {
      return <div className="mt-8 text-center text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">{error}</div>;
    }
    if (analysisType === AnalysisType.Prescription && prescriptionData) {
      return <PrescriptionResult data={prescriptionData} />;
    }
    if (analysisType === AnalysisType.LabReport && labReportData) {
      return <LabReportResult data={labReportData} />;
    }
    return null;
  };

  // If not logged in, show Login Page
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-darkBackground text-text dark:text-darkText flex flex-col">
      <NotificationManager />
      <Header user={user} onLogout={handleLogout} />
      
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-secondary dark:text-darkHeading mb-2">Upload Medical Documents</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Select document type to get AI-powered analysis.
            </p>
        </div>
        
        <div className="flex justify-center mb-8">
            <div className="flex p-1 bg-gray-200 dark:bg-slate-700 rounded-xl shadow-inner">
                <button
                    onClick={() => { setAnalysisType(AnalysisType.Prescription); clearResults(); }}
                    className={`flex items-center justify-center w-40 sm:w-48 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${analysisType === AnalysisType.Prescription ? 'bg-white dark:bg-slate-600 text-primary dark:text-white shadow-md scale-105' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
                >
                    <PrescriptionIcon className="mr-2 w-5 h-5" /> Prescription
                </button>
                <button
                    onClick={() => { setAnalysisType(AnalysisType.LabReport); clearResults(); }}
                    className={`flex items-center justify-center w-40 sm:w-48 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${analysisType === AnalysisType.LabReport ? 'bg-white dark:bg-slate-600 text-primary dark:text-white shadow-md scale-105' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
                >
                    <LabReportIcon className="mr-2 w-5 h-5" /> Lab Report
                </button>
            </div>
        </div>

        <FileUpload onAnalyze={handleAnalyze} isLoading={isLoading} clearResults={clearResults} />
        
        <div className="mt-6 transition-all duration-500 ease-in-out">
          {renderResult()}
        </div>
      </main>
      
      <footer className="text-center py-6 mt-auto border-t border-gray-200 dark:border-gray-800 bg-surface dark:bg-darkSurface">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} MediScan AI. 
          <span className="hidden sm:inline"> • Secure Medical Analysis • </span>
          <br className="sm:hidden"/>
          <span className="text-xs opacity-75">For informational purposes only.</span>
        </p>
      </footer>
    </div>
  );
};

export default App;
