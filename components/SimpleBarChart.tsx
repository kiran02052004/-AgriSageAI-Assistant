
import React from 'react';
import type { ChartData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SimpleBarChartProps {
  data: ChartData;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data }) => {
  const { t } = useLanguage();
  if (!data || !data.values || data.values.length === 0) {
    return <p className="text-sm text-gray-500">{t('general.noData') || 'No chart data available.'}</p>;
  }

  const maxValue = Math.max(...data.values, 0); // Ensure maxValue is at least 0
  const barColors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      {data.dataLabel && <h4 className="text-md font-semibold text-gray-700 mb-3 text-center">{data.dataLabel}</h4>}
      <div className="flex justify-around items-end h-48 space-x-2">
        {data.values.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={`w-full rounded-t-md ${barColors[index % barColors.length]} transition-all duration-500 ease-out`}
              style={{ height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
              title={`${data.labels[index] || `Value ${index + 1}`}: ${value}`}
            >
              <span className="sr-only">{`${data.labels[index] || `Value ${index + 1}`}: ${value}`}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1 truncate w-full text-center" title={data.labels[index] || `Data ${index + 1}`}>
              {data.labels[index] || `Data ${index + 1}`}
            </p>
          </div>
        ))}
      </div>
      {/* Simple Y-axis approximation */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>{maxValue / 2}</span>
          <span>{maxValue}</span>
      </div>
    </div>
  );
};
