'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { api } from '@/lib/api';

// Bank brand colors
const BANK_COLORS: Record<string, string> = {
  'HSBC': '#DB0011',           // HSBC Red
  'BARCLAYS': '#00AEEF',       // Barclays Blue
  'LLOYDS': '#000000',         // Lloyds Black
  'NATWEST': '#5A1D7D',        // NatWest Purple
  'SANTANDER': '#EC1C24',      // Santander Red
  'NATIONWIDE': '#002979',     // Nationwide Blue
  'TSB': '#0066AA',            // TSB Blue
  'CHASE': '#117ACA',          // Chase Blue
  'CHALLENGERS': '#FF6B35',    // Orange for challenger banks
  'STARLING': '#6C1D5F',       // Starling Purple
  'MONZO': '#FF449C',          // Monzo Hot Pink
  'MARCUS': '#1C3AA9',         // Marcus Blue
  'DEFAULT': '#6B7280'         // Gray fallback
};

interface ProductRate {
  bank_name: string;
  bank_code: string;
  product_name: string;
  product_type: string;
  min_rate: number;
  max_rate: number;
  tier_count: number;
}

interface ProductRatesChartProps {
  selectedDate?: string;
}

export function ProductRatesChart({ selectedDate }: ProductRatesChartProps) {
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [selectedDepositCategories, setSelectedDepositCategories] = useState<string[]>(['rate_sensitive_instant_access']);
  const [sortBy, setSortBy] = useState<'bank' | 'max_rate' | 'spread'>('bank'); // Default to bank name
  const [extractionDate, setExtractionDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [showBestRate, setShowBestRate] = useState(true); // true = best rate, false = min rate only

  // Fetch IRRBB categories
  const { data: irrbbCategories } = useQuery({
    queryKey: ['irrbb-categories'],
    queryFn: api.getIRRBBCategories,
  });

  // Fetch product rates data - Always use IRRBB categories
  const { data: allProductRates, isLoading, error } = useQuery({
    queryKey: ['product-rates', selectedBanks, extractionDate, selectedDepositCategories],
    queryFn: () => api.getProductRates({
      banks: selectedBanks.length > 0 ? selectedBanks : 'all',
      productType: 'all',
      extractionDate: extractionDate,
      useIRRBB: true
    }),
    enabled: selectedDepositCategories.length > 0,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter by selected deposit categories
  const productRates = allProductRates?.filter(rate => 
    selectedDepositCategories.length === 0 || selectedDepositCategories.includes(rate.irrbb_category)
  ) || [];

  // Available deposit categories for filtering
  const depositCategories = [
    { id: 'rate_sensitive_instant_access', name: 'Rate-Sensitive Instant Access', color: 'bg-blue-100 text-blue-800' },
    { id: 'constrained_access_savings', name: 'Constrained Access Savings', color: 'bg-green-100 text-green-800' },
    { id: 'contractually_fixed_products', name: 'Contractually Fixed Products', color: 'bg-purple-100 text-purple-800' },
    { id: 'specialized_restricted_products', name: 'Specialized/Restricted Products', color: 'bg-orange-100 text-orange-800' }
  ];

  // Fetch BoE rate
  const { data: boeRate } = useQuery({
    queryKey: ['boe-rate'],
    queryFn: api.getBoeRate,
  });

  // Get unique banks for filters
  const availableBanks = productRates ? 
    Array.from(new Set(productRates.map((p: ProductRate) => p.bank_code))).sort() : [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.bank_name}</p>
          <p className="text-sm text-gray-600 mb-2">{data.product_name}</p>
          <p className="text-sm">
            <span className="text-gray-600">Min Rate:</span> 
            <span className="font-medium ml-1">{data.min_rate.toFixed(2)}%</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Max Rate:</span> 
            <span className="font-medium ml-1">{data.max_rate.toFixed(2)}%</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.tier_count} rate tier{data.tier_count !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format chart data with colors and better labeling
  const chartData = productRates?.map((product: ProductRate) => {
    const spread = product.max_rate - product.min_rate;
    return {
      ...product,
      color: BANK_COLORS[product.bank_code] || BANK_COLORS.DEFAULT,
      label: `${product.bank_code} ${product.product_name.substring(0, 15)}${product.product_name.length > 15 ? '...' : ''}`,
      spread: spread,
      // For chart display - either min rate only or best rate
      display_rate: showBestRate ? product.max_rate : product.min_rate,
      // For stacked bar when showing best rate
      base_rate: showBestRate ? product.min_rate : product.min_rate,
      additional_rate: showBestRate ? spread : 0
    };
  }).sort((a, b) => {
    const sortValue = showBestRate ? 'max_rate' : 'min_rate';
    switch (sortBy) {
      case 'max_rate':
        return b[sortValue] - a[sortValue]; // Highest first
      case 'spread':
        return b.spread - a.spread; // Largest spread first
      case 'bank':
      default:
        return a.bank_name.localeCompare(b.bank_name); // Alphabetical
    }
  }) || [];

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error loading product rates</div>
            <div className="text-gray-500 text-sm">{error instanceof Error ? error.message : 'Unknown error'}</div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading product rates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Product Rate Ranges
          </h2>
          <p className="text-sm text-gray-600">
            Deposit categories with min/max rates and Bank of England base rate
          </p>
        </div>
      </div>

      {/* Premium Filters */}
      <div className="mb-4 p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border border-slate-200/60 rounded-xl shadow-sm backdrop-blur-sm">
        
        {/* Row 1: Deposit Categories */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-700 mb-3 block">Deposit Categories</label>
          <div className="flex flex-wrap gap-2">
            {depositCategories.map(category => (
              <label
                key={category.id}
                className={`
                  inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border-2
                  ${selectedDepositCategories.includes(category.id)
                    ? 'bg-primary-100 border-primary-300 text-primary-800 shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={selectedDepositCategories.includes(category.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDepositCategories([...selectedDepositCategories, category.id]);
                    } else {
                      setSelectedDepositCategories(selectedDepositCategories.filter(c => c !== category.id));
                    }
                  }}
                  className="sr-only"
                />
                <span>{category.name}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex space-x-3 text-xs">
            <button
              onClick={() => setSelectedDepositCategories([])}
              className="text-slate-600 hover:text-slate-700 transition-colors"
            >
              Clear all
            </button>
            <button
              onClick={() => setSelectedDepositCategories(depositCategories.map(c => c.id))}
              className="text-primary-600 hover:text-primary-800 transition-colors"
            >
              Select all
            </button>
          </div>
        </div>

        {/* Row 2: Other Controls */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Extraction Date */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Date:</label>
            <input
              type="date"
              value={extractionDate}
              onChange={(e) => setExtractionDate(e.target.value)}
              className="text-sm border-2 border-slate-200 rounded-lg px-3 py-2 bg-white/80 backdrop-blur focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-all w-40 shadow-sm"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'bank' | 'max_rate' | 'spread')}
              className="text-sm border-2 border-slate-200 rounded-lg px-3 py-2 bg-white/80 backdrop-blur focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-all w-48 shadow-sm"
            >
              <option value="bank">Bank Name (A-Z)</option>
              <option value="max_rate">Highest Rate First</option>
              <option value="spread">Largest Spread First</option>
            </select>
          </div>

          {/* Rate Display Toggle */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-slate-700">Display:</span>
            <div className="flex bg-white/60 rounded-lg p-1 border-2 border-slate-200">
              <label className={`
                px-3 py-1 rounded-md text-sm font-medium cursor-pointer transition-all
                ${showBestRate ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}
              `}>
                <input
                  type="radio"
                  checked={showBestRate}
                  onChange={() => setShowBestRate(true)}
                  className="sr-only"
                />
                Best Rate
              </label>
              <label className={`
                px-3 py-1 rounded-md text-sm font-medium cursor-pointer transition-all
                ${!showBestRate ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}
              `}>
                <input
                  type="radio"
                  checked={!showBestRate}
                  onChange={() => setShowBestRate(false)}
                  className="sr-only"
                />
                Min Rate
              </label>
            </div>
          </div>

          {/* Banks Multi-Select */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Banks:</label>
            <div className="relative">
              <select
                multiple
                value={selectedBanks}
                onChange={(e) => setSelectedBanks(Array.from(e.target.selectedOptions, option => option.value))}
                className="text-sm border-2 border-slate-200 rounded-lg px-3 py-2 bg-white/80 backdrop-blur focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-all w-48 h-20 shadow-sm"
                size={4}
              >
                {availableBanks.map(bank => (
                  <option key={bank} value={bank} className="py-1">{bank}</option>
                ))}
              </select>
              {selectedBanks.length > 0 && (
                <button
                  onClick={() => setSelectedBanks([])}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors shadow-md"
                  title={`Clear ${selectedBanks.length} selected banks`}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Selected Banks Indicator */}
          {selectedBanks.length > 0 && (
            <div className="flex items-center">
              <div className="text-sm font-medium text-primary-700 bg-primary-100 px-3 py-2 rounded-lg shadow-sm border border-primary-200">
                {selectedBanks.length} bank{selectedBanks.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-3 text-xs text-slate-600 bg-white/40 rounded-lg px-3 py-2">
          💡 Select multiple deposit categories and banks to compare. Hold Ctrl/Cmd for multi-select in bank dropdown.
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 60, bottom: 100 }}
            barCategoryGap="15%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="label"
              angle={-45}
              textAnchor="end"
              height={140}
              fontSize={9}
              tick={{ fontSize: 9 }}
              interval={0}
            />
            <YAxis 
              label={{ value: 'Interest Rate (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 'dataMax + 0.5']}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* BoE Base Rate Reference Line */}
            {boeRate && (
              <ReferenceLine 
                y={boeRate.rate} 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ 
                  value: `Bank of England Base Rate: ${boeRate.rate}%`, 
                  position: "top",
                  offset: 10
                }}
              />
            )}
            
            {showBestRate ? (
              <>
                {/* Base Rate (Minimum) - Stacked Bottom */}
                <Bar 
                  dataKey="base_rate" 
                  stackId="rates"
                  name="Minimum Rate"
                  opacity={0.7}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`base-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                
                {/* Additional Rate (Spread) - Stacked Top */}
                <Bar 
                  dataKey="additional_rate" 
                  stackId="rates"
                  name="Rate Spread"
                  opacity={0.9}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`spread-${index}`} 
                      fill={entry.additional_rate > 0 ? entry.color : 'transparent'}
                    />
                  ))}
                </Bar>
              </>
            ) : (
              /* Minimum Rate Only */
              <Bar 
                dataKey="base_rate" 
                name="Minimum Rate"
                opacity={0.8}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`min-${index}`} fill={entry.color} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}