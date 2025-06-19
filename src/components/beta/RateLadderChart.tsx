'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface RateLadderChartProps {
  selectedLadder: any;
  interpolatedData?: any;
  comparisonLadders?: any[];
  showComparison: boolean;
  showMinMaxLines: boolean;
  showMidpointLine: boolean;
  showHistoricAverage: boolean;
  aggregateData?: any;
  betaConstructionConfig: any;
  onDragUpdate: (type: 'low-mid' | 'mid-high', boeRate: number, productRate: number) => void;
}

export default function RateLadderChart({
  selectedLadder,
  interpolatedData,
  comparisonLadders = [],
  showComparison,
  showMinMaxLines,
  showMidpointLine,
  showHistoricAverage,
  aggregateData,
  betaConstructionConfig,
  onDragUpdate
}: RateLadderChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState<{ width: number, height: number, left: number, top: number } | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  // Update chart dimensions when chart is rendered
  useEffect(() => {
    const updateChartDimensions = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        setChartDimensions({
          width: rect.width,
          height: rect.height,
          left: rect.left,
          top: rect.top
        });
      }
    };

    updateChartDimensions();
    window.addEventListener('resize', updateChartDimensions);
    return () => window.removeEventListener('resize', updateChartDimensions);
  }, [selectedLadder]);

  // Coordinate conversion functions
  const convertPixelToBoERate = useCallback((pixelX: number): number => {
    if (!chartDimensions || !selectedLadder?.rate_steps) return 0;
    
    const rates = selectedLadder.rate_steps.map((step: any) => step.base_rate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    
    const chartWidth = chartDimensions.width - 50;
    const leftMargin = 20;
    const relativeX = (pixelX - leftMargin) / chartWidth;
    
    const calculatedRate = minRate + (relativeX * (maxRate - minRate));
    return Math.max(minRate, Math.min(maxRate, calculatedRate));
  }, [chartDimensions, selectedLadder]);

  const convertBoERateToPixel = useCallback((boERate: number): number => {
    if (!chartDimensions || !selectedLadder?.rate_steps) return 0;
    
    const rates = selectedLadder.rate_steps.map((step: any) => step.base_rate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    
    const chartWidth = chartDimensions.width - 50;
    const leftMargin = 20;
    const relativePosition = (boERate - minRate) / (maxRate - minRate);
    
    return leftMargin + (relativePosition * chartWidth);
  }, [chartDimensions, selectedLadder]);

  const convertPixelToProductRate = useCallback((pixelY: number): number => {
    if (!chartDimensions || !selectedLadder?.rate_steps) return 0;
    
    const productRates = selectedLadder.rate_steps.map((step: any) => step.product_rate);
    const minRate = Math.min(...productRates);
    const maxRate = Math.max(...productRates);
    
    const chartHeight = chartDimensions.height - 40;
    const topMargin = 20;
    const relativeY = (pixelY - topMargin) / chartHeight;
    
    const calculatedRate = maxRate - (relativeY * (maxRate - minRate));
    return Math.max(minRate, Math.min(maxRate, calculatedRate));
  }, [chartDimensions, selectedLadder]);

  const convertProductRateToPixel = useCallback((productRate: number): number => {
    if (!chartDimensions || !selectedLadder?.rate_steps) return 0;
    
    const productRates = selectedLadder.rate_steps.map((step: any) => step.product_rate);
    const minRate = Math.min(...productRates);
    const maxRate = Math.max(...productRates);
    
    const chartHeight = chartDimensions.height - 40;
    const topMargin = 20;
    const relativePosition = (maxRate - productRate) / (maxRate - minRate);
    
    return topMargin + (relativePosition * chartHeight);
  }, [chartDimensions, selectedLadder]);

  // Drag handlers
  const handleDragStart = useCallback((event: React.MouseEvent, bubbleType: 'low-mid' | 'mid-high') => {
    setIsDragging(bubbleType);
    event.preventDefault();
  }, []);

  const handleDragMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !chartDimensions) return;

    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    
    const newBoERate = convertPixelToBoERate(currentX);
    const newProductRate = convertPixelToProductRate(currentY);
    
    onDragUpdate(isDragging as 'low-mid' | 'mid-high', newBoERate, newProductRate);
  }, [isDragging, chartDimensions, convertPixelToBoERate, convertPixelToProductRate, onDragUpdate]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  if (!selectedLadder) return null;

  const chartData = interpolatedData?.rate_steps || selectedLadder.rate_steps;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1'];

  return (
    <div className="h-96 border border-gray-200 rounded-lg p-4 relative overflow-hidden" ref={chartRef}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="base_rate" 
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12 }}
            label={{ value: 'BoE Rate (%)', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12 }}
            label={{ value: 'Product Rate (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}%`,
              name === 'product_rate' ? 'Product Rate' : name
            ]}
            labelFormatter={(value: number) => `BoE Rate: ${value.toFixed(2)}%`}
          />
          
          {/* Current BoE Rate */}
          <ReferenceLine 
            x={4.25} 
            stroke="#3b82f6" 
            strokeDasharray="5 5"
            label={{
              value: "Current BoE: 4.25%",
              position: 'top',
              offset: 5
            }}
          />
          
          {/* BoE Base Rate Line */}
          <ReferenceLine 
            y={4.25} 
            stroke="#059669" 
            strokeDasharray="2 2"
            strokeWidth={1}
            label={{
              value: "BoE Base Rate: 4.25%",
              position: 'insideTopLeft',
              offset: 5
            }}
          />
          
          {/* Main Product Line */}
          <Line 
            type="stepAfter" 
            dataKey="product_rate" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: 'white' }}
            name={selectedLadder ? `${selectedLadder.bank} ${selectedLadder.product} (Interactive)` : 'Main Product'}
          />
          
          {/* Comparison Lines */}
          {showComparison && comparisonLadders.map((ladder, index) => {
            if (!ladder) return null;
            const color = colors[index % colors.length];
            
            return (
              <Line 
                key={`${ladder.bank_code}_${ladder.product}_${ladder.tier_number}`}
                type="stepAfter" 
                dataKey="product_rate" 
                data={ladder.rate_steps}
                stroke={color} 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: color, strokeWidth: 0, r: 2 }}
                activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: 'white' }}
                name={`${ladder.bank} ${ladder.product}`}
              />
            );
          })}
          
          {/* Aggregate Lines */}
          {aggregateData && (
            <>
              {showMinMaxLines && (
                <>
                  <Line 
                    type="stepAfter" 
                    dataKey="min_rate" 
                    data={aggregateData}
                    stroke="#dc2626" 
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    dot={false}
                    name="Market Min"
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="max_rate" 
                    data={aggregateData}
                    stroke="#059669" 
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    dot={false}
                    name="Market Max"
                  />
                </>
              )}
              {showMidpointLine && (
                <Line 
                  type="stepAfter" 
                  dataKey="midpoint_rate" 
                  data={aggregateData}
                  stroke="#7c3aed" 
                  strokeWidth={2}
                  strokeDasharray="12 6"
                  dot={false}
                  name="Market Midpoint"
                />
              )}
            </>
          )}
          
          {/* Convexity Zone Boundaries */}
          <ReferenceLine 
            x={betaConstructionConfig.lowToMidConvexityZone} 
            stroke="#f59e0b" 
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Low→Mid: ${betaConstructionConfig.lowToMidConvexityZone.toFixed(2)}%`,
              position: 'top',
              offset: 5
            }}
          />
          <ReferenceLine 
            x={betaConstructionConfig.midToHighConvexityZone} 
            stroke="#ef4444" 
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Mid→High: ${betaConstructionConfig.midToHighConvexityZone.toFixed(2)}%`,
              position: 'top',
              offset: 5
            }}
          />
          
          {/* Legend with custom content to prevent overflow */}
          <Legend 
            verticalAlign="bottom" 
            height={50}
            wrapperStyle={{
              paddingTop: '20px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            content={({ payload }) => (
              <div className="flex flex-wrap justify-center gap-2 text-xs mt-2 max-w-full overflow-hidden">
                {payload?.slice(0, 5).map((entry: any, index: number) => (
                  <div key={index} className="flex items-center space-x-1">
                    <div 
                      className="w-3 h-0.5" 
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-gray-600 truncate max-w-[120px]">{entry.value}</span>
                  </div>
                ))}
                {payload && payload.length > 5 && (
                  <span className="text-gray-400">+{payload.length - 5} more</span>
                )}
              </div>
            )}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Interactive Draggable Bubbles */}
      {chartDimensions && (
        <>
          {/* Low to Mid Transition Bubble */}
          <div
            className={`absolute w-4 h-4 rounded-full border-2 border-amber-500 bg-amber-200 cursor-move transform -translate-x-2 -translate-y-2 transition-all duration-150 hover:scale-125 z-10 ${
              isDragging === 'low-mid' ? 'scale-125 shadow-lg bg-amber-300' : ''
            }`}
            style={{
              left: `${convertBoERateToPixel(betaConstructionConfig.lowToMidConvexityZone)}px`,
              top: `${convertProductRateToPixel(
                betaConstructionConfig.lowToMidProductRate ?? 
                selectedLadder.rate_steps.find((s: any) => Math.abs(s.base_rate - betaConstructionConfig.lowToMidConvexityZone) < 0.1)?.product_rate ?? 
                0
              )}px`
            }}
            onMouseDown={(e) => handleDragStart(e, 'low-mid')}
            title={`Low→Mid: ${betaConstructionConfig.lowToMidConvexityZone.toFixed(2)}% BoE, ${(betaConstructionConfig.lowToMidProductRate ?? 0).toFixed(2)}% Product`}
          />
          
          {/* Mid to High Transition Bubble */}
          <div
            className={`absolute w-4 h-4 rounded-full border-2 border-red-500 bg-red-200 cursor-move transform -translate-x-2 -translate-y-2 transition-all duration-150 hover:scale-125 z-10 ${
              isDragging === 'mid-high' ? 'scale-125 shadow-lg bg-red-300' : ''
            }`}
            style={{
              left: `${convertBoERateToPixel(betaConstructionConfig.midToHighConvexityZone)}px`,
              top: `${convertProductRateToPixel(
                betaConstructionConfig.midToHighProductRate ?? 
                selectedLadder.rate_steps.find((s: any) => Math.abs(s.base_rate - betaConstructionConfig.midToHighConvexityZone) < 0.1)?.product_rate ?? 
                0
              )}px`
            }}
            onMouseDown={(e) => handleDragStart(e, 'mid-high')}
            title={`Mid→High: ${betaConstructionConfig.midToHighConvexityZone.toFixed(2)}% BoE, ${(betaConstructionConfig.midToHighProductRate ?? 0).toFixed(2)}% Product`}
          />
          
          {/* Current Rate Fixed Point */}
          <div
            className="absolute w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-700 transform -translate-x-1.5 -translate-y-1.5 z-10"
            style={{
              left: `${convertBoERateToPixel(4.25)}px`,
              top: `${convertProductRateToPixel(selectedLadder.current_rate || 0)}px`
            }}
            title={`Current: 4.25% BoE, ${(selectedLadder.current_rate || 0).toFixed(2)}% Product (Fixed)`}
          />
        </>
      )}
      
      {/* Dragging Instructions */}
      {isDragging && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded z-20">
          Drag to adjust {isDragging === 'low-mid' ? 'Low→Mid' : 'Mid→High'} transition
          <br />X: BoE Rate | Y: Product Rate
        </div>
      )}
    </div>
  );
}