import React from 'react';

const FileUpload = ({ onFileUpload }) => {
  const handleChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
    }import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import clsx from 'clsx';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFile,
  isLoading,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null as any);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
          'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10',
          isDragActive && 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
          isDragReject && 'border-red-500 bg-red-50 dark:bg-red-900/10',
          isLoading && 'opacity-50 cursor-not-allowed',
          !isDragActive && !isDragReject && 'border-gray-300 dark:border-gray-600'
        )}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="flex items-center justify-center space-x-3">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {!isLoading && (
              <button
                onClick={clearFile}
                className="ml-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {isDragActive
                ? 'Drop the file here'
                : 'Drag and drop your spectrum file here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              or click to browse
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
              Supported formats: .txt, .csv, .xlsx (max 10MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
};
  };

  return (
    <div className="p-4 border rounded shadow bg-white dark:bg-gray-800">
      <label className="block mb-2 font-semibold">Upload Mössbauer Data (.xlsx or .txt)</label>
      <input
        type="file"
        accept=".xlsx,.txt"
        onChange={handleChange}
        className="w-full"
      />
    </div>
  );
};

export default FileUpload;
