import React, { useMemo } from 'react';
import { PcsDaily } from '../types';
import { cn } from '../utils/cn';

interface HeatmapProps {
  data: PcsDaily[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  // Transform data into Grid structure
  // Rows: Date (desc), Cols: PCS ID (asc)
  const { dates, pcsIds, grid } = useMemo(() => {
    const uniqueDates = Array.from(new Set(data.map(d => d.date))).sort().reverse();
    
    // Sort PCS IDs naturally (handling numbers in strings e.g. 1-1-2 vs 1-1-10)
    const uniquePcsIds = Array.from(new Set(data.map(d => d.pcsId))).sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    const lookup = new Map<string, PcsDaily>();
    data.forEach(d => lookup.set(`${d.date}:${d.pcsId}`, d));

    return { dates: uniqueDates, pcsIds: uniquePcsIds, grid: lookup };
  }, [data]);

  const getColor = (pr: number | null) => {
    if (pr === null) return 'bg-gray-200'; // No PR (no irradiation or error)
    if (pr < 70) return 'bg-red-500';
    if (pr < 90) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-4 overflow-hidden">
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full align-middle">
          <div className="flex flex-col">
            {/* Legend */}
            <div className="flex space-x-6 mb-4 text-sm text-gray-600 justify-end">
              <div className="flex items-center"><span className="w-4 h-4 bg-green-500 mr-2 rounded-sm"></span> &gt; 90%</div>
              <div className="flex items-center"><span className="w-4 h-4 bg-yellow-400 mr-2 rounded-sm"></span> 70-90%</div>
              <div className="flex items-center"><span className="w-4 h-4 bg-red-500 mr-2 rounded-sm"></span> &lt; 70%</div>
              <div className="flex items-center"><span className="w-4 h-4 bg-gray-200 mr-2 rounded-sm"></span> N/A</div>
            </div>

            {/* Grid Container */}
            <div className="border-b border-gray-200">
              {/* Header Row (PCS IDs) */}
              <div className="flex">
                <div className="w-24 flex-shrink-0 p-2 font-bold text-xs text-gray-500 bg-gray-50 sticky left-0 z-10 border-r">
                  Date \ PCS
                </div>
                {pcsIds.map(id => (
                  <div key={id} className="w-12 flex-shrink-0 p-1 text-center text-xs font-medium text-gray-500 border-r rotate-0">
                    <div className="truncate" title={id}>{id}</div>
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              {dates.map(date => (
                <div key={date} className="flex border-t border-gray-100 hover:bg-gray-50">
                  <div className="w-24 flex-shrink-0 p-2 text-xs font-medium text-gray-900 bg-gray-50 sticky left-0 z-10 border-r">
                    {date}
                  </div>
                  {pcsIds.map(pcsId => {
                    const cellData = grid.get(`${date}:${pcsId}`);
                    const pr = cellData?.prPcsPercent ?? null;
                    
                    return (
                      <div 
                        key={pcsId} 
                        className="w-12 flex-shrink-0 h-8 border-r border-gray-100 p-0.5"
                      >
                        <div 
                          className={cn("w-full h-full rounded-sm transition-colors cursor-help", getColor(pr))}
                          title={`Date: ${date}\nPCS: ${pcsId}\nPR: ${pr?.toFixed(2) ?? 'N/A'}%\nGen: ${cellData?.energyAcKwh ?? 0} kWh`}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
