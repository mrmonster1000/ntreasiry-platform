'use client';

import { useState } from 'react';
import { ChartBarIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { SpreadData } from '@/lib/api';

interface SpreadsChartProps {
  spreads: SpreadData[];
  boeBaseRate: number;
  date: string;
  isLoading?: boolean;
}

export function SpreadsChart({ spreads, boeBaseRate, date, isLoading = false }: SpreadsChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('table');

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Spreads vs Bank of England Base Rate
        </h3>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!spreads || spreads.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Spreads vs Bank of England Base Rate
        </h3>
        <div className="text-center py-8 text-gray-500">
          <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No spread data available for {date}</p>
        </div>
      </div>
    );
  }

  const maxAbsSpread = Math.max(...spreads.map(s => Math.abs(s.spread)));
  const chartHeight = 300;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Spreads vs Bank of England Base Rate
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md ${
              viewMode === 'table' 
                ? 'bg-primary-100 text-primary-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <TableCellsIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`p-2 rounded-md ${
              viewMode === 'chart' 
                ? 'bg-primary-100 text-primary-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ChartBarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>BOE Base Rate:</strong> {boeBaseRate}%
        </div>
        <div className="text-xs text-blue-600 mt-1">
          Date: {date}
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600">Bank</th>
                <th className="text-left py-2 text-gray-600">Rate</th>
                <th className="text-left py-2 text-gray-600">Spread</th>
                <th className="text-left py-2 text-gray-600">Performance</th>
              </tr>
            </thead>
            <tbody>
              {spreads.slice(0, 8).map((spread, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2">
                    <div className="font-medium text-gray-900">
                      {spread.bank_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {spread.product_name}
                    </div>
                  </td>
                  <td className="py-2 font-semibold text-primary-600">
                    {Number(spread.current_rate || 0).toFixed(2)}%
                  </td>
                  <td className="py-2">
                    <span className={`font-medium ${
                      spread.spread > 0 ? 'text-success-600' : 'text-error-600'
                    }`}>
                      {spread.spread > 0 ? '+' : ''}{spread.spread}%
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            spread.spread > 0 ? 'bg-success-500' : 'bg-error-500'
                          }`}
                          style={{ 
                            width: `${Math.abs(spread.spread) / maxAbsSpread * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {spread.spread > 0 ? 'Above BOE' : 'Below BOE'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative" style={{ height: chartHeight }}>
          {/* Chart Background */}
          <div className="absolute inset-0 bg-gray-50 rounded-lg">
            {/* Zero line (BOE Base Rate) */}
            <div 
              className="absolute left-0 right-0 border-t-2 border-blue-500 border-dashed"
              style={{ top: `${chartHeight / 2}px` }}
            >
              <span className="absolute right-2 -top-5 text-xs text-blue-600 font-medium">
                BOE {boeBaseRate}%
              </span>
            </div>
            
            {/* Chart Bars */}
            <div className="flex items-end justify-center h-full px-4 py-4">
              {spreads.slice(0, 12).map((spread, idx) => {
                const barHeight = Math.abs(spread.spread) / maxAbsSpread * (chartHeight / 2 - 20);
                const isPositive = spread.spread > 0;
                
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center mx-1 group relative"
                    style={{ width: '100%', maxWidth: '60px' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {spread.bank_name}: {spread.spread > 0 ? '+' : ''}{spread.spread}%
                    </div>
                    
                    {/* Bar Container */}
                    <div className="flex flex-col items-center justify-center h-full">
                      {/* Positive spread bar */}
                      <div 
                        className="w-full bg-success-500 rounded-t"
                        style={{ 
                          height: isPositive ? `${barHeight}px` : '0px',
                          marginBottom: isPositive ? '0px' : `${chartHeight / 2 - 20}px`
                        }}
                      ></div>
                      
                      {/* Negative spread bar */}
                      <div 
                        className="w-full bg-error-500 rounded-b"
                        style={{ 
                          height: !isPositive ? `${barHeight}px` : '0px',
                          marginTop: !isPositive ? '0px' : `${chartHeight / 2 - 20}px`
                        }}
                      ></div>
                    </div>
                    
                    {/* Bank label */}
                    <div className="text-xs text-gray-600 mt-1 text-center leading-tight">
                      {spread.bank_code}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {spreads.length > 8 && viewMode === 'table' && (
        <div className="mt-4 text-center">
          <div className="text-xs text-gray-500">
            Showing top 8 of {spreads.length} products
          </div>
        </div>
      )}
    </div>
  );
}