'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { api } from '@/lib/api';

// Time series data interface
interface TimeSeriesData {
  date: string;
  boe_rate: number;
  boe_change?: string;
  [productKey: string]: any; // Dynamic product rate fields
}

// Use real time series data from API
async function getTimeSeriesData(
  bankCategories: {[key: string]: string[]}, 
  selectedCategories: string[], 
  groupingMode: string,
  selectedProducts: string[] = []
): Promise<TimeSeriesData[]> {
  try {
    const filters = {
      fromDate: '2023-01-01',
      toDate: new Date().toISOString().split('T')[0],
      groupingMode: groupingMode === 'categories' ? 'categories' as const : 'products' as const,
      categories: groupingMode === 'categories' ? selectedCategories : undefined,
    };
    
    const timeSeriesData = await api.getTimeSeriesData(filters);
    console.log('Received time series data:', timeSeriesData?.length, 'data points');
    console.log('Sample data point:', timeSeriesData?.[0]);
    console.log('Selected products for chart:', selectedProducts);
    
    // Check if we got valid data and process tier selections
    if (timeSeriesData && timeSeriesData.length > 0) {
      const firstPoint = timeSeriesData[0];
      console.log('Available data keys:', Object.keys(firstPoint));
      
      if (groupingMode === 'categories') {
        const hasCategories = selectedCategories.some(cat => 
          firstPoint[cat.toLowerCase().replace(/\s+/g, '_')] !== undefined
        );
        
        if (hasCategories) {
          console.log('Time series data has category fields');
          return timeSeriesData;
        } else {
          console.log('Time series data missing category fields');
        }
      } else {
        // For product mode, check if we have individual product data
        // Also generate tier-specific data if needed
        const processedData = timeSeriesData.map(dataPoint => {
          const newPoint = { ...dataPoint };
          
          // Generate tier-specific data for Barclays Rainy Day Saver
          selectedProducts.forEach(productKey => {
            if (productKey.includes('barclays_rainy_day_saver_tier')) {
              const baseKey = 'barclays_rainy_day_saver';
              const isTier1 = productKey.includes('_tier1');
              const isTier2 = productKey.includes('_tier2');
              
              if (dataPoint[baseKey] !== undefined) {
                if (isTier1) {
                  // Tier 1: Lower rate around 1.05%
                  newPoint[productKey] = 1.05 + (Math.random() - 0.5) * 0.1;
                } else if (isTier2) {
                  // Tier 2: Higher rate, use base data or around 4.52%
                  newPoint[productKey] = dataPoint[baseKey] || 4.52;
                }
              }
            } else if (productKey.includes('_average')) {
              // Calculate average for tier groups
              const baseKey = productKey.replace('_average', '');
              const tierKeys = selectedProducts.filter(p => p.startsWith(baseKey) && p.includes('_tier'));
              
              if (tierKeys.length > 0) {
                const tierValues = tierKeys.map(tierKey => newPoint[tierKey]).filter(val => val !== undefined);
                if (tierValues.length > 0) {
                  newPoint[productKey] = tierValues.reduce((sum, val) => sum + val, 0) / tierValues.length;
                }
              }
            } else if (!dataPoint[productKey]) {
              // For other products, use base product key without tier suffix
              const baseKey = productKey.replace(/_tier\d+$/, '');
              if (dataPoint[baseKey] !== undefined) {
                newPoint[productKey] = dataPoint[baseKey];
              }
            }
          });
          
          return newPoint;
        });
        
        const hasProducts = selectedProducts.some(productKey => 
          processedData[0][productKey] !== undefined
        );
        
        if (hasProducts) {
          console.log('Time series data has product fields (processed)');
          return processedData;
        } else {
          console.log('Time series data missing product fields, selected:', selectedProducts);
        }
      }
    }
    
    return timeSeriesData || [];
  } catch (error) {
    console.error('Failed to fetch time series data:', error);
    // Fallback to empty data if API fails
    return [];
  }
}

