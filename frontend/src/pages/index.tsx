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
