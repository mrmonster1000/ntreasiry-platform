/**
 * Chart helper utilities for coordinate conversion and chart interactions
 */

export interface ChartDimensions {
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface RateStep {
  base_rate: number;
  product_rate: number;
  beta: number;
  confidence: number;
  rate_environment: string;
  rate_change_from_current: number;
}

/**
 * Convert pixel X coordinate to BoE rate value
 */
export function convertPixelToBoERate(
  pixelX: number,
  chartDimensions: ChartDimensions,
  rateSteps: RateStep[]
): number {
  if (!chartDimensions || !rateSteps?.length) return 0;
  
  const rates = rateSteps.map(step => step.base_rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  
  const chartWidth = chartDimensions.width - 50; // Account for margins
  const leftMargin = 20;
  const relativeX = (pixelX - leftMargin) / chartWidth;
  
  const calculatedRate = minRate + (relativeX * (maxRate - minRate));
  return Math.max(minRate, Math.min(maxRate, calculatedRate));
}

/**
 * Convert BoE rate value to pixel X coordinate
 */
export function convertBoERateToPixel(
  boERate: number,
  chartDimensions: ChartDimensions,
  rateSteps: RateStep[]
): number {
  if (!chartDimensions || !rateSteps?.length) return 0;
  
  const rates = rateSteps.map(step => step.base_rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  
  const chartWidth = chartDimensions.width - 50;
  const leftMargin = 20;
  const relativePosition = (boERate - minRate) / (maxRate - minRate);
  
  return leftMargin + (relativePosition * chartWidth);
}

/**
 * Convert pixel Y coordinate to product rate value
 */
export function convertPixelToProductRate(
  pixelY: number,
  chartDimensions: ChartDimensions,
  rateSteps: RateStep[]
): number {
  if (!chartDimensions || !rateSteps?.length) return 0;
  
  const productRates = rateSteps.map(step => step.product_rate);
  const minRate = Math.min(...productRates);
  const maxRate = Math.max(...productRates);
  
  const chartHeight = chartDimensions.height - 40; // Account for margins
  const topMargin = 20;
  // Y-axis is inverted (0 at top)
  const relativeY = (pixelY - topMargin) / chartHeight;
  
  const calculatedRate = maxRate - (relativeY * (maxRate - minRate));
  return Math.max(minRate, Math.min(maxRate, calculatedRate));
}

/**
 * Convert product rate value to pixel Y coordinate
 */
export function convertProductRateToPixel(
  productRate: number,
  chartDimensions: ChartDimensions,
  rateSteps: RateStep[]
): number {
  if (!chartDimensions || !rateSteps?.length) return 0;
  
  const productRates = rateSteps.map(step => step.product_rate);
  const minRate = Math.min(...productRates);
  const maxRate = Math.max(...productRates);
  
  const chartHeight = chartDimensions.height - 40;
  const topMargin = 20;
  // Y-axis is inverted (0 at top)
  const relativePosition = (maxRate - productRate) / (maxRate - minRate);
  
  return topMargin + (relativePosition * chartHeight);
}

/**
 * Generate color palette for comparison lines
 */
export function getComparisonColors(): string[] {
  return [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#84cc16', // lime-500
    '#06b6d4'  // sky-500
  ];
}

/**
 * Format chart tooltip content
 */
export function formatTooltipContent(
  value: number,
  name: string,
  suffix: string = '%'
): [string, string] {
  const formattedValue = `${value.toFixed(2)}${suffix}`;
  const formattedName = name === 'product_rate' ? 'Product Rate' : 
                       name === 'base_rate' ? 'BoE Rate' :
                       name === 'min_rate' ? 'Market Min' :
                       name === 'max_rate' ? 'Market Max' :
                       name === 'midpoint_rate' ? 'Market Midpoint' :
                       name;
  
  return [formattedValue, formattedName];
}

/**
 * Format chart label
 */
export function formatChartLabel(value: number, suffix: string = '%'): string {
  return `${value.toFixed(2)}${suffix}`;
}

/**
 * Get beta sensitivity color and label
 */
export function getBetaSensitivity(beta: number): {
  color: string;
  bgColor: string;
  label: string;
} {
  if (beta >= 0.7) {
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      label: 'High Sensitivity'
    };
  } else if (beta >= 0.5) {
    return {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      label: 'Moderate Sensitivity'
    };
  } else if (beta >= 0.3) {
    return {
      color: 'text-lime-600',
      bgColor: 'bg-lime-50',
      label: 'Low Sensitivity'
    };
  } else {
    return {
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      label: 'Very Low Sensitivity'
    };
  }
}

/**
 * Calculate chart margins based on content
 */
export function calculateChartMargins(
  hasComparisons: boolean,
  hasAggregateLines: boolean
): { top: number; right: number; bottom: number; left: number } {
  return {
    top: 20,
    right: 30,
    left: hasComparisons || hasAggregateLines ? 70 : 60, // More space for Y-axis labels
    bottom: hasComparisons ? 80 : 60 // More space for legend
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for drag operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}