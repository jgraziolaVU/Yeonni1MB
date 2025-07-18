import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import PlotViewer from '../components/PlotViewer';
import SummaryPanel from '../components/SummaryPanel';
import { sendFile } from '../utils/api';

export default function Home() {
  const [plotData, setPlotData] = useState([]);
  const [layout, setLayout] = useState({});
  const [summary, setSummary] = useState('');

  const handleFileUpload = async (file) => {
    const result = await sendFile(file);
    setPlotData(result.plot_data);
    setLayout(result.plot_layout);
    setSummary(result.summary);
  };

  return (
    <main className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Mössbauer Spectrum Analyzer</h1>
        <FileUpload onFileUpload={handleFileUpload} />
        <PlotViewer data={plotData} layout={layout} />
        <SummaryPanel summary={summary} />
      </div>
    </main>
  );
}
