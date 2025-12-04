import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { Tabs } from './components/Tabs';
import { Summary } from './components/Summary';
import { DailyTable } from './components/DailyTable';
import { Heatmap } from './components/Heatmap';
import { RawTable } from './components/RawTable';
import { About } from './pages/About';
import { parseCsv } from './utils/csvParser';
import { processData } from './utils/calculations';
import { generateDemoData } from './utils/demoData';
import { AppMeta, ProcessedData } from './types';

function App() {
  const [meta, setMeta] = useState<AppMeta | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProcessedData | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  // Load Metadata
  useEffect(() => {
    fetch('./data.json')
      .then(res => res.json())
      .then((data: AppMeta) => setMeta(data))
      .catch(err => {
        console.error('Failed to load configuration', err);
        setError('Failed to load system configuration (data.json).');
        setStatus('error');
      });
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!meta) return;
    
    setStatus('loading');
    setError(null);

    try {
      // Small delay to allow UI to update to loading state
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await parseCsv(file);
      
      if (!result.success || !result.data || !result.headers) {
        throw new Error(result.error || 'Unknown parsing error');
      }

      const processed = processData(result.data, result.headers, meta);
      setData(processed);
      setStatus('loaded');
      setActiveTab('summary');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
      setStatus('error');
    }
  };

  const handleDemoLoad = async () => {
    if (!meta) return;
    setStatus('loading');
    setError(null);

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const { rows, headers } = generateDemoData();
      const processed = processData(rows, headers, meta);
      
      setData(processed);
      setStatus('loaded');
      setActiveTab('summary');
    } catch (err: any) {
      setError('Failed to load demo data');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setData(null);
    setError(null);
  };

  const MainContent = () => {
    if (status === 'idle' || status === 'loading' || (status === 'error' && !data)) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <FileUploader 
            onFileSelect={handleFileSelect} 
            onDemoLoad={handleDemoLoad}
            isLoading={status === 'loading'} 
            error={error}
          />
        </div>
      );
    }

    if (status === 'loaded' && data) {
      const tabs = [
        { id: 'summary', label: 'Summary' },
        { id: 'daily', label: 'Daily PR Table' },
        { id: 'heatmap', label: 'PCS Heatmap' },
        { id: 'raw', label: 'Raw Data & Export' },
      ];

      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] animate-fadeIn">
             <div className="px-6 pt-4">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
             </div>
             
             <div className="p-6">
               {activeTab === 'summary' && <Summary data={data.summary} />}
               {activeTab === 'daily' && <DailyTable data={data.plantDaily} />}
               {activeTab === 'heatmap' && <Heatmap data={data.pcsDaily} />}
               {activeTab === 'raw' && <RawTable processedData={data} />}
             </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!meta && !error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Initializing System...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Header hasData={status === 'loaded'} onReset={handleReset} />
        
        <main className="transition-all duration-300">
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
