import React from 'react';
import { Upload, FileType, AlertCircle, Loader2, PlayCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onDemoLoad: () => void;
  isLoading: boolean;
  error: string | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, onDemoLoad, isLoading, error }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          {isLoading ? (
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-blue-600" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {isLoading ? 'Processing Data...' : 'Upload Generation Data'}
        </h2>
        
        <p className="text-gray-500 mb-8 leading-relaxed">
          Upload your daily solar power generation CSV file to visualize Performance Ratio (PR) analysis instantly.
          <br />
          <span className="text-xs text-gray-400">All processing happens in your browser.</span>
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-left animate-fadeIn">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Main Upload Button */}
          <div className="relative group">
            <label
              htmlFor="file-upload"
              className={`
                relative w-full flex items-center justify-center px-6 py-4
                overflow-hidden font-bold text-white transition-all rounded-xl
                ${isLoading 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/30 cursor-pointer transform hover:-translate-y-0.5'}
              `}
            >
              <span className="relative flex items-center">
                <FileType className="mr-2 h-5 w-5" />
                Select CSV File
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleChange}
                disabled={isLoading}
              />
            </label>
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-medium">Or try with</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Demo Button */}
          <button
            onClick={onDemoLoad}
            disabled={isLoading}
            className={`
              w-full flex items-center justify-center px-6 py-3
              border-2 border-dashed border-gray-300 rounded-xl
              text-gray-600 font-medium transition-all
              ${isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'}
            `}
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Load Demo Data
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-400">
          Supported format: .csv (UTF-8)
        </div>
      </div>
    </div>
  );
};
