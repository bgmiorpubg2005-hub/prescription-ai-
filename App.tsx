
import React, { useState } from 'react';
import { AnalysisType, PrescriptionData, LabReportData } from './types';
import { analyzePrescription, analyzeLabReport } from './services/geminiService';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import PrescriptionResult from './components/PrescriptionResult';
import LabReportResult from './components/LabReportResult';
import Spinner from './components/Spinner';
import { PrescriptionIcon, LabReportIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.Prescription);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [labReportData, setLabReportData] = useState<LabReportData | null>(null);

  const clearResults = () => {
    setPrescriptionData(null);
    setLabReportData(null);
    setError(null);
  };

  const handleAnalyze = async (imageData: string, mimeType: string) => {
    setIsLoading(true);
    clearResults();

    try {
      if (analysisType === AnalysisType.Prescription) {
        const data = await analyzePrescription(imageData, mimeType);
        if (!data.is_document_valid) {
          setError('The uploaded document does not appear to be a prescription. Please upload the correct document type.');
          setIsLoading(false);
          return;
        }
        setPrescriptionData(data);
      } else {
        const data = await analyzeLabReport(imageData, mimeType);
        if (!data.is_document_valid) {
          setError('The uploaded document does not appear to be a lab report. Please upload the correct document type.');
          setIsLoading(false);
          return;
        }
        setLabReportData(data);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during analysis. Please try again with a clearer image.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = () => {
    if (isLoading) {
      return <div className="mt-8"><Spinner /></div>;
    }
    if (error) {
      return <div className="mt-8 text-center text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-lg">{error}</div>;
    }
    if (analysisType === AnalysisType.Prescription && prescriptionData) {
      return <PrescriptionResult data={prescriptionData} />;
    }
    if (analysisType === AnalysisType.LabReport && labReportData) {
      return <LabReportResult data={labReportData} />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background dark:bg-darkBackground text-text dark:text-darkText">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-secondary dark:text-darkHeading mb-2">Upload Your Medical Document</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Select the document type and upload an image to get an AI-powered analysis and personalized health insights.</p>
        </div>
        
        <div className="flex justify-center mb-6">
            <div className="flex p-1 bg-gray-200 dark:bg-slate-700 rounded-full">
                <button
                    onClick={() => { setAnalysisType(AnalysisType.Prescription); clearResults(); }}
                    className={`flex items-center justify-center w-40 sm:w-48 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${analysisType === AnalysisType.Prescription ? 'bg-primary text-white shadow' : 'text-gray-600 dark:text-slate-300'}`}
                >
                    <PrescriptionIcon className="mr-2" /> Prescription
                </button>
                <button
                    onClick={() => { setAnalysisType(AnalysisType.LabReport); clearResults(); }}
                    className={`flex items-center justify-center w-40 sm:w-48 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${analysisType === AnalysisType.LabReport ? 'bg-primary text-white shadow' : 'text-gray-600 dark:text-slate-300'}`}
                >
                    <LabReportIcon className="mr-2" /> Lab Report
                </button>
            </div>
        </div>

        <FileUpload onAnalyze={handleAnalyze} isLoading={isLoading} clearResults={clearResults} />
        
        <div className="mt-6">
          {renderResult()}
        </div>
      </main>
      <footer className="text-center py-4 mt-8 border-t border-gray-200 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} MediScan AI. For informational purposes only.</p>
      </footer>
    </div>
  );
};

export default App;