import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Analyzer
        </Link>
      </div>

      <div className="prose prose-blue max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About PR Analyzer</h1>
        
        <p className="text-gray-600 mb-8">
          This application is a client-side tool for analyzing the Performance Ratio (PR) of solar power plants.
          It operates entirely in your browser — no data is uploaded to any server, ensuring complete privacy.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">CSV Format Requirements</h2>
        <p className="text-gray-600 mb-4">
          The CSV file must contain specific headers to be parsed correctly.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Columns:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li><code className="text-red-600 font-mono">date</code>: YYYY-MM-DD format</li>
            <li><code className="text-red-600 font-mono">irradiation_h</code>: Daily irradiation (kWh/m²) or similar unit matching your formula</li>
            <li><code className="text-red-600 font-mono">plant_pdc_kw</code>: Plant DC Capacity (kW) - taken from the first row</li>
            <li><code className="text-blue-600 font-mono">pcs_ID_kwh</code>: Daily generation for specific PCS units (e.g., pcs_1-1-1_kwh)</li>
          </ul>
        </div>

        <h3 className="text-sm font-semibold text-gray-700 mb-2">Example CSV Structure:</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto mb-8">
          date,irradiation_h,plant_pdc_kw,pcs_1-1-1_kwh,pcs_1-1-2_kwh<br/>
          2023-01-01,3.5,1000.0,150.5,149.8<br/>
          2023-01-02,4.2,1000.0,180.2,179.5
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Calculations</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900">Plant PR</h3>
            <p className="text-sm text-gray-500 font-mono bg-gray-50 inline-block px-2 py-1 rounded mt-1">
              (Total Energy / (Irradiation * Plant DC Capacity)) * 100
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">PCS PR</h3>
            <p className="text-sm text-gray-500">
              Uses the rated DC capacity defined in the system configuration (data.json).
            </p>
            <p className="text-sm text-gray-500 font-mono bg-gray-50 inline-block px-2 py-1 rounded mt-1">
              (PCS Energy / (Irradiation * PCS Rated DC Capacity)) * 100
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
