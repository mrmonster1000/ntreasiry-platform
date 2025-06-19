/**
 * Shared beta calculation utilities for the beta analysis system
 */

export interface BetaConfig {
  maxSpreadOverBase: number;
  maxAbsoluteSpread: number;
  maxSpreadUnderBase: number;
  minSpreadUnderBase: number;
  naturalStrategy: number;
  rateEnvironmentStrategy: number;
  lowToMidConvexityZone: number;
  midToHighConvexityZone: number;
  lowToMidProductRate?: number | null;
  midToHighProductRate?: number | null;
  newEntrantPressure: number;
  marketShareDefence: number;
  pricingEnvironment: number;
  lowRateBetaMultiplier: number;
  midRateBetaMultiplier: number;
  highRateBetaMultiplier: number;
  cutSensitivityOverride?: number | null;
  hikeSensitivityOverride?: number | null;
}

export interface RateStep {
  base_rate: number;
  product_rate: number;
  beta: number;
  confidence: number;
  rate_environment: string;
  rate_change_from_current: number;
}

export interface Ladder {
  bank: string;
  bank_code: string;
  product: string;
  tier: string;
  tier_number: number;
  current_rate: number;
  rate_steps: RateStep[];
}

export interface StrategyAnalysis {
  rateEnvironmentScore: number;
  franchiseScore: number;
  naturalWeight: number;
  rateEnvWeight: number;
  currentSpread: number;
  avgSpread: number;
  aggressiveness: number;
}

/**
 * Generate interpolated rate ladder based on configuration
 */
export function generateInterpolatedLadder(
  selectedLadder: Ladder,
  config: BetaConfig
): Ladder | null {
  if (!selectedLadder?.rate_steps) return null;

  const newRateSteps = selectedLadder.rate_steps.map((step: RateStep) => {
    const baseRate = step.base_rate;
    const currentRate = selectedLadder.current_rate || 0;
    
    // Determine rate environment
    let environment = 'mid';
    if (baseRate <= config.lowToMidConvexityZone) environment = 'low';
    else if (baseRate >= config.midToHighConvexityZone) environment = 'high';
    
    // Calculate beta multiplier based on environment
    let betaMultiplier = config.midRateBetaMultiplier;
    if (environment === 'low') betaMultiplier = config.lowRateBetaMultiplier;
    else if (environment === 'high') betaMultiplier = config.highRateBetaMultiplier;
    
    // Calculate interpolated product rate
    const rateChange = baseRate - 4.25; // Change from current BoE rate
    const baseBeta = step.beta || 0.75; // Default beta if not provided
    const adjustedBeta = baseBeta * betaMultiplier;
    
    // Apply strategy weights
    const naturalComponent = config.naturalStrategy * adjustedBeta * rateChange;
    const rateEnvComponent = config.rateEnvironmentStrategy * 
      (environment === 'high' ? 1.2 : environment === 'low' ? 0.8 : 1.0) * rateChange;
    
    const rateAdjustment = naturalComponent + rateEnvComponent;
    let newProductRate = currentRate + rateAdjustment;
    
    // Apply constraints
    const spread = newProductRate - baseRate;
    const maxSpread = config.maxSpreadOverBase / 100;
    const minSpread = -config.maxSpreadUnderBase / 100;
    
    if (spread > maxSpread) {
      newProductRate = baseRate + maxSpread;
    } else if (spread < minSpread) {
      newProductRate = baseRate + minSpread;
    }
    
    // Calculate effective beta
    const effectiveBeta = rateChange !== 0 ? 
      (newProductRate - currentRate) / rateChange : adjustedBeta;
    
    return {
      ...step,
      product_rate: Math.round(newProductRate * 100) / 100,
      beta: Math.round(effectiveBeta * 1000) / 1000,
      rate_environment: environment
    };
  });

  return {
    ...selectedLadder,
    rate_steps: newRateSteps
  };
}

/**
 * Analyze current strategy positioning
 */