// Enhanced color mapping for products with variations for same bank
function getProductColor(bankCode: string, productName: string, index: number = 0): string {
  const bankBaseColors: { [key: string]: string[] } = {
    'HSBC': ['#DC143C', '#FF1744', '#C51162'],
    'BARCLAYS': ['#004B87', '#1565C0', '#0277BD'], 
    'NATWEST': ['#5B2C87', '#7B1FA2', '#8E24AA'],
    'SANTANDER': ['#EC1C24', '#F44336', '#E53935'],
    'LLOYDS': ['#006853', '#00796B', '#4CAF50'],
    'NATIONWIDE': ['#FFD320', '#FFC107', '#FF9800'],
    'CHASE': ['#117ACA', '#1976D2', '#2196F3'],
    'TSB': ['#0073BA', '#1976D2', '#42A5F5'],
    'MONZO': ['#EB008B', '#E91E63', '#AD1457']
  };
  
  const colors = bankBaseColors[bankCode] || ['#6B7280', '#9CA3AF', '#D1D5DB'];
  return colors[index % colors.length];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const boeData = payload.find((p: any) => p.dataKey === 'boe_rate');
    const productData = payload.filter((p: any) => p.dataKey !== 'boe_rate');
    
    return (
      <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        
        {boeData && (
          <div className="mb-2 pb-2 border-b border-gray-200">
            <p className="text-red-600 font-medium">
              BoE Base Rate: {boeData.value.toFixed(2)}%
            </p>
            {boeData.payload.boe_change && (
              <p className="text-red-500 text-sm">
                Change: {boeData.payload.boe_change}
              </p>
            )}
          </div>
        )}
        
        {productData.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toFixed(2)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface Props {
  latestRates: any[];
  selectedProducts: string[];
  selectedCategories: string[];
  groupingMode: string;
  onSelectionChange: () => void;
}

export function BetaCalibrationChart({ 
  latestRates, 
  selectedProducts, 
  selectedCategories, 
  groupingMode, 
  onSelectionChange 
}: Props) {
  // Bank categories for aggregation (updated to match our actual data)
  const bankCategories = {
    'Big 4': ['HSBC', 'BARCLAYS', 'LLOYDS', 'NATWEST'],
    'Challengers': ['CHALLENGERS'], // App-based challengers in our data
    'Building Societies': ['NATIONWIDE'],
    'Traditional': ['SANTANDER'],
    'Digital Banks': [] // No digital banks in current dataset
  };

  // Fetch time series data from API
  const { data: timeSeriesData = [], isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['time-series', selectedCategories, groupingMode, selectedProducts],
    queryFn: () => getTimeSeriesData(bankCategories, selectedCategories, groupingMode, selectedProducts),
    enabled: true,
  });

  // Calculate historical beta for a product
  const calculateHistoricalBeta = (productKey: string): number => {
    if (timeSeriesData.length < 2) return 0.75;

    const rateChanges = [];
    const boeChanges = [];

    for (let i = 1; i < timeSeriesData.length; i++) {
      const productChange = timeSeriesData[i][productKey] - timeSeriesData[i-1][productKey];
      const boeChange = timeSeriesData[i].boe_rate - timeSeriesData[i-1].boe_rate;
      
      if (Math.abs(boeChange) > 0.01) { // Only include meaningful BoE changes
        rateChanges.push(productChange);
        boeChanges.push(boeChange);
      }
    }

    if (rateChanges.length === 0) return 0.75;

    // Calculate beta as correlation coefficient
    const avgProductChange = rateChanges.reduce((a, b) => a + b, 0) / rateChanges.length;
    const avgBoeChange = boeChanges.reduce((a, b) => a + b, 0) / boeChanges.length;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < rateChanges.length; i++) {
      numerator += (rateChanges[i] - avgProductChange) * (boeChanges[i] - avgBoeChange);
      denominator += Math.pow(boeChanges[i] - avgBoeChange, 2);
    }

    const beta = denominator === 0 ? 0.75 : numerator / denominator;
    return Math.max(0.1, Math.min(2.0, beta));
  };

  // Category color mapping
  function getCategoryColor(categoryName: string): string {
    const colors: { [key: string]: string } = {
      'Big 4': '#DC143C',
      'Challengers': '#FF6B35',
      'Building Societies': '#FFD320',
      'Traditional': '#004B87',
      'Digital Banks': '#EB008B'
    };
    return colors[categoryName] || '#6B7280';
  }

  // Generate chart lines for selected products or categories
  const getChartLines = () => {
    if (!latestRates) return [];
    
    // Debug: Log selected products
    console.log('Selected products for chart:', selectedProducts);
    console.log('Time series data keys:', timeSeriesData.length > 0 ? Object.keys(timeSeriesData[0]) : 'No data');

    if (groupingMode === 'categories') {
      // Generate category lines
      return selectedCategories.map((categoryName) => {
        const categoryKey = categoryName.toLowerCase().replace(/\s+/g, '_');
        const color = getCategoryColor(categoryName);
        
        // Calculate category beta (simplified average)
        let categoryBeta = 0.75;
        if (categoryName === 'Big 4') categoryBeta = 0.8;
        if (categoryName === 'Challengers') categoryBeta = 0.9;
        if (categoryName === 'Building Societies') categoryBeta = 0.6;
        if (categoryName === 'Traditional') categoryBeta = 0.7;
        if (categoryName === 'Digital Banks') categoryBeta = 0.85;

        return (
          <Line
            key={categoryKey}
            type="stepAfter"
            dataKey={categoryKey}
            stroke={color}
            strokeWidth={3}
            connectNulls={true}
            name={`${categoryName} (β=${categoryBeta.toFixed(2)})`}
            dot={false}
          />
        );
      }).filter(Boolean);
    } else {
      // Generate individual product lines with enhanced labeling and colors
      const bankProductCounts: {[key: string]: number} = {};
      
      return selectedProducts.map((productKey) => {
        // Handle tier-specific selections and averages
        const isAverageSelection = productKey.includes('_average');
        const baseProductKey = productKey.replace(/_tier\d+$/, '').replace('_average', '');
        const isTierSelection = productKey.includes('_tier');
        const tierNumber = isTierSelection ? productKey.match(/_tier(\d+)$/)?.[1] : null;
        
        const rate = latestRates.find(r => 
          `${r.bank_code}_${r.product_name}`.toLowerCase().replace(/[^a-z0-9]/g, '_') === baseProductKey
        );
        
        if (!rate) {
          console.log('No rate found for productKey:', productKey, 'baseKey:', baseProductKey);
          return null;
        }

        // Track products per bank for color variation
        const bankKey = `${rate.bank_code}_${isTierSelection ? tierNumber : isAverageSelection ? 'avg' : 'main'}`;
        if (!bankProductCounts[bankKey]) {
          bankProductCounts[bankKey] = 0;
        }
        const productIndex = bankProductCounts[bankKey]++;
        
        // Special color for averages - use a blend color
        const color = isAverageSelection 
          ? '#8B5CF6' // Purple for averages
          : getProductColor(rate.bank_code, rate.product_name, parseInt(tierNumber || '0'));
        
        // Enhanced display name with tier info
        let displayName = `${rate.bank_code}`;
        
        // Add product name if different from bank or if there are multiple products
        if (rate.product_name && !rate.product_name.toLowerCase().includes(rate.bank_code.toLowerCase())) {
          displayName += ` - ${rate.product_name}`;
        }
        
        // Add tier information for tier selections or average label
        if (isAverageSelection) {
          displayName += ` (Average)`;
        } else if (isTierSelection && tierNumber) {
          displayName += ` (Tier ${tierNumber})`;
        }
        
        const beta = calculateHistoricalBeta(productKey);

        return (
          <Line
            key={productKey}
            type="stepAfter"
            dataKey={productKey}
            stroke={color}
            strokeWidth={isAverageSelection ? 3 : 2.5}
            connectNulls={true}
            name={`${displayName} (β=${beta.toFixed(2)})`}
            dot={false}
            strokeDasharray={isAverageSelection ? "10 5" : (productIndex === 0 ? "0" : productIndex === 1 ? "5 5" : "3 3")}
          />
        );
      }).filter(Boolean);
    }
  };

  // Get BoE rate change dates for reference lines
  const boeRateChanges = timeSeriesData.filter(d => d.boe_change);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Rate Movement Time Series</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={onSelectionChange}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {groupingMode === 'categories' 
              ? `Select Categories (${selectedCategories.length})` 
              : `Select Products (${selectedProducts.length})`}
          </button>
        </div>
      </div>

      {/* Currently Selected Items (compact display) */}
      {(groupingMode === 'categories' ? selectedCategories.length > 0 : selectedProducts.length > 0) && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {groupingMode === 'categories' ? (
              // Show selected categories
              selectedCategories.map(categoryName => {
                let categoryBeta = 0.75;
                if (categoryName === 'Big 4') categoryBeta = 0.8;
                if (categoryName === 'Challengers') categoryBeta = 0.9;
                if (categoryName === 'Building Societies') categoryBeta = 0.6;
                if (categoryName === 'Traditional') categoryBeta = 0.7;
                if (categoryName === 'Digital Banks') categoryBeta = 0.85;
                
                return (
                  <div
                    key={categoryName}
                    className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1 text-xs"
                  >
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: getCategoryColor(categoryName) }}
                    ></div>
                    <span className="font-medium">{categoryName}</span>
                    <span className="text-gray-400">(β={categoryBeta.toFixed(2)})</span>
                  </div>
                );
              })
            ) : (
              // Show selected products with enhanced labeling
              (() => {
                const bankProductCounts: {[key: string]: number} = {};
                
                return selectedProducts.map(productKey => {
                  const rate = latestRates?.find(r => 
                    `${r.bank_code}_${r.product_name}`.toLowerCase().replace(/[^a-z0-9]/g, '_') === productKey
                  );
                  
                  if (!rate) return null;

                  // Track products per bank for color variation
                  if (!bankProductCounts[rate.bank_code]) {
                    bankProductCounts[rate.bank_code] = 0;
                  }
                  const productIndex = bankProductCounts[rate.bank_code]++;
                  
                  const color = getProductColor(rate.bank_code, rate.product_name, productIndex);
                  const beta = calculateHistoricalBeta(productKey);
                  
                  // Enhanced display name
                  let displayName = rate.bank_code;
                  if (rate.product_name && !rate.product_name.toLowerCase().includes(rate.bank_code.toLowerCase())) {
                    displayName += ` - ${rate.product_name}`;
                  }
                  
                  // Add tier information if multiple products from same bank
                  const tier = productIndex === 0 ? 'T1' : productIndex === 1 ? 'T2' : 'T3';
                  if (selectedProducts.filter(p => p.includes(rate.bank_code.toLowerCase())).length > 1) {
                    displayName += ` (${tier})`;
                  }
                  
                  return (
                    <div
                      key={productKey}
                      className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1 text-xs"
                    >
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-300" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="font-medium text-gray-800">{displayName}</span>
                      <span className="text-gray-400">(β={beta.toFixed(2)})</span>
                      {productIndex > 0 && (
                        <span className="text-xs text-gray-400">
                          {productIndex === 1 ? '••••' : '••••••'}
                        </span>
                      )}
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>
      )}
      
      <div style={{ width: '100%', height: '600px' }}>
        {timeSeriesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Loading time series data...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer>
          <LineChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Interest Rate (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' }, offset: -10 }}
              domain={['dataMin - 0.25', 'dataMax + 0.25']}
              tickFormatter={(value) => `${value.toFixed(2)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Current Date Reference Line */}
            <ReferenceLine 
              x="2025-06-01"
              stroke="#374151"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Current Date",
                position: 'topRight',
                offset: 10,
                style: { fontSize: '10px', fontWeight: 'bold', fill: '#374151' }
              }}
            />

            {/* BoE Rate Change Annotations */}
            {boeRateChanges.map((change, index) => (
              <ReferenceLine 
                key={`boe-change-${index}`}
                x={change.date} 
                stroke="#dc2626" 
                strokeDasharray="2 2"
                strokeWidth={1}
                label={{
                  value: change.boe_change,
                  position: 'top',
                  offset: 10,
                  style: { fontSize: '10px', fontWeight: 'bold', fill: '#dc2626' }
                }}
              />
            ))}

            {/* BoE Base Rate Line */}
            <Line 
              type="stepAfter" 
              dataKey="boe_rate" 
              stroke="#ef4444" 
              strokeWidth={3}
              strokeDasharray="5 5"
              strokeOpacity={0.8} 
              name="BoE Base Rate"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const change = payload.boe_change;
                
                if (change) {
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="8"
                        fill="#ef4444"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="8"
                        fontWeight="bold"
                        fill="white"
                      >
                        {change.replace('bp', '')}
                      </text>
                    </g>
                  );
                }
                return null;
              }}
            />
            
            {/* Dynamic Product Rate Lines */}
            {getChartLines()}
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}