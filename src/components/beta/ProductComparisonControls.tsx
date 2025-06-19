'use client';

interface ProductComparisonControlsProps {
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
  comparisonProducts: string[];
  setComparisonProducts: (products: string[]) => void;
  availableLadders?: any[];
  showMinMaxLines: boolean;
  setShowMinMaxLines: (show: boolean) => void;
  showMidpointLine: boolean;
  setShowMidpointLine: (show: boolean) => void;
  showHistoricAverage: boolean;
  setShowHistoricAverage: (show: boolean) => void;
}

export default function ProductComparisonControls({
  showComparison,
  setShowComparison,
  comparisonProducts,
  setComparisonProducts,
  availableLadders = [],
  showMinMaxLines,
  setShowMinMaxLines,
  showMidpointLine,
  setShowMidpointLine,
  showHistoricAverage,
  setShowHistoricAverage
}: ProductComparisonControlsProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-medium text-gray-700">Rate Ladder Visualization</h4>
      <div className="flex items-center space-x-3">
        {/* Comparison Toggle */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-xs text-gray-600">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="mr-1"
            />
            Compare Products
          </label>
          {showComparison && (
            <select
              multiple
              value={comparisonProducts}
              onChange={(e) => setComparisonProducts(Array.from(e.target.selectedOptions, o => o.value))}
              className="text-xs border border-gray-300 rounded px-2 py-1 max-h-20 max-w-[200px]"
              size={3}
            >
              {availableLadders.slice(0, 8).map((ladder: any, idx: number) => (
                <option key={idx} value={`${ladder.bank_code}_${ladder.product}_${ladder.tier_number}`}>
                  {ladder.bank} {ladder.product}
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* Min/Max/Midpoint Controls */}
        {showComparison && comparisonProducts.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="flex items-center text-xs text-gray-600">
              <input
                type="checkbox"
                checked={showMinMaxLines}
                onChange={(e) => setShowMinMaxLines(e.target.checked)}
                className="mr-1"
              />
              Min/Max
            </label>
            <label className="flex items-center text-xs text-gray-600">
              <input
                type="checkbox"
                checked={showMidpointLine}
                onChange={(e) => setShowMidpointLine(e.target.checked)}
                className="mr-1"
              />
              Midpoint
            </label>
          </div>
        )}
        
        {/* Historic Strategy Comparison */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-xs text-gray-600">
            <input
              type="checkbox"
              checked={showHistoricAverage}
              onChange={(e) => setShowHistoricAverage(e.target.checked)}
              className="mr-1"
            />
            Historic Avg
          </label>
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <span>🎯 Interactive 2D:</span>
          <span className="text-amber-600">◯ Low→Mid</span>
          <span className="text-red-600">◯ Mid→High</span>
          <span className="text-blue-600">● Current (Fixed)</span>
          <span className="text-gray-400">↔↕ Drag both axes</span>
        </div>
      </div>
    </div>
  );
}