export function analyzeStrategy(
  selectedLadder: Ladder,
  config: BetaConfig,
  interpolatedLadder?: Ladder
): StrategyAnalysis | null {
  if (!selectedLadder?.rate_steps) return null;

  const currentRate = selectedLadder.current_rate || 0;
  const lowMidRate = config.lowToMidProductRate ?? 0;
  const midHighRate = config.midToHighProductRate ?? 0;
  
  // Calculate spreads over base rate
  const currentSpread = currentRate - 4.25;
  const lowMidSpread = lowMidRate - config.lowToMidConvexityZone;
  const midHighSpread = midHighRate - config.midToHighConvexityZone;

  // Rate environment strategy analysis
  const avgSpread = (lowMidSpread + currentSpread + midHighSpread) / 3;
  const rateEnvironmentScore = Math.max(0, Math.min(1, (avgSpread + 2) / 4));

  // Franchise vs Acquisition strategy
  const maxConstraint = config.maxSpreadOverBase / 100;
  const aggressiveness = Math.max(avgSpread, 0) / maxConstraint;
  const franchiseScore = 1 - Math.max(0, Math.min(1, aggressiveness));

  // Natural vs Rate Environment balance
  const naturalWeight = config.naturalStrategy;
  const rateEnvWeight = config.rateEnvironmentStrategy;

  return {
    rateEnvironmentScore,
    franchiseScore,
    naturalWeight,
    rateEnvWeight,
    currentSpread: currentSpread * 100, // in bp
    avgSpread: avgSpread * 100, // in bp
    aggressiveness
  };
}

/**
 * Calculate aggregate data across multiple products
 */
export function calculateAggregateData(
  ladders: Ladder[],
  includeMainLadder: boolean = true,
  mainLadder?: Ladder
): Array<{
  base_rate: number;
  min_rate: number;
  max_rate: number;
  midpoint_rate: number;
  product_count: number;
}> | null {
  const allLadders = [
    ...(includeMainLadder && mainLadder ? [mainLadder] : []),
    ...ladders
  ];

  if (allLadders.length < 2) return null;

  // Create aggregated data points for each base rate
  const allBaseRates = new Set<number>();
  allLadders.forEach(ladder => {
    ladder.rate_steps?.forEach((step: RateStep) => {
      allBaseRates.add(step.base_rate);
    });
  });

  return Array.from(allBaseRates).sort((a, b) => a - b).map(baseRate => {
    const productRatesAtThisBaseRate: number[] = [];
    
    allLadders.forEach(ladder => {
      const matchingStep = ladder.rate_steps?.find((step: RateStep) => 
        Math.abs(step.base_rate - baseRate) < 0.01
      );
      if (matchingStep?.product_rate !== undefined) {
        productRatesAtThisBaseRate.push(matchingStep.product_rate);
      }
    });

    if (productRatesAtThisBaseRate.length === 0) return null;

    const minRate = Math.min(...productRatesAtThisBaseRate);
    const maxRate = Math.max(...productRatesAtThisBaseRate);
    const midpointRate = (minRate + maxRate) / 2;

    return {
      base_rate: baseRate,
      min_rate: minRate,
      max_rate: maxRate,
      midpoint_rate: midpointRate,
      product_count: productRatesAtThisBaseRate.length
    };
  }).filter(Boolean) as Array<{
    base_rate: number;
    min_rate: number;
    max_rate: number;
    midpoint_rate: number;
    product_count: number;
  }>;
}

/**
 * Get bank brand color
 */
export function getBankColor(bankCode: string): string {
  const bankColors: Record<string, string> = {
    'HSBC': '#DB0011',
    'BARCLAYS': '#00AEEF',
    'LLOYDS': '#006A4D',
    'NATWEST': '#5A287F',
    'SANTANDER': '#EC0000',
    'TSB': '#004883',
    'NATIONWIDE': '#00A9CE',
    'CHASE': '#117ACA',
    'MARCUS': '#000000',
    'STARLING': '#6935D3',
    'MONZO': '#FF6B6B'
  };
  return bankColors[bankCode] || '#64748b';
}