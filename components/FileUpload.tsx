
import React, { useState, useRef } from 'react';
import { UploadIcon } from './IconComponents';

interface FileUploadProps {
  onAnalyze: (imageData: string, mimeType: string) => void;
  isLoading: boolean;
  clearResults: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onAnalyze, isLoading, clearResults }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        clearResults();
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyzeClick = () => {
    if (file && imagePreview) {
        const base64Data = imagePreview.split(',')[1];
        onAnalyze(base64Data, file.type);
    }
  };
  
  const handleClear = () => {
      setImagePreview(null);
      setFile(null);
      clearResults();
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface dark:bg-darkSurface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {!imagePreview ? (
        <div 
            onClick={triggerFileSelect}
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
            <UploadIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Click to upload an image</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">or drag and drop a prescription/lab report</p>
        </div>
      ) : (
        <div className="text-center">
            <img src={imagePreview} alt="Preview" className="mx-auto max-h-64 rounded-lg shadow-md mb-4"/>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />

      <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
        <button
            onClick={handleAnalyzeClick}
            disabled={!imagePreview || isLoading}
            className="w-full sm:w-auto text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:ring-primary-light font-medium rounded-lg text-md px-8 py-3 text-center transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Document'}
        </button>
        {imagePreview && (
             <button
                onClick={handleClear}
                disabled={isLoading}
                className="w-full sm:w-auto text-secondary dark:text-darkText bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 focus:ring-4 focus:ring-gray-300 dark:focus:ring-slate-500 font-medium rounded-lg text-md px-8 py-3 text-center transition-all duration-300 disabled:opacity-50"
            >
            Clear
            </button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;