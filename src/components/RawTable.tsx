import React, { useState } from 'react';
import { ProcessedData } from '../types';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface RawTableProps {
  processedData: ProcessedData;
}

export const RawTable: React.FC<RawTableProps> = ({ processedData }) => {
  const [page, setPage] = useState(1);
  const pageSize = 50;
  
  const { rawRows, plantDaily, headers } = processedData;

  // Enhance raw rows with calculated Plant PR
  // We align them by index since `processData` iterates sequentially
  // Warning: If filtering was applied, this index matching would break. 
  // Given the current logic, row[i] corresponds to plantDaily[i].
  const displayRows = rawRows.map((row, idx) => ({
    ...row,
    plant_pr_percent: plantDaily[idx]?.prPlantPercent ?? null
  }));

  const totalPages = Math.ceil(displayRows.length / pageSize);
  const currentData = displayRows.slice((page - 1) * pageSize, page * pageSize);

  // All headers including the calculated PR
  const displayHeaders = [...headers, 'plant_pr_percent'];

  const downloadCsv = () => {
    // Construct CSV content
    // Header
    let csvContent = displayHeaders.join(',') + '\n';
    
    // Rows
    displayRows.forEach(row => {
      const line = displayHeaders.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '';
        return val;
      }).join(',');
      csvContent += line + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `processed_pv_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, displayRows.length)} of {displayRows.length} rows
        </div>
        <button
          onClick={downloadCsv}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {displayHeaders.map(h => (
                <th 
                  key={h}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {displayHeaders.map(h => (
                  <td key={h} className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof row[h] === 'number' 
                      ? (row[h] as number).toFixed(2) 
                      : (row[h] || '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 py-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
