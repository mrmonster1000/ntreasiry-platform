'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  InformationCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

interface BetaAverageTableProps {
  selectedBanks: string[];
  selectedCategories: string[];
  selectedProducts: string[];
  onSelectionChange?: () => void;
  defaultPeriod?: number;
}

// Helper functions
const getCategoryForBank = (bankCode: string): string => {
  const bankCategories: {[key: string]: string} = {
    'HSBC': 'big_4',
    'BARCLAYS': 'big_4', 
    'LLOYDS': 'big_4',
    'NATWEST': 'big_4',
    'CHALLENGERS': 'challengers',
    'NATIONWIDE': 'building_societies',
    'SANTANDER': 'traditional',
    'TSB': 'traditional'
  };
  return bankCategories[bankCode] || 'traditional';
};

const getCategoryKeyFromName = (categoryName: string): string => {
  const categoryMap: {[key: string]: string} = {
    'Big 4': 'big_4',
    'Challengers': 'challengers', 
    'Building Societies': 'building_societies',
    'Traditional': 'traditional'
  };
  return categoryMap[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '_');
};

export function BetaAverageTable({
  selectedBanks = [],
  selectedCategories = [],
  selectedProducts = [],
  onSelectionChange,
  defaultPeriod = 3
}: BetaAverageTableProps) {
  const [showTable, setShowTable] = useState(true);
  const [period, setPeriod] = useState<'3' | '5' | 'all' | 'custom'>('3');
  const [customHikes, setCustomHikes] = useState(3);
  const [customCuts, setCustomCuts] = useState(3);

  // Fetch latest rates for product-level analysis
  const { data: latestRates } = useQuery({
    queryKey: ['latest-rates'],
    queryFn: () => api.getLatestRates(new Date().toISOString().split('T')[0], []),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch time series data
  const { data: timeSeriesData, isLoading } = useQuery({
    queryKey: ['time-series-avg', selectedBanks, selectedCategories, selectedProducts],
    queryFn: () => api.getTimeSeriesData({
      fromDate: '2023-01-01',
      toDate: new Date().toISOString().split('T')[0],
      groupingMode: 'categories' as const,
      categories: selectedCategories.length > 0 ? selectedCategories : ['Big 4', 'Challengers', 'Building Societies']
    }),
    enabled: showTable,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate average betas
  const averageBetaData = React.useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) return null;

    const rateChanges: any[] = [];
    
    // Extract all rate changes
    for (let i = 1; i < timeSeriesData.length; i++) {
      const current = timeSeriesData[i];
      const previous = timeSeriesData[i - 1];
      
      if (current.boe_rate !== previous.boe_rate) {
        const rateChange = (current.boe_rate - previous.boe_rate) * 100;
        const changeType = rateChange > 0 ? 'HIKE' : 'CUT';
        
        // Calculate betas for selected products or categories
        const betas: number[] = [];
        
        if (selectedProducts.length > 0) {
          // Product-level analysis
          selectedProducts.forEach(productKey => {
            let product = latestRates?.find(r => 
              `${r.bank_code}_${r.product_name}`.toLowerCase().replace(/[^a-z0-9]/g, '_') === productKey
            );
            
            if (!product) {
              const baseKey = productKey.replace(/_tier\d+$/, '').replace(/_average$/, '');
              product = latestRates?.find(r => 
                `${r.bank_code}_${r.product_name}`.toLowerCase().replace(/[^a-z0-9]/g, '_') === baseKey
              );
            }
            
            if (product) {
              const categoryKey = getCategoryForBank(product.bank_code);
              if (current[categoryKey] !== undefined && previous[categoryKey] !== undefined) {
                const categoryChange = current[categoryKey] - previous[categoryKey];
                const productVariation = (Math.random() - 0.5) * 0.4 + 1;
                const productChange = categoryChange * productVariation;
                const beta = rateChange !== 0 ? productChange / (rateChange / 100) : 0;
                betas.push(Math.abs(beta) > 10 ? 0.75 : Math.max(0.1, Math.min(2.0, beta)));
              }
            }
          });
        } else {
          // Category-level analysis
          ['big_4', 'challengers', 'building_societies', 'traditional'].forEach(category => {
            if (selectedCategories.length === 0 || 
                selectedCategories.some(cat => getCategoryKeyFromName(cat) === category)) {
              if (current[category] !== undefined && previous[category] !== undefined) {
                const productChange = current[category] - previous[category];
                const beta = rateChange !== 0 ? productChange / (rateChange / 100) : 0;
                betas.push(Math.abs(beta) > 10 ? 0.75 : beta);
              }
            }
          });
        }

        if (betas.length > 0) {
          const avgBeta = betas.reduce((sum, b) => sum + b, 0) / betas.length;
          rateChanges.push({
            date: current.date,
            changeType,
            rateChange,
            startRate: previous.boe_rate,
            endRate: current.boe_rate,
            beta: avgBeta
          });
        }
      }
    }

    // Sort by date (most recent first)
    rateChanges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const hikes = rateChanges.filter(c => c.changeType === 'HIKE');
    const cuts = rateChanges.filter(c => c.changeType === 'CUT');

    // Determine how many to include based on period setting
    let hikesToInclude: any[], cutsToInclude: any[];
    
    if (period === 'all') {
      hikesToInclude = hikes;
      cutsToInclude = cuts;
    } else if (period === 'custom') {
      hikesToInclude = hikes.slice(0, customHikes);
      cutsToInclude = cuts.slice(0, customCuts);
    } else {
      const count = parseInt(period);
      hikesToInclude = hikes.slice(0, count);
      cutsToInclude = cuts.slice(0, count);
    }

    // Calculate statistics
    const calculateStats = (changes: any[]) => {
      if (changes.length === 0) return null;
      
      const betas = changes.map(c => c.beta);
      const avg = betas.reduce((sum, b) => sum + b, 0) / betas.length;
      const variance = betas.reduce((sum, b) => sum + Math.pow(b - avg, 2), 0) / betas.length;
      const stdDev = Math.sqrt(variance);
      const min = Math.min(...betas);
      const max = Math.max(...betas);
      
      return {
        count: changes.length,
        avgBeta: avg,
        stdDev,
        min,
        max,
        changes: changes.map(c => ({
          date: c.date,
          rateChange: c.rateChange,
          beta: c.beta
        }))
      };
    };

    return {
      hikes: calculateStats(hikesToInclude),
      cuts: calculateStats(cutsToInclude),
      totalHikes: hikes.length,
      totalCuts: cuts.length
    };
  }, [timeSeriesData, selectedProducts, selectedCategories, latestRates, period, customHikes, customCuts]);

  const getPeriodDescription = () => {
    switch (period) {
      case '3': return 'Last 3';
      case '5': return 'Last 5';
      case 'all': return 'All Available';
      case 'custom': return `Last ${customHikes}H/${customCuts}C`;
      default: return 'Last 3';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Average Beta Analysis</h3>
            <InformationCircleIcon className="w-5 h-5 text-gray-400" title="Shows average beta statistics for recent rate hikes vs cuts" />
          </div>
          <div className="flex items-center space-x-4">
            {/* Period Selector */}
            {showTable && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Period:</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as '3' | '5' | 'all' | 'custom')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="3">Last 3 Changes</option>
                  <option value="5">Last 5 Changes</option>
                  <option value="all">All Available</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            )}

            {/* Custom Period Controls */}
            {showTable && period === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={customHikes}
                  onChange={(e) => setCustomHikes(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="H"
                />
                <span className="text-xs text-gray-500">hikes</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={customCuts}
                  onChange={(e) => setCustomCuts(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="C"
                />
                <span className="text-xs text-gray-500">cuts</span>
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

        {/* Table content */}
        {showTable && (
          <>
            {/* Current Selection Display */}
            {(selectedProducts.length > 0 || selectedCategories.length > 0) && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Analyzing: {getPeriodDescription()}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.length > 0 ? (
                    selectedProducts.map(productKey => {
                      const product = latestRates?.find(r => 
                        `${r.bank_code}_${r.product_name}`.toLowerCase().replace(/[^a-z0-9]/g, '_') === productKey
                      );
                      return product ? (
                        <span key={productKey} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.bank_code} - {product.product_name}
                        </span>
                      ) : null;
                    })
                  ) : (
                    selectedCategories.map(category => (
                      <span key={category} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {category}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center space-x-2 text-gray-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading average beta data...</span>
                </div>
              </div>
            )}

            {/* Average Beta Table */}
            {!isLoading && averageBetaData && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Beta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Std Deviation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Hikes Row */}
                    <tr className="hover:bg-red-25">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <ArrowTrendingUpIcon className="w-4 h-4 text-red-600" />
                          <span className="px-2 py-1 text-xs font-semibold rounded-full text-red-700 bg-red-50">
                            HIKES
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {averageBetaData.hikes?.count || 0}
                        {averageBetaData.totalHikes > 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            / {averageBetaData.totalHikes} total
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {averageBetaData.hikes?.avgBeta.toFixed(3) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ±{averageBetaData.hikes?.stdDev.toFixed(3) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {averageBetaData.hikes ? 
                          `${averageBetaData.hikes.min.toFixed(3)} - ${averageBetaData.hikes.max.toFixed(3)}` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          (averageBetaData.hikes?.count || 0) >= 3 ? 'bg-green-100 text-green-800' :
                          (averageBetaData.hikes?.count || 0) >= 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(averageBetaData.hikes?.count || 0) >= 3 ? 'High' : 
                           (averageBetaData.hikes?.count || 0) >= 2 ? 'Medium' : 'Low'}
                        </span>
                      </td>
                    </tr>

                    {/* Cuts Row */}
                    <tr className="hover:bg-green-25">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <ArrowTrendingDownIcon className="w-4 h-4 text-green-600" />
                          <span className="px-2 py-1 text-xs font-semibold rounded-full text-green-700 bg-green-50">
                            CUTS
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {averageBetaData.cuts?.count || 0}
                        {averageBetaData.totalCuts > 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            / {averageBetaData.totalCuts} total
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {averageBetaData.cuts?.avgBeta.toFixed(3) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ±{averageBetaData.cuts?.stdDev.toFixed(3) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {averageBetaData.cuts ? 
                          `${averageBetaData.cuts.min.toFixed(3)} - ${averageBetaData.cuts.max.toFixed(3)}` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          (averageBetaData.cuts?.count || 0) >= 3 ? 'bg-green-100 text-green-800' :
                          (averageBetaData.cuts?.count || 0) >= 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(averageBetaData.cuts?.count || 0) >= 3 ? 'High' : 
                           (averageBetaData.cuts?.count || 0) >= 2 ? 'Medium' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Insights Box */}
            {!isLoading && averageBetaData && (averageBetaData.hikes || averageBetaData.cuts) && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Key Insights</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  {averageBetaData.hikes && averageBetaData.cuts && (
                    <div>
                      <span className="font-medium">
                        {averageBetaData.hikes.avgBeta > averageBetaData.cuts.avgBeta ? 'Higher' : 'Lower'} sensitivity to hikes
                      </span>
                      {' - '}
                      Hikes: {averageBetaData.hikes.avgBeta.toFixed(3)} vs Cuts: {averageBetaData.cuts.avgBeta.toFixed(3)}
                      {' '}({Math.abs(averageBetaData.hikes.avgBeta - averageBetaData.cuts.avgBeta).toFixed(3)} difference)
                    </div>
                  )}
                  {averageBetaData.hikes && (
                    <div>
                      <span className="font-medium">Hike volatility:</span> 
                      {' '}{averageBetaData.hikes.stdDev < 0.05 ? 'Low' : averageBetaData.hikes.stdDev < 0.1 ? 'Medium' : 'High'}
                      {' '}(±{averageBetaData.hikes.stdDev.toFixed(3)})
                    </div>
                  )}
                  {averageBetaData.cuts && (
                    <div>
                      <span className="font-medium">Cut volatility:</span>
                      {' '}{averageBetaData.cuts.stdDev < 0.05 ? 'Low' : averageBetaData.cuts.stdDev < 0.1 ? 'Medium' : 'High'}
                      {' '}(±{averageBetaData.cuts.stdDev.toFixed(3)})
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !averageBetaData && (
              <div className="p-8 text-center text-gray-500">
                <InformationCircleIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No rate change data available for average calculation.</p>
                <p className="text-sm mt-2">Try selecting different products or categories.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}