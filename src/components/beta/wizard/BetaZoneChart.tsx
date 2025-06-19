'use client';

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
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
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface RateDataPoint {
  date: string;
  boeRate: number;
  productRates: {
    tierName: string;
    rate: number;
    confidence: number;
  }[];
}

interface ConvexityZone {
  id: string;
  name: string;
  threshold?: number;
  beta?: number;
  color: string;
}

interface BetaZoneChartProps {
  data?: RateDataPoint[];
  lowToMidThreshold?: string | number; // Legacy support
  midToHighThreshold?: string | number; // Legacy support
  zones?: ConvexityZone[]; // New dynamic zones
  onThresholdChange?: (lowToMid: string | number, midToHigh: string | number) => void;
  onZonesChange?: (zones: ConvexityZone[]) => void;
  onCommitZones?: () => void;
  editable?: boolean;
  height?: number;
  availableTiers?: string[];
  useRateThresholds?: boolean;
  zoneStrategy?: 'none' | 'zones' | 'through_cycle';
  onChangeStrategy?: () => void;
  currentStrategyDescription?: string;
}

// Generate mock time series data with BoE and product rates
const generateMockRateData = (availableTiers: string[] = ['Tier 1', 'Tier 2']): RateDataPoint[] => {
  const data: RateDataPoint[] = [];
  
  // BoE rate history timeline (2020-2023)
  const boeHistory = [
    { date: '2020-03-01', rate: 0.75 },
    { date: '2020-03-19', rate: 0.10 }, // COVID emergency cut
    { date: '2021-12-16', rate: 0.25 }, // First hike
    { date: '2022-02-03', rate: 0.50 },
    { date: '2022-03-17', rate: 0.75 },
    { date: '2022-05-05', rate: 1.00 },
    { date: '2022-06-16', rate: 1.25 },
    { date: '2022-08-04', rate: 1.75 },
    { date: '2022-09-22', rate: 2.25 },
    { date: '2022-11-03', rate: 3.00 },
    { date: '2022-12-15', rate: 3.50 },
    { date: '2023-02-02', rate: 4.00 },
    { date: '2023-03-23', rate: 4.25 },
    { date: '2023-05-11', rate: 4.50 },
    { date: '2023-06-22', rate: 5.00 },
    { date: '2023-08-03', rate: 5.25 },
  ];

  // Generate product rate responses for each BoE rate change
  boeHistory.forEach((boeEntry, index) => {
    const productRates = availableTiers.map((tierName, tierIndex) => {
      // Different tiers respond differently to BoE changes
      let baseRate = 2.0; // Starting product rate
      let beta = 0.5; // Base beta sensitivity
      
      // Tier-specific adjustments
      if (tierName.includes('1') || tierName.toLowerCase().includes('tier 1')) {
        baseRate = 1.5; // Lower tier gets lower rates
        beta = 0.3; // Less sensitive
      } else if (tierName.includes('2') || tierName.toLowerCase().includes('tier 2')) {
        baseRate = 3.0; // Higher tier gets higher rates  
        beta = 0.6; // More sensitive
      }
      
      // Calculate product rate based on BoE rate and beta
      let productRate = baseRate + (boeEntry.rate * beta);
      
      // Add some lag and stickiness - product rates don't move immediately
      if (index > 0) {
        const prevProductRate = baseRate + (boeHistory[index - 1].rate * beta);
        productRate = prevProductRate + ((productRate - prevProductRate) * 0.7); // 70% immediate response
      }
      
      // Add market conditions adjustments
      if (boeEntry.rate < 0.5) {
        // In ultra-low rate environment, maintain minimum margins
        productRate = Math.max(productRate, baseRate * 0.4);
      }
      
      // Add deterministic variation based on index instead of Math.random()
      const deterministicVariation = (index * 0.1 + tierIndex * 0.05) % 0.3;
      productRate += deterministicVariation;
      
      return {
        tierName,
        rate: Math.max(0.05, Math.min(8.0, parseFloat(productRate.toFixed(2)))),
        confidence: 0.9
      };
    });

    data.push({
      date: boeEntry.date,
      boeRate: boeEntry.rate,
      productRates
    });
  });
  
  return data;
};

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hoveredItem = payload.find((item: any) => item.dataKey !== 'boeRate') || payload[0];
    
    return (
      <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
        <div className="space-y-1 text-sm">
          <p className="text-gray-800 font-medium">
            <strong>Date:</strong> {new Date(data.date).toLocaleDateString()}
          </p>
          <p className="text-blue-600 font-medium">
            <strong>BoE Rate:</strong> {data.boeRate}%
          </p>
          
          {/* Show the hovered tier specifically */}
          {hoveredItem && hoveredItem.dataKey !== 'boeRate' && (
            <p className="text-green-600 font-medium">
              <strong>{hoveredItem.dataKey}:</strong> {hoveredItem.value?.toFixed(2)}%
              <span className="text-gray-500">
                {' '}(spread: +{(hoveredItem.value - data.boeRate).toFixed(2)}%)
              </span>
            </p>
          )}
          
          {/* Show all tiers if available in productRates */}
          {data.productRates && Array.isArray(data.productRates) && data.productRates.map((tier: any, index: number) => (
            <p key={index} className={`${hoveredItem?.dataKey === tier.tierName ? 'text-green-700 font-medium' : 'text-green-600'}` }>
              <strong>{tier.tierName}:</strong> {tier.rate}% 
              <span className="text-gray-500">
                (spread: +{(tier.rate - data.boeRate).toFixed(2)}%)
              </span>
            </p>
          ))}
          
          {/* Fallback: show all tier data from the chart data */}
          {(!data.productRates || !Array.isArray(data.productRates)) && Object.entries(data).map(([key, value]) => {
            if (key !== 'date' && key !== 'boeRate' && key !== 'dateLabel' && key !== 'productRate' && key !== 'confidence' && typeof value === 'number') {
              return (
                <p key={key} className={`${hoveredItem?.dataKey === key ? 'text-green-700 font-medium' : 'text-green-600'}`}>
                  <strong>{key}:</strong> {(value as number).toFixed(2)}%
                  <span className="text-gray-500">
                    {' '}(spread: +{((value as number) - data.boeRate).toFixed(2)}%)
                  </span>
                </p>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  }
  return null;
};

export function BetaZoneChart({
  data: providedData,
  lowToMidThreshold,
  midToHighThreshold,
  zones,
  onThresholdChange,
  onZonesChange,
  onCommitZones,
  editable = false,
  height = 400,
  availableTiers = ['Tier 1', 'Tier 2'],
  useRateThresholds = false,
  zoneStrategy,
  onChangeStrategy,
  currentStrategyDescription
}: BetaZoneChartProps) {
  const [visibleTiers, setVisibleTiers] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const chartRef = useRef<any>(null);

  // Use provided data or generate mock data
  const data = useMemo(() => {
    if (providedData && providedData.length > 0) {
      return providedData;
    }
    return generateMockRateData(availableTiers);
  }, [providedData, availableTiers]);

  // Initialize visible tiers (all visible by default)
  const visibleTiersFromData = useMemo(() => {
    if (data.length > 0) {
      const tierNames = new Set<string>();
      data.forEach(d => {
        if (d.productRates && Array.isArray(d.productRates)) {
          d.productRates.forEach(pr => tierNames.add(pr.tierName));
        }
      });
      
      const initialVisibility: Record<string, boolean> = {};
      tierNames.forEach(tier => {
        initialVisibility[tier] = true;
      });
      return initialVisibility;
    }
    return {};
  }, [data]);

  // Update visible tiers when data changes
  useEffect(() => {
    setVisibleTiers(visibleTiersFromData);
  }, [visibleTiersFromData]);

  // Helper function to calculate zone statistics
  const calculateZoneStats = useCallback((zoneData: RateDataPoint[]) => {
    if (zoneData.length === 0) return { avgProductRate: 0, avgSpread: 0, count: 0, avgBoE: 0, period: '' };
    
    const avgBoE = zoneData.reduce((sum, d) => sum + d.boeRate, 0) / zoneData.length;
    
    // Calculate average across all tiers
    let totalProductRate = 0;
    let tierCount = 0;
    zoneData.forEach(d => {
      if (d.productRates && Array.isArray(d.productRates)) {
        d.productRates.forEach(pr => {
          totalProductRate += pr.rate;
          tierCount++;
        });
      }
    });
    const avgProductRate = tierCount > 0 ? totalProductRate / tierCount : 0;
    const avgSpread = avgProductRate - avgBoE;
    
    const startDate = zoneData.length > 0 ? new Date(zoneData[0].date).toLocaleDateString() : '';
    const endDate = zoneData.length > 0 ? new Date(zoneData[zoneData.length - 1].date).toLocaleDateString() : '';
    
    return {
      avgProductRate: parseFloat(avgProductRate.toFixed(2)),
      avgSpread: parseFloat(avgSpread.toFixed(2)),
      avgBoE: parseFloat(avgBoE.toFixed(2)),
      count: zoneData.length,
      period: startDate === endDate ? startDate : `${startDate} - ${endDate}`
    };
  }, []);

  // Calculate zone statistics based on zones or legacy thresholds
  const zoneStats = useMemo(() => {
    if (zones && zones.length > 0) {
      // Use new dynamic zones
      const zoneData = zones.map((zone, index) => {
        const nextZone = zones[index + 1];
        const minThreshold = index === 0 ? -Infinity : zones[index - 1].threshold || -Infinity;
        const maxThreshold = zone.threshold || Infinity;
        
        const zoneDataPoints = data.filter(d => {
          if (useRateThresholds) {
            return d.boeRate > minThreshold && d.boeRate <= maxThreshold;
          } else {
            // For date-based (legacy), treat threshold as date string
            const zoneDate = new Date(maxThreshold.toString());
            const prevZoneDate = minThreshold === -Infinity ? new Date('1900-01-01') : new Date(minThreshold.toString());
            return new Date(d.date) > prevZoneDate && new Date(d.date) <= zoneDate;
          }
        });
        
        return {
          zone,
          dataPoints: zoneDataPoints,
          stats: calculateZoneStats(zoneDataPoints)
        };
      });
      
      return zoneData.reduce((acc, { zone, stats }) => {
        acc[zone.id] = stats;
        return acc;
      }, {} as Record<string, any>);
    }
    
    // Legacy mode with lowToMidThreshold/midToHighThreshold
    let lowZone, midZone, highZone;
    
    if (useRateThresholds) {
      // Filter by BoE rate levels
      const lowThreshold = Number(lowToMidThreshold);
      const highThreshold = Number(midToHighThreshold);
      
      lowZone = data.filter(d => d.boeRate <= lowThreshold);
      midZone = data.filter(d => d.boeRate > lowThreshold && d.boeRate <= highThreshold);
      highZone = data.filter(d => d.boeRate > highThreshold);
    } else {
      // Filter by dates (original behavior)
      const lowToMidDate = new Date(lowToMidThreshold!);
      const midToHighDate = new Date(midToHighThreshold!);
      
      lowZone = data.filter(d => new Date(d.date) <= lowToMidDate);
      midZone = data.filter(d => new Date(d.date) > lowToMidDate && new Date(d.date) <= midToHighDate);
      highZone = data.filter(d => new Date(d.date) > midToHighDate);
    }
    
    const calculateStats = calculateZoneStats;
    
    return {
      low: calculateStats(lowZone),
      mid: calculateStats(midZone),
      high: calculateStats(highZone)
    };
  }, [data, lowToMidThreshold, midToHighThreshold, useRateThresholds, zones, calculateZoneStats]);

  // Handle threshold changes and mark as unsaved
  const handleThresholdChange = (lowToMid: string | number, midToHigh: string | number) => {
    onThresholdChange?.(lowToMid, midToHigh);
    setHasUnsavedChanges(true);
  };

  // Handle commit zones
  const handleCommitZones = () => {
    onCommitZones?.();
    setHasUnsavedChanges(false);
  };

  // Toggle tier visibility
  const toggleTierVisibility = (tierName: string) => {
    setVisibleTiers(prev => ({
      ...prev,
      [tierName]: !prev[tierName]
    }));
  };

  // Prepare chart data for recharts
  const chartData = useMemo(() => {
    const chartData = data.map(d => {
      const point: any = {
        date: d.date,
        boeRate: d.boeRate,
        dateLabel: new Date(d.date).toLocaleDateString(),
        productRates: d.productRates // Keep original productRates for tooltip
      };
      
      // Add each tier as a separate field for line rendering
      if (d.productRates && Array.isArray(d.productRates)) {
        d.productRates.forEach(pr => {
          point[pr.tierName] = pr.rate;
        });
      }
      
      return point;
    });
    return chartData;
  }, [data, availableTiers]);

  // Calculate dynamic Y-axis range
  const yAxisRange = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { min: 0, max: 8 }; // Default range
    }

    let minRate = Infinity;
    let maxRate = -Infinity;
    
    chartData.forEach(point => {
      // Check BoE rate (always visible)
      if (typeof point.boeRate === 'number') {
        minRate = Math.min(minRate, point.boeRate);
        maxRate = Math.max(maxRate, point.boeRate);
      }
      
      // Check all visible tier rates only
      Object.entries(visibleTiers).forEach(([tierName, isVisible]) => {
        if (isVisible && typeof point[tierName] === 'number') {
          minRate = Math.min(minRate, point[tierName]);
          maxRate = Math.max(maxRate, point[tierName]);
        }
      });
    });

    // Add padding: 50bp (0.5%) above and below
    const padding = 0.5;
    const calculatedMin = Math.max(0, minRate - padding); // Don't go below 0%
    const calculatedMax = maxRate + padding;
    
    // Y-axis range calculated dynamically
    
    return { 
      min: Math.round(calculatedMin * 4) / 4, // Round to nearest 25bp
      max: Math.round(calculatedMax * 4) / 4  // Round to nearest 25bp
    };
  }, [chartData, visibleTiers]);

  return (
    <div className="space-y-4">
      {/* Tier Filter Controls */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 text-sm mb-2">Display Tiers</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(visibleTiers).map(([tierName, isVisible]) => (
            <label key={tierName} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => toggleTierVisibility(tierName)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{tierName}</span>
            </label>
          ))}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={true}
              readOnly
              className="w-4 h-4 text-red-600 border-gray-300 rounded"
            />
            <span className="text-red-700">BoE Base Rate</span>
          </label>
        </div>
      </div>

      {/* Zone statistics removed for cleaner interface */}

      {/* Main Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Rate Evolution Timeline (2020-2023)
          </h4>
          
          {/* Commit Button */}
          {editable && hasUnsavedChanges && (
            <button
              onClick={handleCommitZones}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Commit Zones</span>
            </button>
          )}
        </div>
        
        <ResponsiveContainer width="100%" height={height}>
          <LineChart 
            ref={chartRef}
            data={chartData} 
            margin={{ top: 20, right: 30, left: 40, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            
            {/* X-axis: Dates */}
            <XAxis 
              dataKey="dateLabel"
              tick={{ fontSize: 10, angle: -45 }}
              height={60}
              interval="preserveStartEnd"
              label={{ 
                value: 'Date', 
                position: 'insideBottom', 
                offset: -10,
                style: { textAnchor: 'middle', fontSize: '12px' }
              }}
            />
            
            {/* Y-axis: Interest rates */}
            <YAxis 
              label={{ 
                value: 'Interest Rate (%)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
              domain={[yAxisRange.min, yAxisRange.max]}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `${value.toFixed(2)}%`}
              ticks={(() => {
                // Generate ticks in 25bp (0.25%) increments within the dynamic range
                const ticks = [];
                const start = Math.floor(yAxisRange.min * 4) / 4; // Round down to nearest 25bp
                const end = Math.ceil(yAxisRange.max * 4) / 4;   // Round up to nearest 25bp
                
                for (let i = start; i <= end; i += 0.25) {
                  ticks.push(Number(i.toFixed(2)));
                }
                return ticks;
              })()}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Zone boundary lines */}
            {useRateThresholds ? (
              zones && zones.length > 0 ? (
                // Dynamic zones - draw lines based on zone thresholds
                zones.map((zone, index) => {
                  if (zone.threshold === undefined) return null; // Skip final zone with no threshold
                  
                  const nextZone = zones[index + 1];
                  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <ReferenceLine
                      key={zone.id}
                      y={Number(zone.threshold)}
                      stroke={color}
                      strokeDasharray="8 4"
                      strokeWidth={2}
                      label={{
                        value: `${zone.name}→${nextZone?.name || 'Max'} (${zone.threshold}%)`,
                        position: 'topLeft',
                        offset: 10 + (index * 20), // Offset each label to avoid overlap
                        style: { fontSize: '10px', fontWeight: 'bold', fill: color }
                      }}
                    />
                  );
                })
              ) : (
                // Legacy mode - use legacy thresholds
                <>
                  <ReferenceLine 
                    y={Number(lowToMidThreshold)} 
                    stroke="#3b82f6" 
                    strokeDasharray="8 4"
                    strokeWidth={2}
                    label={{
                      value: `Zone 1→2 (${lowToMidThreshold}%)`,
                      position: 'topLeft',
                      offset: 10,
                      style: { fontSize: '10px', fontWeight: 'bold', fill: '#3b82f6' }
                    }}
                  />
                  
                  <ReferenceLine 
                    y={Number(midToHighThreshold)} 
                    stroke="#ef4444" 
                    strokeDasharray="8 4"
                    strokeWidth={2}
                    label={{
                      value: `Zone 2→3 (${midToHighThreshold}%)`,
                      position: 'topLeft',
                      offset: 10,
                      style: { fontSize: '10px', fontWeight: 'bold', fill: '#ef4444' }
                    }}
                  />
                </>
              )
            ) : (
              <>
                {/* Vertical lines for date thresholds (original behavior) */}
                <ReferenceLine 
                  x={new Date(lowToMidThreshold).toLocaleDateString()} 
                  stroke="#3b82f6" 
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  label={{
                    value: `Zone 1→2`,
                    position: 'topLeft',
                    offset: 10,
                    style: { fontSize: '10px', fontWeight: 'bold', fill: '#3b82f6' }
                  }}
                />
                
                <ReferenceLine 
                  x={new Date(midToHighThreshold).toLocaleDateString()} 
                  stroke="#ef4444" 
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  label={{
                    value: `Zone 2→3`,
                    position: 'topLeft',
                    offset: 10,
                    style: { fontSize: '10px', fontWeight: 'bold', fill: '#ef4444' }
                  }}
                />
              </>
            )}
            
            {/* BoE Base Rate Line */}
            <Line 
              type="stepAfter" 
              dataKey="boeRate" 
              stroke="#dc2626" 
              strokeWidth={3}
              dot={false}
              name="BoE Base Rate"
              connectNulls={true}
            />
            
            {/* Product Tier Lines */}
            {Object.entries(visibleTiers).map(([tierName, isVisible], index) => {
              if (!isVisible) return null;
              
              const colors = ['#f59e0b', '#8b5cf6', '#10b981', '#06b6d4', '#84cc16']; // Orange first for Tier 1
              const color = colors[index % colors.length];
              
              return (
                <Line 
                  key={tierName}
                  type="stepAfter" 
                  dataKey={tierName} 
                  stroke={color} 
                  strokeWidth={2}
                  dot={false}
                  name={tierName}
                  connectNulls={true}
                  // All tiers use solid lines for clarity
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Zone Controls - Hidden since we use modal configuration */}
        {false && editable && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-gray-900">
                {zones && zones.length > 0 ? "Adjust Zone Boundaries" : "Adjust Zone Boundaries (Legacy)"}
              </h5>
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-amber-600">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span className="text-xs">Unsaved changes</span>
                </div>
              )}
            </div>
            
            {zones && zones.length > 0 ? (
              // Dynamic zones editor
              <div className="space-y-3">
                {zones.map((zone, index) => {
                  if (zone.threshold === undefined) return null; // Skip the final zone
                  
                  return (
                    <div key={zone.id} className="flex items-center space-x-3 bg-white rounded border p-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">
                          {zone.name} → {zones[index + 1]?.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">
                          {useRateThresholds ? "Max BoE Rate:" : "Boundary Date:"}
                        </span>
                        <input
                          type={useRateThresholds ? "number" : "date"}
                          value={zone.threshold}
                          onChange={(e) => {
                            if (onZonesChange) {
                              const updatedZones = [...zones];
                              updatedZones[index] = { 
                                ...zone, 
                                threshold: useRateThresholds ? parseFloat(e.target.value) : e.target.value 
                              };
                              onZonesChange(updatedZones);
                              setHasUnsavedChanges(true);
                            }
                          }}
                          min={useRateThresholds ? "0" : undefined}
                          max={useRateThresholds ? "10" : undefined}
                          step={useRateThresholds ? "0.25" : undefined}
                          className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                        {useRateThresholds && <span className="text-xs text-gray-600">%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Legacy mode
              !useRateThresholds && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Zone 1 → Zone 2 Boundary Date
                    </label>
                    <input
                      type="date"
                      value={String(lowToMidThreshold)}
                      onChange={(e) => handleThresholdChange(e.target.value, String(midToHighThreshold))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Zone 2 → Zone 3 Boundary Date
                    </label>
                    <input
                      type="date"
                      value={String(midToHighThreshold)}
                      onChange={(e) => handleThresholdChange(String(lowToMidThreshold), e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )
            )}
            
            <div className="mt-3 text-xs text-gray-600">
              💡 <strong>Tip:</strong> Set boundaries where you observe changes in rate sensitivity. 
              Look for periods where product tiers became more or less responsive to BoE rate changes.
            </div>
          </div>
        )}
      </div>

      {/* Convexity Strategy Configuration */}
      {onChangeStrategy && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Convexity Strategy</h5>
              <p className="text-xs text-gray-600 mt-1">
                {currentStrategyDescription || 'Configure how to model rate sensitivity across different market conditions'}
              </p>
            </div>
            <button
              onClick={onChangeStrategy}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Change Strategy
            </button>
          </div>
        </div>
      )}

      {/* Analysis Insights */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-purple-900 mb-2">Time Series Analysis</h5>
        <div className="space-y-2 text-xs text-purple-800">
          <div>
            <strong>Timeline:</strong> {data.length > 0 ? new Date(data[0].date).toLocaleDateString() : ''} - {data.length > 0 ? new Date(data[data.length - 1].date).toLocaleDateString() : ''}
          </div>
          <div>
            <strong>BoE Rate Range:</strong> {data.length > 0 ? Math.min(...data.map(d => d.boeRate)).toFixed(2) : 0}% - {data.length > 0 ? Math.max(...data.map(d => d.boeRate)).toFixed(2) : 0}%
          </div>
          <div>
            <strong>Time Periods:</strong> {
              zones && zones.length > 0 
                ? zones.map((zone, index) => `${zone.name}(${zoneStats[zone.id]?.count || 0})`).join(' | ') + ' data points'
                : `Early(${zoneStats.low?.count || 0}) | Middle(${zoneStats.mid?.count || 0}) | Later(${zoneStats.high?.count || 0}) data points`
            }
          </div>
          <div>
            <strong>Available Tiers:</strong> {Object.keys(visibleTiers).join(', ')}
          </div>
          
          {/* Validation warnings */}
          {zones && zones.length > 0 ? (
            // Dynamic zones validation
            zones.map((zone, index) => {
              const stats = zoneStats[zone.id];
              if (!stats || stats.count === 0) {
                return (
                  <div key={zone.id} className="text-amber-700">
                    ⚠️ {zone.name} has no data points - consider adjusting the boundary
                  </div>
                );
              }
              return null;
            })
          ) : (
            // Legacy zones validation
            <>
              {zoneStats.low?.count === 0 && (
                <div className="text-amber-700">
                  ⚠️ Early period has no data points - consider adjusting the boundary date
                </div>
              )}
              {zoneStats.high?.count === 0 && (
                <div className="text-amber-700">
                  ⚠️ Later period has no data points - consider adjusting the boundary date
                </div>
              )}
              {Math.abs((zoneStats.low?.avgSpread || 0) - (zoneStats.high?.avgSpread || 0)) < 0.2 && (
                <div className="text-amber-700">
                  ⚠️ Early and later period spreads are very similar - boundaries may need adjustment
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}