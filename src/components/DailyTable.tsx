import React, { useState, useMemo } from 'react';
import { PlantDaily } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DailyTableProps {
  data: PlantDaily[];
}

type SortField = 'date' | 'irradiationH' | 'energyTotalKwh' | 'prPlantPercent';
type SortDirection = 'asc' | 'desc';

export const DailyTable: React.FC<DailyTableProps> = ({ data }) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // default newest first

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-blue-500" />
      : <ArrowDown className="ml-2 h-4 w-4 text-blue-500" />;
  };

  const HeaderCell = ({ field, label }: { field: SortField, label: string }) => (
    <th 
      scope="col" 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <HeaderCell field="date" label="Date" />
              <HeaderCell field="irradiationH" label="Irradiation (h)" />
              <HeaderCell field="energyTotalKwh" label="Total Energy (kWh)" />
              <HeaderCell field="prPlantPercent" label="Plant PR (%)" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row) => (
              <tr key={row.date} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.irradiationH.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.energyTotalKwh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {row.prPlantPercent !== null 
                    ? <span className={row.prPlantPercent < 70 ? 'text-red-600' : 'text-green-600'}>
                        {row.prPlantPercent.toFixed(2)}%
                      </span>
                    : <span className="text-gray-400">-</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
