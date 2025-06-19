'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { LatestRate } from '@/lib/api';

interface Props {
  data?: LatestRate[];
  isLoading: boolean;
}

export function LatestRatesChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Latest Rates by Bank
        </h3>
        <div className="h-80 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Latest Rates by Bank
        </h3>
        <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-gray-500">No rate data available</div>
        </div>
      </div>
    );
  }

  // Group by bank and get highest rates
  const bankRates = data.reduce((acc, rate) => {
    const existing = acc[rate.bank_code];
    if (!existing || rate.current_effective_rate > existing.current_effective_rate) {
      acc[rate.bank_code] = {
        bank: rate.bank_name.replace(' UK', '').replace(' Bank', ''),
        standardRate: rate.standard_rate || 0,
        promotionalRate: rate.promotional_rate || 0,
        currentRate: rate.current_effective_rate,
      };
    }
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(bankRates).sort((a: any, b: any) => b.currentRate - a.currentRate);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Highest Rates by Bank
        </h3>
        <div className="text-sm text-gray-500">
          {data.length} products analyzed
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="bank" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: any, name: string) => [`${Number(value || 0).toFixed(2)}%`, name]}
            />
            <Legend />
            <Bar 
              dataKey="standardRate" 
              fill="#3b82f6" 
              name="Standard Rate"
              radius={[0, 0, 4, 4]}
            />
            <Bar 
              dataKey="promotionalRate" 
              fill="#10b981" 
              name="Promotional Rate"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        * Showing highest available rate per bank. Promotional rates are time-limited.
      </div>
    </div>
  );
}