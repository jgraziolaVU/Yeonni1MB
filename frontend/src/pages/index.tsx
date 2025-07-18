import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Moon, Sun, Activity, AlertCircle, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import clsx from 'clsx';

import { FileUpload } from '../components/FileUpload';
import { FittingOptions } from '../components/FittingOptions';
import { ResultsView } from '../components/ResultsView';
import { api, AnalysisOptions, AnalysisResponse } from '../utils/api';

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);
  
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    model_type: 'lorentzian',
    n_sites: null,
    baseline_correction: true,
  });

  // Check API health on mount
  useEffect(() => {
    api.checkHealth().then(setIsHealthy);
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setResults(null);
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);
    setResults(null);

    try {
      const response = await api.analyzeSpectrum(file, analysisOptions);
      
      if (response.success) {
        setResults(response);
        toast.success('Analysis completed successfully!');
      } else {
        toast.error(response.error || 'Analysis failed');
      }
    } catch (error) {
      toast.error('Failed to analyze spectrum');
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!results?.report_id) return;
    
    try {
      await api.downloadReport(results.report_id);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  return (
    <>
      <Head>
        <title>Mössbauer Spectrum Analyzer</title>
        <meta name="description" content="AI-powered analysis of 57Fe Mössbauer spectroscopy data" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={clsx(
        'min-h-screen transition-colors duration-300',
        darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
      )}>
        <Toaster
          position="top-right"
          toastOptions={{
            className: '',
            style: {
              background: darkMode ? '#1f2937' : '#fff',
              color: darkMode ? '#f3f4f6' : '#111827',
              border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            },
          }}
        />

        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Mössbauer Spectrum Analyzer
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    AI-powered ⁵⁷Fe spectroscopy analysis
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {!isHealthy && (
                  <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    API Offline
                  </div>
                )}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* File Upload */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Upload Spectrum Data
                </h2>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  isLoading={isLoading}
                />
              </div>

              {/* Fitting Options */}
              <FittingOptions
                options={analysisOptions}
                onChange={setAnalysisOptions}
                isExpanded={showOptions}
                onToggle={() => setShowOptions(!showOptions)}
              />

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Quick Start Guide
                </h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Upload your spectrum file (velocity vs transmission)</li>
                  <li>Adjust fitting options if needed</li>
                  <li>View results and AI interpretation</li>
                  <li>Export report for publication</li>
                </ol>
              </div>
            </div>

            {/* Results Area */}
            <div className="lg:col-span-2">
              {isLoading && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Analyzing your spectrum...
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This may take a few moments
                    </p>
                  </div>
                </div>
              )}

              {results && !isLoading && (
                <ResultsView
                  results={results}
                  onDownload={handleDownloadReport}
                  darkMode={darkMode}
                />
              )}

              {!isLoading && !results && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12">
                  <div className="text-center">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No spectrum loaded
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Upload a spectrum file to begin analysis
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>© 2024 Mössbauer Spectrum Analyzer</p>
              <p className="mt-2">
                Built with Next.js, FastAPI, and lmfit
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
