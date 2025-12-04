import React from 'react';
import { ProcessedData } from '../types';
import { Calendar, Zap, Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryProps {
  data: ProcessedData['summary'];
}

const StatCard = ({ label, value, subValue, icon: Icon, colorClass }: any) => (
  <div className="bg-white overflow-hidden rounded-lg shadow border border-gray-100 p-5">
    <div className="flex items-center">
      <div className={`flex-shrink-0 rounded-md p-3 ${colorClass}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-5 w-0 flex-1">
        <dt className="truncate text-sm font-medium text-gray-500">{label}</dt>
        <dd>
          <div className="text-lg font-medium text-gray-900">{value}</div>
          {subValue && <div className="text-xs text-gray-400 mt-1">{subValue}</div>}
        </dd>
      </div>
    </div>
  </div>
);

export const Summary: React.FC<SummaryProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Analysis Period"
        value={`${data.totalDays} Days`}
        subValue={`${data.startDate} - ${data.endDate}`}
        icon={Calendar}
        colorClass="bg-blue-500"
      />
      <StatCard
        label="System Size"
        value={`${data.pcsCount} PCS Units`}
        icon={Zap}
        colorClass="bg-indigo-500"
      />
      <StatCard
        label="Average Plant PR"
        value={data.avgPlantPr ? `${data.avgPlantPr.toFixed(2)}%` : 'N/A'}
        icon={Activity}
        colorClass="bg-emerald-500"
      />
      <StatCard
        label="PR Extremes"
        value={`High: ${data.maxPrDate || '-'} `}
        subValue={`Low: ${data.minPrDate || '-'}`}
        icon={TrendingUp}
        colorClass="bg-amber-500"
      />
    </div>
  );
};
