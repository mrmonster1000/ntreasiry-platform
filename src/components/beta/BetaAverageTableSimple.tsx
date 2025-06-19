'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface BetaAverageTableSimpleProps {
  selectedBanks: string[];
  selectedCategories: string[];
  selectedProducts: string[];
  onSelectionChange?: () => void;
}

export function BetaAverageTableSimple({
  selectedBanks = [],
  selectedCategories = [],
  selectedProducts = [],
  onSelectionChange
}: BetaAverageTableSimpleProps) {
  const [showTable, setShowTable] = useState(true);
  const [period, setPeriod] = useState<'3' | '5' | 'all'>('3');

  // Fetch time series data
  const { data: timeSeriesData, isLoading } = useQuery({
    queryKey: ['time-series-avg-simple', selectedCategories],
    queryFn: () => api.getTimeSeriesData({
      fromDate: '2023-01-01',
      toDate: new Date().toISOString().split('T')[0],
      groupingMode: 'categories' as const,
      categories: selectedCategories.length > 0 ? selectedCategories : ['Big 4', 'Challengers', 'Building Societies']
    }),
    enabled: showTable,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate simple averages
  const averageData = React.useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) return null;

    const rateChanges: any[] = [];
    
    for (let i = 1; i < timeSeriesData.length; i++) {
      const current = timeSeriesData[i];
      const previous = timeSeriesData[i - 1];
      
      if (current.boe_rate !== previous.boe_rate) {
        const rateChange = (current.boe_rate - previous.boe_rate) * 100;
        const changeType = rateChange > 0 ? 'HIKE' : 'CUT';
        
        // Simple average of category changes
        const categories = ['big_4', 'challengers', 'building_societies'];
        const betas: number[] = [];
        
        categories.forEach(category => {
          if (current[category] !== undefined && previous[category] !== undefined) {
            const productChange = current[category] - previous[category];
            const beta = rateChange !== 0 ? productChange / (rateChange / 100) : 0;
            betas.push(Math.abs(beta) > 10 ? 0.75 : beta);
          }
        });

        if (betas.length > 0) {
          const avgBeta = betas.reduce((sum, b) => sum + b, 0) / betas.length;
          rateChanges.push({
            date: current.date,
            changeType,
            rateChange,
            beta: avgBeta
          });
        }
      }
    }

    rateChanges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const hikes = rateChanges.filter(c => c.changeType === 'HIKE');
    const cuts = rateChanges.filter(c => c.changeType === 'CUT');

    const count = parseInt(period === 'all' ? '999' : period);
    const hikesToUse = hikes.slice(0, count);
    const cutsToUse = cuts.slice(0, count);

    return {
      hikes: {
        count: hikesToUse.length,
        avgBeta: hikesToUse.length > 0 ? hikesToUse.reduce((sum, h) => sum + h.beta, 0) / hikesToUse.length : 0
      },
      cuts: {
        count: cutsToUse.length,
        avgBeta: cutsToUse.length > 0 ? cutsToUse.reduce((sum, c) => sum + c.beta, 0) / cutsToUse.length : 0
      }
    };
  }, [timeSeriesData, period]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Average Beta Analysis (Simple)</h3>
          </div>
          <div className="flex items-center space-x-4">
            {showTable && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Period:</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as '3' | '5' | 'all')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="3">Last 3 Changes</option>
                  <option value="5">Last 5 Changes</option>
                  <option value="all">All Available</option>
                </select>
              </div>
            )}
            
            {onSelectionChange && (
              <button
                onClick={onSelectionChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Select Products ({selectedProducts.length > 0 ? selectedProducts.length : 'Categories'})
              </button>
            )}
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTable}
                onChange={(e) => setShowTable(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Show Table</span>
            </label>
          </div>
        </div>

        {showTable && (
          <>
            {isLoading && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center space-x-2 text-gray-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading average beta data...</span>
                </div>
              </div>
            )}

            {!isLoading && averageData && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Beta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full text-red-700 bg-red-50">
                          HIKES
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {averageData.hikes.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {averageData.hikes.avgBeta.toFixed(3)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full text-green-700 bg-green-50">
                          CUTS
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {averageData.cuts.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {averageData.cuts.avgBeta.toFixed(3)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && averageData && (averageData.hikes.count > 0 || averageData.cuts.count > 0) && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Key Insights</h4>
                <div className="text-sm text-blue-800">
                  {averageData.hikes.count > 0 && averageData.cuts.count > 0 && (
                    <div>
                      <span className="font-medium">
                        {averageData.hikes.avgBeta > averageData.cuts.avgBeta ? 'Higher' : 'Lower'} sensitivity to hikes
                      </span>
                      {' - '}
                      Hikes: {averageData.hikes.avgBeta.toFixed(3)} vs Cuts: {averageData.cuts.avgBeta.toFixed(3)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}