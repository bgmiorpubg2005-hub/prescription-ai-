
import React, { useState, useRef } from 'react';
import { UploadIcon, XMarkIcon, PdfIcon } from './IconComponents';
import { FileInput } from '../types';

interface FileUploadProps {
  onAnalyze: (files: FileInput[]) => void;
  isLoading: boolean;
  clearResults: () => void;
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string; // Data URL
}

const FileUpload: React.FC<FileUploadProps> = ({ onAnalyze, isLoading, clearResults }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      clearResults();
      const newFiles = Array.from(event.target.files);
      
      const filePromises = newFiles.map(file => new Promise<UploadedFile>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: reader.result as string
          });
        };
        reader.readAsDataURL(file);
      }));

      const processedFiles = await Promise.all(filePromises);
      setUploadedFiles(prev => [...prev, ...processedFiles]);
      
      // Reset input so same files can be selected again
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering the upload click
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
      clearResults();
  };

  const handleAnalyzeClick = () => {
    if (uploadedFiles.length > 0) {
        const inputs: FileInput[] = uploadedFiles.map(f => ({
            data: f.preview.split(',')[1], // Extract base64 content
            mimeType: f.file.type
        }));
        onAnalyze(inputs);
    }
  };
  
  const handleClearAll = () => {
      setUploadedFiles([]);
      clearResults();
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface dark:bg-darkSurface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      
      {/* Upload Drop Zone */}
      <div 
            onClick={triggerFileSelect}
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors relative"
        >
            <UploadIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Click to upload files</p>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-1">
                Supported: Images (JPG, PNG) & PDF <br/>
                Upload multiple files at once
            </p>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/png, image/jpeg, image/webp, application/pdf"
      />

      {/* Preview Grid */}
      {uploadedFiles.length > 0 && (
          <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Selected Documents ({uploadedFiles.length})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {uploadedFiles.map((item) => (
                      <div key={item.id} className="relative group rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden bg-gray-50 dark:bg-slate-800 aspect-square flex items-center justify-center">
                          {item.file.type === 'application/pdf' ? (
                              <div className="flex flex-col items-center p-2 text-center">
                                  <PdfIcon className="w-10 h-10 text-red-500 mb-2" />
                                  <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 break-all">
                                      {item.file.name}
                                  </span>
                              </div>
                          ) : (
                              <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          
                          <button 
                            onClick={(e) => handleRemove(item.id, e)}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <XMarkIcon className="w-4 h-4" />
                          </button>
                      </div>
                  ))}
                  
                  {/* Add more button within grid */}
                  <div 
                    onClick={triggerFileSelect}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors aspect-square"
                  >
                      <span className="text-2xl text-gray-400">+</span>
                      <span className="text-xs text-gray-500 mt-1">Add More</span>
                  </div>
              </div>
          </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
        <button
            onClick={handleAnalyzeClick}
            disabled={uploadedFiles.length === 0 || isLoading}
            className="w-full sm:w-auto text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:ring-primary-light font-medium rounded-lg text-md px-8 py-3 text-center transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Documents'}
        </button>
        
        {uploadedFiles.length > 0 && (
             <button
                onClick={handleClearAll}
                disabled={isLoading}
                className="w-full sm:w-auto text-secondary dark:text-darkText bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 focus:ring-4 focus:ring-gray-300 dark:focus:ring-slate-500 font-medium rounded-lg text-md px-8 py-3 text-center transition-all duration-300 disabled:opacity-50"
            >
            Clear All
            </button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
