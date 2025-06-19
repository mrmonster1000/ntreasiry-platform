'use client';

import React, { useState, useCallback } from 'react';
import { 
  LockClosedIcon,
  LockOpenIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ArrowPathIcon,
  PlayIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface TierConfig {
  // Beta Multipliers
  lowRateBetaMultiplier: number;
  highRateBetaMultiplier: number;
  
  // Convexity Zones (BoE rate breakpoints)  
  lowToMidConvexityZone: number;
  midToHighConvexityZone: number;
}

// Calibration method types
type CalibrationMethod = 'manual' | 'historical' | 'inherit';

type HistoricalApproach = 'zone_based' | 'through_cycle';

type HistoricalMethodology = 
  | 'simple_average'      // (hikes + cuts) / 2
  | 'directional_weighted' // separate hike/cut betas
  | 'rolling_average'     // last N rate changes
  | 'regression_fit';     // full historical regression

interface ConvexityZoneConfig {
  lowToMidThreshold: number;
  midToHighThreshold: number;
  autoDetect: boolean;
  confidence?: number;
}

interface HistoricalConfig {
  approach: HistoricalApproach;
  methodology: HistoricalMethodology;
  timePeriod: {
    startDate?: string;
    endDate?: string;
    preset?: 'last_2_years' | 'last_year' | 'custom';
  };
  excludeOutliers: boolean;
  // Zone-based specific config
  convexityZones?: ConvexityZoneConfig;
  // Through-cycle specific config
  throughCycle?: {
    rateStepSize: number; // e.g., 0.25% steps
    smoothing: boolean; // smooth out noise in beta calculations
  };
}

interface InheritanceConfig {
  sourceProductId: string;
  sourceProductName: string;
  modificationLevel: 'exact_copy' | 'copy_and_adjust' | 'structure_only';
  competitorTracking?: {
    enabled: boolean;
    spreadBasisPoints: number; // spread over competitor
    updateFrequency: 'realtime' | 'daily' | 'manual';
  };
}

interface BetaConfig {
  // Calibration workflow
  calibrationMethod: CalibrationMethod;
  historicalConfig?: HistoricalConfig;
  inheritanceConfig?: InheritanceConfig;
  
  // Global Constraints (apply to all tiers)
  maxSpreadOverBase: number; // basis points
  maxSpreadUnderBase: number; // basis points
  rateFloor: number; // percentage
  rateCeiling: number; // percentage
  
  // Constraint activation flags
  rateFloorActive: boolean;
  rateCeilingActive: boolean;
  maxSpreadOverBaseActive: boolean;
  maxSpreadUnderBaseActive: boolean;
  
  // Tier-Specific Configurations
  tierConfigs: Record<string, TierConfig>;
}

interface ProductTier {
  tier_name: string;
  rate: number;
  balance_range: string;
}

interface CurrentProduct {
  bank_code: string;
  product_name: string;
  tiers: ProductTier[];
}

interface SafeBetaLadderBuilderProps {
  initialConfig?: Partial<BetaConfig>;
  onConfigChange?: (config: BetaConfig) => void;
  disabled?: boolean;
  currentProduct?: CurrentProduct;
}

const DEFAULT_TIER_CONFIG: TierConfig = {
  lowRateBetaMultiplier: 0.8,
  highRateBetaMultiplier: 1.2,
  lowToMidConvexityZone: 2.0,
  midToHighConvexityZone: 4.0
};

const DEFAULT_CONFIG: BetaConfig = {
  // Default to manual calibration
  calibrationMethod: 'manual',
  
  maxSpreadOverBase: 150, // 1.5%
  maxSpreadUnderBase: 100, // 1.0%
  rateFloor: 0.1,
  rateCeiling: 8.0,
  // Only rate floor is active by default
  rateFloorActive: true,
  rateCeilingActive: false,
  maxSpreadOverBaseActive: false,
  maxSpreadUnderBaseActive: false,
  tierConfigs: {}
};

export function SafeBetaLadderBuilder({
  initialConfig = {},
  onConfigChange,
  disabled = false,
  currentProduct
}: SafeBetaLadderBuilderProps) {
  const [config, setConfig] = useState<BetaConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });
  
  const [isLocked, setIsLocked] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [activeTierTab, setActiveTierTab] = useState<string>('');
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationResults, setCalibrationResults] = useState<any>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Initialize tier configs when product changes
  React.useEffect(() => {
    if (currentProduct?.tiers) {
      const newTierConfigs: Record<string, TierConfig> = {};
      
      currentProduct.tiers.forEach(tier => {
        const tierKey = tier.tier_name.toLowerCase().replace(/\s+/g, '_');
        if (!config.tierConfigs[tierKey]) {
          newTierConfigs[tierKey] = { ...DEFAULT_TIER_CONFIG };
        } else {
          newTierConfigs[tierKey] = config.tierConfigs[tierKey];
        }
      });
      
      if (Object.keys(newTierConfigs).length > 0) {
        setConfig(prev => ({
          ...prev,
          tierConfigs: newTierConfigs
        }));
        
        // Set first tier as active tab
        if (!activeTierTab || !newTierConfigs[activeTierTab]) {
          setActiveTierTab(Object.keys(newTierConfigs)[0]);
        }
      }
    }
  }, [currentProduct, activeTierTab]);

  // Get validation constraints from current product
  const getProductRateConstraints = () => {
    if (!currentProduct?.tiers || currentProduct.tiers.length === 0) {
      return null;
    }
    
    const rates = currentProduct.tiers.map(tier => tier.rate);
    return {
      minTierRate: Math.min(...rates),
      maxTierRate: Math.max(...rates),
      tiers: currentProduct.tiers
    };
  };

  // Safe update function for global parameters
  const updateGlobalConfig = useCallback((updates: Partial<Omit<BetaConfig, 'tierConfigs'>>) => {
    if (isLocked || disabled) return;

    const newConfig = { ...config, ...updates };
    const productConstraints = getProductRateConstraints();
    
    // Validation checks (only for active constraints)
    const errors = [];
    
    if (newConfig.rateFloorActive && newConfig.rateCeilingActive && newConfig.rateFloor >= newConfig.rateCeiling) {
      errors.push('Rate floor must be less than rate ceiling');
    }
    
    if ((newConfig.maxSpreadOverBaseActive && newConfig.maxSpreadOverBase < 0) || 
        (newConfig.maxSpreadUnderBaseActive && newConfig.maxSpreadUnderBase < 0)) {
      errors.push('Spreads cannot be negative');
    }

    // Product-specific rate floor validation (only if active)
    if (newConfig.rateFloorActive && productConstraints && newConfig.rateFloor >= productConstraints.minTierRate) {
      const violatingTier = productConstraints.tiers.find(tier => newConfig.rateFloor >= tier.rate);
      errors.push(`Rate floor (${newConfig.rateFloor.toFixed(2)}%) cannot exceed ${violatingTier?.tier_name} rate (${violatingTier?.rate.toFixed(2)}%)`);
    }

    setHasErrors(errors.length > 0);
    
    if (errors.length === 0) {
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    }
  }, [config, isLocked, disabled, onConfigChange, getProductRateConstraints]);

  // Safe update function for tier-specific parameters
  const updateTierConfig = useCallback((tierKey: string, updates: Partial<TierConfig>) => {
    if (isLocked || disabled) return;

    const newTierConfig = { ...config.tierConfigs[tierKey], ...updates };
    
    // Validation checks for tier-specific parameters
    const errors = [];
    
    if (newTierConfig.lowToMidConvexityZone >= newTierConfig.midToHighConvexityZone) {
      errors.push('Low→Mid zone must be less than Mid→High zone');
    }

    setHasErrors(errors.length > 0);
    
    if (errors.length === 0) {
      const newConfig = {
        ...config,
        tierConfigs: {
          ...config.tierConfigs,
          [tierKey]: newTierConfig
        }
      };
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    }
  }, [config, isLocked, disabled, onConfigChange]);

  // Historical calibration function
  const runHistoricalCalibration = useCallback(async () => {
    if (!currentProduct || !config.historicalConfig) return;
    
    setIsCalibrating(true);
    
    try {
      // Simulate API call - in real implementation would fetch historical data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const approach = config.historicalConfig.approach || 'zone_based';
      const methodology = config.historicalConfig.methodology || 'simple_average';
      const timePeriod = config.historicalConfig.timePeriod?.preset || 'last_2_years';
      const excludeOutliers = config.historicalConfig.excludeOutliers || false;
      
      // Generate mock historical data for calculations
      const generateHistoricalData = () => {
        const data = [];
        let currentBoE = 0.75; // Starting BoE rate
        
        for (let i = 0; i < 24; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - (24 - i));
          
          // Simulate BoE rate changes
          const rateChange = (Math.random() - 0.5) * 1.0; // Random change ±0.5%
          currentBoE = Math.max(0.1, Math.min(6.0, currentBoE + rateChange));
          
          const dataPoint = {
            date: date.toISOString().slice(0, 7), // YYYY-MM format
            boeRate: currentBoE,
            boeChange: i > 0 ? currentBoE - data[i-1].boeRate : 0,
            tiers: {} as Record<string, { rate: number, change: number }>
          };
          
          // Generate tier rates based on BoE rate
          currentProduct.tiers.forEach(tier => {
            const tierKey = tier.tier_name.toLowerCase().replace(/\s+/g, '_');
            const baseSensitivity = tier.rate > 3.0 ? 0.7 : 0.2; // Higher tiers more sensitive
            const tierRate = Math.max(0.05, tier.rate + (currentBoE - 4.75) * baseSensitivity);
            const tierChange = i > 0 ? tierRate - data[i-1].tiers[tierKey]?.rate || 0 : 0;
            
            dataPoint.tiers[tierKey] = {
              rate: tierRate,
              change: tierChange
            };
          });
          
          data.push(dataPoint);
        }
        return data;
      };
      
      const historicalData = generateHistoricalData();
      
      // Initialize results structure based on approach
      const results = {
        approach,
        methodology,
        timePeriod,
        excludeOutliers,
        historicalData,
        tierResults: {} as Record<string, any>,
        sampleSize: 24, // months of data
        overallConfidence: methodology === 'regression_fit' ? 91 : 82
      } as any;

      if (approach === 'zone_based') {
        // Set up convexity zones from config or auto-detect
        const convexityConfig = config.historicalConfig.convexityZones;
        if (convexityConfig?.autoDetect === false) {
          results.convexityZones = {
            detected: false,
            lowToMid: convexityConfig.lowToMidThreshold,
            midToHigh: convexityConfig.midToHighThreshold,
            confidence: 100 // User-defined
          };
        } else {
          // Auto-detect zones
          results.convexityZones = {
            detected: true,
            lowToMid: methodology === 'regression_fit' ? 3.75 : 3.0,
            midToHigh: methodology === 'regression_fit' ? 5.25 : 5.0,
            confidence: methodology === 'regression_fit' ? 94 : 78
          };
        }
      } else {
        // Through-cycle approach - no zones needed
        const throughCycleConfig = config.historicalConfig.throughCycle;
        results.throughCycleConfig = {
          rateStepSize: throughCycleConfig?.rateStepSize || 0.25,
          smoothing: throughCycleConfig?.smoothing || true
        };
      }
      
      // Calculate beta for each tier with approach-specific logic
      currentProduct.tiers.forEach(tier => {
        const tierKey = tier.tier_name.toLowerCase().replace(/\s+/g, '_');
        
        // Extract relevant data for this tier
        const tierData = historicalData
          .filter((d, i) => i > 0) // Skip first data point (no change)
          .map(d => ({
            date: d.date,
            boeChange: d.boeChange,
            tierChange: d.tiers[tierKey]?.change || 0,
            boeRate: d.boeRate,
            tierRate: d.tiers[tierKey]?.rate || tier.rate
          }))
          .filter(d => Math.abs(d.boeChange) > 0.01); // Only meaningful BoE changes
        
        // Separate hikes and cuts
        const hikes = tierData.filter(d => d.boeChange > 0);
        const cuts = tierData.filter(d => d.boeChange < 0);

        if (approach === 'zone_based') {
          // Zone-based calculation logic
          const lowZoneThreshold = results.convexityZones.lowToMid;
          const midZoneThreshold = results.convexityZones.midToHigh;
        
          const lowZoneData = tierData.filter(d => d.boeRate <= lowZoneThreshold);
          const midZoneData = tierData.filter(d => d.boeRate > lowZoneThreshold && d.boeRate <= midZoneThreshold);
          const highZoneData = tierData.filter(d => d.boeRate > midZoneThreshold);
        
        // Calculate zone-specific betas
        const calculateZoneBeta = (zoneData: any[], zoneName: string) => {
          if (zoneData.length < 2) return { beta: 0, rSquared: 0, count: 0 };
          
          let beta, rSquared;
          
          switch (methodology) {
            case 'simple_average': {
              const totalTierChange = zoneData.reduce((sum, d) => sum + Math.abs(d.tierChange), 0);
              const totalBoeChange = zoneData.reduce((sum, d) => sum + Math.abs(d.boeChange), 0);
              beta = totalBoeChange > 0 ? totalTierChange / totalBoeChange : 0;
              rSquared = 0.75;
              break;
            }
            case 'directional_weighted': {
              const hikes = zoneData.filter(d => d.boeChange > 0);
              const cuts = zoneData.filter(d => d.boeChange < 0);
              const hikeBeta = hikes.length > 0 ? 
                hikes.reduce((sum, d) => sum + d.tierChange, 0) / hikes.reduce((sum, d) => sum + d.boeChange, 0) : 0;
              const cutBeta = cuts.length > 0 ? 
                Math.abs(cuts.reduce((sum, d) => sum + d.tierChange, 0) / cuts.reduce((sum, d) => sum + d.boeChange, 0)) : 0;
              beta = (Math.abs(hikeBeta) + cutBeta) / 2;
              rSquared = 0.80;
              break;
            }
            case 'rolling_average': {
              const recentData = zoneData.slice(-6);
              const totalTierChange = recentData.reduce((sum, d) => sum + Math.abs(d.tierChange), 0);
              const totalBoeChange = recentData.reduce((sum, d) => sum + Math.abs(d.boeChange), 0);
              beta = totalBoeChange > 0 ? totalTierChange / totalBoeChange : 0;
              rSquared = 0.70;
              break;
            }
            case 'regression_fit': {
              if (zoneData.length < 3) {
                beta = 0;
                rSquared = 0;
                break;
              }
              const n = zoneData.length;
              const sumX = zoneData.reduce((sum, d) => sum + d.boeChange, 0);
              const sumY = zoneData.reduce((sum, d) => sum + d.tierChange, 0);
              const sumXY = zoneData.reduce((sum, d) => sum + d.boeChange * d.tierChange, 0);
              const sumX2 = zoneData.reduce((sum, d) => sum + d.boeChange * d.boeChange, 0);
              
              const denominator = n * sumX2 - sumX * sumX;
              if (Math.abs(denominator) < 0.0001) {
                beta = 0;
                rSquared = 0;
                break;
              }
              
              const slope = (n * sumXY - sumX * sumY) / denominator;
              beta = Math.abs(slope);
              
              // Calculate R²
              const yMean = sumY / n;
              const intercept = (sumY - slope * sumX) / n;
              const ssRes = zoneData.reduce((sum, d) => {
                const predicted = intercept + slope * d.boeChange;
                return sum + Math.pow(d.tierChange - predicted, 2);
              }, 0);
              const ssTot = zoneData.reduce((sum, d) => sum + Math.pow(d.tierChange - yMean, 2), 0);
              rSquared = ssTot > 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 0;
              break;
            }
            default:
              beta = 0.8;
              rSquared = 0.75;
          }
          
          return { beta, rSquared, count: zoneData.length };
        };
        
        const lowZoneResult = calculateZoneBeta(lowZoneData, 'Low Rate Zone');
        const midZoneResult = calculateZoneBeta(midZoneData, 'Mid Rate Zone');
        const highZoneResult = calculateZoneBeta(highZoneData, 'High Rate Zone');
        
        // Use zone-specific betas
        const lowBeta = lowZoneResult.beta || midZoneResult.beta || 0.8; // Fallback if no low zone data
        const highBeta = highZoneResult.beta || midZoneResult.beta || 0.6; // Fallback if no high zone data
        
        const rSquared = (lowZoneResult.rSquared + midZoneResult.rSquared + highZoneResult.rSquared) / 3;
        
        const calculationDetails = {
          zoneBreakdown: {
            lowZone: {
              threshold: `BoE ≤ ${lowZoneThreshold}%`,
              beta: lowZoneResult.beta.toFixed(3),
              rSquared: lowZoneResult.rSquared.toFixed(3),
              dataPoints: lowZoneResult.count,
              avgBoERate: lowZoneData.length > 0 ? (lowZoneData.reduce((sum, d) => sum + d.boeRate, 0) / lowZoneData.length).toFixed(2) : 'N/A'
            },
            midZone: {
              threshold: `${lowZoneThreshold}% < BoE ≤ ${midZoneThreshold}%`,
              beta: midZoneResult.beta.toFixed(3),
              rSquared: midZoneResult.rSquared.toFixed(3),
              dataPoints: midZoneResult.count,
              avgBoERate: midZoneData.length > 0 ? (midZoneData.reduce((sum, d) => sum + d.boeRate, 0) / midZoneData.length).toFixed(2) : 'N/A'
            },
            highZone: {
              threshold: `BoE > ${midZoneThreshold}%`,
              beta: highZoneResult.beta.toFixed(3),
              rSquared: highZoneResult.rSquared.toFixed(3),
              dataPoints: highZoneResult.count,
              avgBoERate: highZoneData.length > 0 ? (highZoneData.reduce((sum, d) => sum + d.boeRate, 0) / highZoneData.length).toFixed(2) : 'N/A'
            }
          },
          methodology,
          formula: methodology === 'regression_fit' ? 
            `Zone-specific linear regression: β = |slope| for each convexity zone` :
            `Zone-specific ${methodology.replace('_', ' ')}: separate calculation per rate environment`
        };
        
          results.tierResults[tierKey] = {
            tierName: tier.tier_name,
            currentRate: tier.rate,
            calculatedBetas: {
              lowRate: lowBeta,
              highRate: highBeta
            },
            rSquared,
            dataPoints: tierData.length,
            rawData: tierData,
            hikes,
            cuts,
            calculation: {
              methodology,
              details: calculationDetails,
              breakdown: tierData.map(d => ({
                date: d.date,
                boeChange: `${d.boeChange > 0 ? '+' : ''}${d.boeChange.toFixed(2)}%`,
                tierChange: `${d.tierChange > 0 ? '+' : ''}${d.tierChange.toFixed(2)}%`,
                beta: Math.abs(d.boeChange) > 0 ? (Math.abs(d.tierChange) / Math.abs(d.boeChange)).toFixed(3) : 'N/A'
              }))
            }
          };
        
        } else {
          // Through-the-Cycle calculation logic
          const rateStepSize = results.throughCycleConfig.rateStepSize;
          const smoothing = results.throughCycleConfig.smoothing;
          
          // Group data by BoE rate steps
          const rateSteps = new Map<number, any[]>();
          tierData.forEach(d => {
            const roundedRate = Math.round(d.boeRate / rateStepSize) * rateStepSize;
            if (!rateSteps.has(roundedRate)) {
              rateSteps.set(roundedRate, []);
            }
            rateSteps.get(roundedRate)!.push(d);
          });
          
          // Calculate beta for each rate step
          const rateStepBetas = new Map<number, number>();
          const rateStepDetails = new Map<number, any>();
          
          rateSteps.forEach((stepData, boeRate) => {
            if (stepData.length < 2) return; // Need at least 2 data points
            
            let beta = 0;
            let rSquared = 0;
            
            switch (methodology) {
              case 'simple_average': {
                const totalTierChange = stepData.reduce((sum, d) => sum + Math.abs(d.tierChange), 0);
                const totalBoeChange = stepData.reduce((sum, d) => sum + Math.abs(d.boeChange), 0);
                beta = totalBoeChange > 0 ? totalTierChange / totalBoeChange : 0;
                rSquared = 0.75;
                break;
              }
              case 'directional_weighted': {
                const stepHikes = stepData.filter(d => d.boeChange > 0);
                const stepCuts = stepData.filter(d => d.boeChange < 0);
                const hikeBeta = stepHikes.length > 0 ? 
                  stepHikes.reduce((sum, d) => sum + d.tierChange, 0) / stepHikes.reduce((sum, d) => sum + d.boeChange, 0) : 0;
                const cutBeta = stepCuts.length > 0 ? 
                  Math.abs(stepCuts.reduce((sum, d) => sum + d.tierChange, 0) / stepCuts.reduce((sum, d) => sum + d.boeChange, 0)) : 0;
                beta = (Math.abs(hikeBeta) + cutBeta) / 2;
                rSquared = 0.80;
                break;
              }
              case 'rolling_average': {
                const recentData = stepData.slice(-3); // Last 3 observations at this rate level
                const totalTierChange = recentData.reduce((sum, d) => sum + Math.abs(d.tierChange), 0);
                const totalBoeChange = recentData.reduce((sum, d) => sum + Math.abs(d.boeChange), 0);
                beta = totalBoeChange > 0 ? totalTierChange / totalBoeChange : 0;
                rSquared = 0.70;
                break;
              }
              case 'regression_fit': {
                if (stepData.length < 3) break;
                const n = stepData.length;
                const sumX = stepData.reduce((sum, d) => sum + d.boeChange, 0);
                const sumY = stepData.reduce((sum, d) => sum + d.tierChange, 0);
                const sumXY = stepData.reduce((sum, d) => sum + d.boeChange * d.tierChange, 0);
                const sumX2 = stepData.reduce((sum, d) => sum + d.boeChange * d.boeChange, 0);
                
                const denominator = n * sumX2 - sumX * sumX;
                if (Math.abs(denominator) > 0.0001) {
                  const slope = (n * sumXY - sumX * sumY) / denominator;
                  beta = Math.abs(slope);
                  
                  // Calculate R²
                  const yMean = sumY / n;
                  const intercept = (sumY - slope * sumX) / n;
                  const ssRes = stepData.reduce((sum, d) => {
                    const predicted = intercept + slope * d.boeChange;
                    return sum + Math.pow(d.tierChange - predicted, 2);
                  }, 0);
                  const ssTot = stepData.reduce((sum, d) => sum + Math.pow(d.tierChange - yMean, 2), 0);
                  rSquared = ssTot > 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 0;
                }
                break;
              }
            }
            
            rateStepBetas.set(boeRate, beta);
            rateStepDetails.set(boeRate, {
              boeRate: boeRate.toFixed(2),
              beta: beta.toFixed(3),
              rSquared: rSquared.toFixed(3),
              dataPoints: stepData.length,
              avgTierChange: stepData.length > 0 ? (stepData.reduce((sum, d) => sum + Math.abs(d.tierChange), 0) / stepData.length).toFixed(3) : '0.000'
            });
          });
          
          // Apply smoothing if enabled
          let smoothedBetas = new Map(rateStepBetas);
          if (smoothing && rateStepBetas.size > 2) {
            const sortedRates = Array.from(rateStepBetas.keys()).sort((a, b) => a - b);
            smoothedBetas = new Map();
            
            sortedRates.forEach((rate, index) => {
              const neighbors = [];
              if (index > 0) neighbors.push(rateStepBetas.get(sortedRates[index - 1]) || 0);
              neighbors.push(rateStepBetas.get(rate) || 0);
              if (index < sortedRates.length - 1) neighbors.push(rateStepBetas.get(sortedRates[index + 1]) || 0);
              
              const smoothedBeta = neighbors.reduce((sum, b) => sum + b, 0) / neighbors.length;
              smoothedBetas.set(rate, smoothedBeta);
            });
          }
          
          // Create sorted array of rate-specific betas for display
          const sortedRates = Array.from(smoothedBetas.keys()).sort((a, b) => a - b);
          const throughCycleBreakdown = sortedRates.map(rate => ({
            boeRate: rate.toFixed(2) + '%',
            beta: (smoothedBetas.get(rate) || 0).toFixed(3),
            details: rateStepDetails.get(rate)
          }));
          
          // Calculate overall representative betas (weighted by data points)
          const weightedLowBeta = sortedRates.slice(0, Math.ceil(sortedRates.length / 2))
            .reduce((sum, rate) => sum + (smoothedBetas.get(rate) || 0), 0) / Math.ceil(sortedRates.length / 2);
          const weightedHighBeta = sortedRates.slice(Math.floor(sortedRates.length / 2))
            .reduce((sum, rate) => sum + (smoothedBetas.get(rate) || 0), 0) / Math.ceil(sortedRates.length / 2);
          
          const overallRSquared = Array.from(rateStepDetails.values())
            .reduce((sum, details) => sum + parseFloat(details.rSquared), 0) / rateStepDetails.size;
          
          const calculationDetails = {
            throughCycleBreakdown,
            rateStepSize: rateStepSize + '%',
            smoothingApplied: smoothing,
            totalRateSteps: sortedRates.length,
            methodology,
            formula: `Through-cycle ${methodology.replace('_', ' ')}: individual beta calculation for each ${rateStepSize}% BoE rate step`
          };
          
          results.tierResults[tierKey] = {
            tierName: tier.tier_name,
            currentRate: tier.rate,
            calculatedBetas: {
              lowRate: weightedLowBeta,
              highRate: weightedHighBeta
            },
            rSquared: overallRSquared,
            dataPoints: tierData.length,
            rawData: tierData,
            hikes,
            cuts,
            calculation: {
              methodology,
              details: calculationDetails,
              breakdown: tierData.map(d => ({
                date: d.date,
                boeChange: `${d.boeChange > 0 ? '+' : ''}${d.boeChange.toFixed(2)}%`,
                tierChange: `${d.tierChange > 0 ? '+' : ''}${d.tierChange.toFixed(2)}%`,
                beta: Math.abs(d.boeChange) > 0 ? (Math.abs(d.tierChange) / Math.abs(d.boeChange)).toFixed(3) : 'N/A'
              }))
            }
          };
        }
      });
      
      setCalibrationResults(results);
      setShowCalibrationModal(true);
      
    } catch (error) {
      console.error('Calibration failed:', error);
    } finally {
      setIsCalibrating(false);
    }
  }, [currentProduct, config.historicalConfig]);

  // Apply calibration results to tier configs
  const applyCalibrationResults = useCallback(() => {
    if (!calibrationResults || !currentProduct) return;
    
    const newTierConfigs: Record<string, TierConfig> = { ...config.tierConfigs };
    
    currentProduct.tiers.forEach(tier => {
      const tierKey = tier.tier_name.toLowerCase().replace(/\s+/g, '_');
      const tierResult = calibrationResults.tierResults[tierKey];
      
      if (tierResult) {
        newTierConfigs[tierKey] = {
          lowRateBetaMultiplier: tierResult.calculatedBetas.lowRate,
          highRateBetaMultiplier: tierResult.calculatedBetas.highRate,
          lowToMidConvexityZone: calibrationResults.convexityZones.lowToMid,
          midToHighConvexityZone: calibrationResults.convexityZones.midToHigh
        };
      }
    });
    
    const newConfig = { ...config, tierConfigs: newTierConfigs };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
    setShowCalibrationModal(false);
  }, [calibrationResults, currentProduct, config, setConfig, onConfigChange]);

  // Safe slider component with bounds checking
  const SafeSlider = ({ 
    label, 
    value, 
    min, 
    max, 
    step = 0.01, 
    unit = '', 
    onChange,
    description 
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (value: number) => void;
    description?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={`slider-${label.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-mono text-gray-900">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <input
        id={`slider-${label.replace(/\s+/g, '-').toLowerCase()}`}
        name={`slider-${label.replace(/\s+/g, '-').toLowerCase()}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={isLocked || disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
      {description && (
        <p className="text-xs text-gray-600">{description}</p>
      )}
    </div>
  );

  // Compact constraint input with activation checkbox
  const ConstraintInput = ({ 
    label, 
    value, 
    isActive,
    onChange,
    onToggle,
    unit = '%',
    description,
    validateForRateFloor = false
  }: {
    label: string;
    value: number;
    isActive: boolean;
    onChange: (value: number) => void;
    onToggle: (active: boolean) => void;
    unit?: string;
    description?: string;
    validateForRateFloor?: boolean;
  }) => {
    const [inputValue, setInputValue] = useState(value.toFixed(2));
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const productConstraints = getProductRateConstraints();

    const validateValue = (numValue: number) => {
      if (isNaN(numValue)) {
        setHasError(true);
        setErrorMessage('Please enter a valid number');
        return false;
      }
      
      // Special validation for rate floor
      if (validateForRateFloor && productConstraints) {
        const violatingTier = productConstraints.tiers.find(tier => numValue >= tier.rate);
        if (violatingTier) {
          setHasError(true);
          setErrorMessage(`Cannot exceed ${violatingTier.tier_name} rate (${violatingTier.rate.toFixed(2)}%)`);
          return false;
        }
      }
      
      setHasError(false);
      setErrorMessage('');
      return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      
      if (newValue === '' || newValue === '-' || newValue === '.') {
        return;
      }
      
      const numValue = parseFloat(newValue);
      if (validateValue(numValue)) {
        onChange(numValue);
      }
    };

    const handleBlur = () => {
      const numValue = parseFloat(inputValue);
      if (!hasError && !isNaN(numValue)) {
        setInputValue(numValue.toFixed(2));
      }
    };

    React.useEffect(() => {
      setInputValue(value.toFixed(2));
      if (isActive) validateValue(value);
    }, [value, isActive]);

    return (
      <div className={`flex items-center space-x-3 p-3 rounded border ${
        isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
      }`}>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={isLocked || disabled}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        
        <div className="flex-1 min-w-0">
          <label className={`text-sm font-medium ${
            isActive ? 'text-blue-900' : 'text-gray-500'
          }`}>{label}</label>
          {description && (
            <p className={`text-xs mt-1 ${
              isActive ? 'text-blue-700' : 'text-gray-400'
            }`}>{description}</p>
          )}
          {hasError && isActive && (
            <div className="text-xs text-red-600 flex items-center space-x-1 mt-1">
              <ExclamationTriangleIcon className="w-3 h-3" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLocked || disabled || !isActive}
            className={`w-16 px-2 py-1 text-xs font-mono text-right border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
              hasError && isActive ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          <span className={`text-xs ${
            isActive ? 'text-gray-700' : 'text-gray-400'
          }`}>{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BeakerIcon className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Safe Beta Ladder Builder</h3>
            <p className="text-sm text-gray-600">Multi-method beta calibration with manual, historical, and inheritance workflows</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasErrors && (
            <div className="flex items-center space-x-1 text-red-600">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-xs">Validation errors</span>
            </div>
          )}
          
          {!hasErrors && !isLocked && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="text-xs">Valid config</span>
            </div>
          )}
          
          <button
            onClick={() => setIsLocked(!isLocked)}
            disabled={disabled}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
              isLocked 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLocked ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
            {isLocked ? 'Locked' : 'Unlocked'}
          </button>
        </div>
      </div>

      {/* Global Configuration Section */}
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
Global Constraints (Apply to All Tiers)
          </h4>
          
          <div className="space-y-3">
            <ConstraintInput
              label="Rate Floor"
              value={config.rateFloor}
              isActive={config.rateFloorActive}
              onChange={(value) => updateGlobalConfig({ rateFloor: value })}
              onToggle={(active) => updateGlobalConfig({ rateFloorActive: active })}
              description="Minimum product rate regardless of BoE rate"
              validateForRateFloor={true}
            />
            
            <ConstraintInput
              label="Rate Ceiling"
              value={config.rateCeiling}
              isActive={config.rateCeilingActive}
              onChange={(value) => updateGlobalConfig({ rateCeiling: value })}
              onToggle={(active) => updateGlobalConfig({ rateCeilingActive: active })}
              description="Maximum product rate regardless of BoE rate"
            />
            
            <ConstraintInput
              label="Max Spread Over BoE"
              value={config.maxSpreadOverBase / 100}
              isActive={config.maxSpreadOverBaseActive}
              onChange={(value) => updateGlobalConfig({ maxSpreadOverBase: value * 100 })}
              onToggle={(active) => updateGlobalConfig({ maxSpreadOverBaseActive: active })}
              description="Maximum premium over Bank of England rate"
            />
            
            <ConstraintInput
              label="Max Spread Under BoE"
              value={config.maxSpreadUnderBase / 100}
              isActive={config.maxSpreadUnderBaseActive}
              onChange={(value) => updateGlobalConfig({ maxSpreadUnderBase: value * 100 })}
              onToggle={(active) => updateGlobalConfig({ maxSpreadUnderBaseActive: active })}
              description="Maximum discount below Bank of England rate"
            />
          </div>
          
          {/* Product validation info for rate floor */}
          {config.rateFloorActive && !hasErrors && (
            <div className="mt-4">
              {getProductRateConstraints() ? (
                <div className="text-xs text-blue-600 bg-white border border-blue-200 rounded p-2">
                  <div className="font-medium mb-1">Validating against: {currentProduct?.bank_code} {currentProduct?.product_name}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {getProductRateConstraints()?.tiers.map((tier, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{tier.tier_name}:</span>
                        <span className="font-mono">{tier.rate.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
Warning: No product selected for validation
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calibration Method Selector */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Tier Calibration Method</h4>
          <p className="text-sm text-gray-600 mb-4">Choose how to determine tier-specific beta parameters</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => updateGlobalConfig({ calibrationMethod: 'manual' })}
              disabled={isLocked || disabled}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                config.calibrationMethod === 'manual'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <WrenchScrewdriverIcon className={`w-6 h-6 ${
                  config.calibrationMethod === 'manual' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <h5 className={`font-medium ${
                  config.calibrationMethod === 'manual' ? 'text-blue-900' : 'text-gray-700'
                }`}>Manual Configuration</h5>
              </div>
              <p className={`text-sm ${
                config.calibrationMethod === 'manual' ? 'text-blue-700' : 'text-gray-600'
              }`}>
                Set beta parameters manually based on judgment and strategy
              </p>
            </button>

            <button
              onClick={() => updateGlobalConfig({ calibrationMethod: 'historical' })}
              disabled={isLocked || disabled}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                config.calibrationMethod === 'historical'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <ChartBarIcon className={`w-6 h-6 ${
                  config.calibrationMethod === 'historical' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <h5 className={`font-medium ${
                  config.calibrationMethod === 'historical' ? 'text-green-900' : 'text-gray-700'
                }`}>Historical Calibration</h5>
              </div>
              <p className={`text-sm ${
                config.calibrationMethod === 'historical' ? 'text-green-700' : 'text-gray-600'
              }`}>
                Derive parameters from historical rate movement patterns
              </p>
            </button>

            <button
              onClick={() => updateGlobalConfig({ calibrationMethod: 'inherit' })}
              disabled={isLocked || disabled}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                config.calibrationMethod === 'inherit'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <DocumentDuplicateIcon className={`w-6 h-6 ${
                  config.calibrationMethod === 'inherit' ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <h5 className={`font-medium ${
                  config.calibrationMethod === 'inherit' ? 'text-purple-900' : 'text-gray-700'
                }`}>Inherit & Track</h5>
              </div>
              <p className={`text-sm ${
                config.calibrationMethod === 'inherit' ? 'text-purple-700' : 'text-gray-600'
              }`}>
                Copy from another product or track competitor with spread
              </p>
            </button>
          </div>
        </div>

        {/* Method-Specific Configuration */}
        {config.calibrationMethod === 'historical' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Historical Calibration Settings
            </h4>
            
            <div className="space-y-4">
              {/* Step 1: Choose Approach */}
              <div>
                <label className="block text-sm font-medium text-green-900 mb-3">Step 1: Choose Calibration Approach</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => updateGlobalConfig({
                      historicalConfig: {
                        ...config.historicalConfig,
                        approach: 'zone_based'
                      }
                    })}
                    disabled={isLocked || disabled}
                    className={`p-3 rounded border-2 text-left transition-colors ${
                      config.historicalConfig?.approach === 'zone_based' || !config.historicalConfig?.approach
                        ? 'border-green-500 bg-green-100'
                        : 'border-green-200 hover:border-green-300'
                    }`}
                  >
                    <div className="font-medium text-green-800">Zone-Based Calibration</div>
                    <div className="text-xs text-green-600 mt-1">Set convexity zones, then calculate zone-specific betas</div>
                  </button>
                  
                  <button
                    onClick={() => updateGlobalConfig({
                      historicalConfig: {
                        ...config.historicalConfig,
                        approach: 'through_cycle'
                      }
                    })}
                    disabled={isLocked || disabled}
                    className={`p-3 rounded border-2 text-left transition-colors ${
                      config.historicalConfig?.approach === 'through_cycle'
                        ? 'border-green-500 bg-green-100'
                        : 'border-green-200 hover:border-green-300'
                    }`}
                  >
                    <div className="font-medium text-green-800">Through-the-Cycle</div>
                    <div className="text-xs text-green-600 mt-1">Map each BoE rate level to its historical beta</div>
                  </button>
                </div>
              </div>

              {/* Step 2: Zone Configuration (Zone-Based Only) */}
              {config.historicalConfig?.approach === 'zone_based' && (
                <div className="border-l-4 border-green-400 pl-4">
                  <label className="block text-sm font-medium text-green-900 mb-3">Step 2: Configure Convexity Zones</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoDetectZones"
                        checked={config.historicalConfig?.convexityZones?.autoDetect ?? true}
                        onChange={(e) => updateGlobalConfig({
                          historicalConfig: {
                            ...config.historicalConfig,
                            convexityZones: {
                              ...config.historicalConfig?.convexityZones,
                              autoDetect: e.target.checked,
                              lowToMidThreshold: config.historicalConfig?.convexityZones?.lowToMidThreshold ?? 3.0,
                              midToHighThreshold: config.historicalConfig?.convexityZones?.midToHighThreshold ?? 5.0
                            }
                          }
                        })}
                        disabled={isLocked || disabled}
                        className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="autoDetectZones" className="text-sm text-green-800">
                        Auto-detect optimal zone breakpoints from historical data
                      </label>
                    </div>
                    
                    {!config.historicalConfig?.convexityZones?.autoDetect && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                        <div>
                          <label className="block text-xs font-medium text-green-700 mb-1">Low → Mid Threshold</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={config.historicalConfig?.convexityZones?.lowToMidThreshold ?? 3.0}
                              onChange={(e) => updateGlobalConfig({
                                historicalConfig: {
                                  ...config.historicalConfig,
                                  convexityZones: {
                                    ...config.historicalConfig?.convexityZones,
                                    autoDetect: false,
                                    lowToMidThreshold: Number(e.target.value),
                                    midToHighThreshold: config.historicalConfig?.convexityZones?.midToHighThreshold ?? 5.0
                                  }
                                }
                              })}
                              min="0.5"
                              max="6.0"
                              step="0.25"
                              disabled={isLocked || disabled}
                              className="w-20 px-2 py-1 text-xs border border-green-300 rounded focus:ring-green-500 focus:border-green-500"
                            />
                            <span className="text-xs text-green-600">% BoE Rate</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-green-700 mb-1">Mid → High Threshold</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={config.historicalConfig?.convexityZones?.midToHighThreshold ?? 5.0}
                              onChange={(e) => updateGlobalConfig({
                                historicalConfig: {
                                  ...config.historicalConfig,
                                  convexityZones: {
                                    ...config.historicalConfig?.convexityZones,
                                    autoDetect: false,
                                    lowToMidThreshold: config.historicalConfig?.convexityZones?.lowToMidThreshold ?? 3.0,
                                    midToHighThreshold: Number(e.target.value)
                                  }
                                }
                              })}
                              min="2.0"
                              max="8.0"
                              step="0.25"
                              disabled={isLocked || disabled}
                              className="w-20 px-2 py-1 text-xs border border-green-300 rounded focus:ring-green-500 focus:border-green-500"
                            />
                            <span className="text-xs text-green-600">% BoE Rate</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Through-Cycle Configuration */}
              {config.historicalConfig?.approach === 'through_cycle' && (
                <div className="border-l-4 border-blue-400 pl-4">
                  <label className="block text-sm font-medium text-green-900 mb-3">Step 2: Through-Cycle Settings</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">Rate Step Size</label>
                      <select
                        value={config.historicalConfig?.throughCycle?.rateStepSize ?? 0.25}
                        onChange={(e) => updateGlobalConfig({
                          historicalConfig: {
                            ...config.historicalConfig,
                            throughCycle: {
                              ...config.historicalConfig?.throughCycle,
                              rateStepSize: Number(e.target.value),
                              smoothing: config.historicalConfig?.throughCycle?.smoothing ?? true
                            }
                          }
                        })}
                        disabled={isLocked || disabled}
                        className="w-full px-2 py-1 text-xs border border-green-300 rounded focus:ring-green-500 focus:border-green-500"
                      >
                        <option value={0.1}>0.10% (fine granularity)</option>
                        <option value={0.25}>0.25% (standard)</option>
                        <option value={0.5}>0.50% (coarse granularity)</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="smoothingEnabled"
                        checked={config.historicalConfig?.throughCycle?.smoothing ?? true}
                        onChange={(e) => updateGlobalConfig({
                          historicalConfig: {
                            ...config.historicalConfig,
                            throughCycle: {
                              ...config.historicalConfig?.throughCycle,
                              rateStepSize: config.historicalConfig?.throughCycle?.rateStepSize ?? 0.25,
                              smoothing: e.target.checked
                            }
                          }
                        })}
                        disabled={isLocked || disabled}
                        className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="smoothingEnabled" className="text-xs text-green-800">
                        Apply smoothing to reduce noise
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Methodology */}
              <div>
                <label className="block text-sm font-medium text-green-900 mb-2">Step 3: Calculation Methodology</label>
                <select
                  value={config.historicalConfig?.methodology || 'simple_average'}
                  onChange={(e) => updateGlobalConfig({
                    historicalConfig: {
                      ...config.historicalConfig,
                      methodology: e.target.value as HistoricalMethodology
                    }
                  })}
                  disabled={isLocked || disabled}
                  className="w-full px-3 py-2 border border-green-300 rounded focus:ring-green-500 focus:border-green-500"
                >
                  <option value="simple_average">Simple Average (hikes + cuts) / 2</option>
                  <option value="directional_weighted">Directional Weighted (separate hike/cut betas)</option>
                  <option value="rolling_average">Rolling Average (last N rate changes)</option>
                  <option value="regression_fit">Regression Fit (full historical analysis)</option>
                </select>
              </div>
              
              {/* Step 4: Time Period & Options */}
              <div>
                <label className="block text-sm font-medium text-green-900 mb-2">Step 4: Time Period & Options</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Historical Data Period</label>
                    <select
                      value={config.historicalConfig?.timePeriod?.preset || 'last_2_years'}
                      onChange={(e) => updateGlobalConfig({
                        historicalConfig: {
                          ...config.historicalConfig,
                          timePeriod: {
                            ...config.historicalConfig?.timePeriod,
                            preset: e.target.value as 'last_2_years' | 'last_year' | 'custom'
                          }
                        }
                      })}
                      disabled={isLocked || disabled}
                      className="w-full px-3 py-2 border border-green-300 rounded focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="last_2_years">Last 2 Years</option>
                      <option value="last_year">Last Year</option>
                      <option value="custom">Custom Date Range</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="excludeOutliers"
                      checked={config.historicalConfig?.excludeOutliers || false}
                      onChange={(e) => updateGlobalConfig({
                        historicalConfig: {
                          ...config.historicalConfig,
                          excludeOutliers: e.target.checked
                        }
                      })}
                      disabled={isLocked || disabled}
                      className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="excludeOutliers" className="text-xs text-green-800">
                      Exclude outlier periods (crisis events, extreme volatility)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-100 border border-green-300 rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowPathIcon className="w-4 h-4 text-green-700" />
                    <span className="text-sm font-medium text-green-800">
                      Historical calibration will analyze rate movement patterns and automatically set beta parameters
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowCalibrationModal(true)}
                      disabled={isLocked || disabled}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-200 text-green-800 rounded hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <InformationCircleIcon className="w-3 h-3" />
                      <span>View Calculations</span>
                    </button>
                    
                    <button
                      onClick={runHistoricalCalibration}
                      disabled={isLocked || disabled || isCalibrating || !currentProduct}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCalibrating ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                      <span>{isCalibrating ? 'Running...' : 'Run Calibration'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {config.calibrationMethod === 'inherit' && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
              <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
              Inheritance & Tracking Settings
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">Source Product</label>
                <select
                  value={config.inheritanceConfig?.sourceProductId || ''}
                  onChange={(e) => updateGlobalConfig({
                    inheritanceConfig: {
                      ...config.inheritanceConfig,
                      sourceProductId: e.target.value,
                      sourceProductName: e.target.options[e.target.selectedIndex].text
                    }
                  })}
                  disabled={isLocked || disabled}
                  className="w-full px-3 py-2 border border-purple-300 rounded focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select product to inherit from...</option>
                  <option value="hsbc_instant_saver">HSBC Instant Saver</option>
                  <option value="barclays_everyday_saver">Barclays Everyday Saver</option>
                  <option value="chase_saver_boosted">Chase Saver Boosted</option>
                  <option value="nationwide_flexdirect">Nationwide FlexDirect</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">Modification Level</label>
                <select
                  value={config.inheritanceConfig?.modificationLevel || 'exact_copy'}
                  onChange={(e) => updateGlobalConfig({
                    inheritanceConfig: {
                      ...config.inheritanceConfig,
                      modificationLevel: e.target.value as 'exact_copy' | 'copy_and_adjust' | 'structure_only'
                    }
                  })}
                  disabled={isLocked || disabled}
                  className="w-full px-3 py-2 border border-purple-300 rounded focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="exact_copy">Exact Copy (mirror all parameters)</option>
                  <option value="copy_and_adjust">Copy & Adjust (allow manual tweaking)</option>
                  <option value="structure_only">Structure Only (copy zones, set own betas)</option>
                </select>
              </div>
              
              <div className="border border-purple-200 rounded p-3">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="competitorTracking"
                    checked={config.inheritanceConfig?.competitorTracking?.enabled || false}
                    onChange={(e) => updateGlobalConfig({
                      inheritanceConfig: {
                        ...config.inheritanceConfig,
                        competitorTracking: {
                          ...config.inheritanceConfig?.competitorTracking,
                          enabled: e.target.checked
                        }
                      }
                    })}
                    disabled={isLocked || disabled}
                    className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="competitorTracking" className="text-sm font-medium text-purple-800">
                    Enable Competitor Tracking
                  </label>
                </div>
                
                {config.inheritanceConfig?.competitorTracking?.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">Spread (basis points)</label>
                      <input
                        type="number"
                        value={config.inheritanceConfig.competitorTracking.spreadBasisPoints || 0}
                        onChange={(e) => updateGlobalConfig({
                          inheritanceConfig: {
                            ...config.inheritanceConfig,
                            competitorTracking: {
                              ...config.inheritanceConfig.competitorTracking,
                              spreadBasisPoints: Number(e.target.value)
                            }
                          }
                        })}
                        disabled={isLocked || disabled}
                        className="w-24 px-2 py-1 text-xs border border-purple-300 rounded focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0"
                      />
                      <span className="text-xs text-purple-600 ml-2">bp over competitor</span>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">Update Frequency</label>
                      <select
                        value={config.inheritanceConfig.competitorTracking.updateFrequency || 'daily'}
                        onChange={(e) => updateGlobalConfig({
                          inheritanceConfig: {
                            ...config.inheritanceConfig,
                            competitorTracking: {
                              ...config.inheritanceConfig.competitorTracking,
                              updateFrequency: e.target.value as 'realtime' | 'daily' | 'manual'
                            }
                          }
                        })}
                        disabled={isLocked || disabled}
                        className="w-full px-2 py-1 text-xs border border-purple-300 rounded focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="realtime">Real-time</option>
                        <option value="daily">Daily</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-purple-100 border border-purple-300 rounded p-3">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4 text-purple-700" />
                  <span className="text-sm font-medium text-purple-800">
                    {config.inheritanceConfig?.sourceProductId 
                      ? `Will inherit beta parameters from ${config.inheritanceConfig.sourceProductName}`
                      : 'Select a source product to configure inheritance'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tier-Specific Configuration Section */}
        {currentProduct?.tiers && currentProduct.tiers.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
Tier-Specific Behavioral Parameters
            </h4>
            
            {/* Tier Tabs */}
            <div className="flex space-x-1 mb-4 bg-green-100 p-1 rounded-lg">
              {currentProduct.tiers.map((tier) => {
                const tierKey = tier.tier_name.toLowerCase().replace(/\s+/g, '_');
                return (
                  <button
                    key={tierKey}
                    onClick={() => setActiveTierTab(tierKey)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTierTab === tierKey
                        ? 'bg-white text-green-900 shadow-sm'
                        : 'text-green-700 hover:text-green-900'
                    }`}
                  >
                    {tier.tier_name}
                    <div className="text-xs text-green-600">
                      {tier.balance_range} • {tier.rate.toFixed(2)}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Tier Configuration */}
            {activeTierTab && config.tierConfigs[activeTierTab] && (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h5 className="text-lg font-medium text-gray-900 mb-4">
                  {currentProduct.tiers.find(t => t.tier_name.toLowerCase().replace(/\s+/g, '_') === activeTierTab)?.tier_name} Configuration
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Beta Sensitivity */}
                  <div className="space-y-4">
                    <h6 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">📈 Beta Sensitivity</h6>
                    
                    <SafeSlider
                      label="Low Rate Beta Multiplier"
                      value={config.tierConfigs[activeTierTab].lowRateBetaMultiplier}
                      min={0.1}
                      max={2.0}
                      step={0.05}
                      unit="x"
                      onChange={(value) => updateTierConfig(activeTierTab, { lowRateBetaMultiplier: value })}
                      description="Rate sensitivity when BoE rates are low"
                    />
                    
                    <SafeSlider
                      label="High Rate Beta Multiplier"
                      value={config.tierConfigs[activeTierTab].highRateBetaMultiplier}
                      min={0.5}
                      max={3.0}
                      step={0.05}
                      unit="x"
                      onChange={(value) => updateTierConfig(activeTierTab, { highRateBetaMultiplier: value })}
                      description="Rate sensitivity when BoE rates are high"
                    />
                  </div>

                  {/* Convexity Zones */}
                  <div className="space-y-4">
                    <h6 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Convexity Zones</h6>
                    
                    <SafeSlider
                      label="Low → Mid Transition"
                      value={config.tierConfigs[activeTierTab].lowToMidConvexityZone}
                      min={0.5}
                      max={3.5}
                      step={0.25}
                      unit="% BoE"
                      onChange={(value) => updateTierConfig(activeTierTab, { lowToMidConvexityZone: value })}
                      description="BoE rate where low zone transitions to mid zone"
                    />
                    
                    <SafeSlider
                      label="Mid → High Transition"
                      value={config.tierConfigs[activeTierTab].midToHighConvexityZone}
                      min={2.5}
                      max={6.0}
                      step={0.25}
                      unit="% BoE"
                      onChange={(value) => updateTierConfig(activeTierTab, { midToHighConvexityZone: value })}
                      description="BoE rate where mid zone transitions to high zone"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Product Warning */}
        {(!currentProduct?.tiers || currentProduct.tiers.length === 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
              <div>
                <h4 className="text-lg font-semibold text-amber-900">No Product Selected</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Select a product to configure tier-specific behavioral parameters. Only global constraints are available without a product.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Preview */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <CalculatorIcon className="w-4 h-4 mr-2" />
          Configuration Summary
        </h4>
        
        {/* Active Constraints Summary */}
        <div className="mb-3">
          <h5 className="text-xs font-medium text-gray-600 mb-2">Active Global Constraints</h5>
          <div className="flex flex-wrap gap-2">
            {config.rateFloorActive && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Floor: {config.rateFloor.toFixed(2)}%
              </div>
            )}
            {config.rateCeilingActive && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Ceiling: {config.rateCeiling.toFixed(2)}%
              </div>
            )}
            {config.maxSpreadOverBaseActive && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Max Over: +{(config.maxSpreadOverBase/100).toFixed(2)}%
              </div>
            )}
            {config.maxSpreadUnderBaseActive && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Max Under: -{(config.maxSpreadUnderBase/100).toFixed(2)}%
              </div>
            )}
            {!config.rateFloorActive && !config.rateCeilingActive && !config.maxSpreadOverBaseActive && !config.maxSpreadUnderBaseActive && (
              <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                No constraints active
              </div>
            )}
          </div>
        </div>
        
        {/* Product Info */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Product:</span>
            <span className="font-medium text-gray-900">
              {currentProduct ? `${currentProduct.bank_code} ${currentProduct.product_name}` : 'No Product Selected'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Tiers Configured:</span>
            <span className="font-medium text-gray-900">
              {Object.keys(config.tierConfigs).length} of {currentProduct?.tiers?.length || 0}
            </span>
          </div>
        </div>

        {/* Tier-Specific Summary */}
        {currentProduct?.tiers && Object.keys(config.tierConfigs).length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-2">Tier-Specific Parameters</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentProduct.tiers.map((tier) => {
                const tierKey = tier.tier_name.toLowerCase().replace(/\s+/g, '_');
                const tierConfig = config.tierConfigs[tierKey];
                
                if (!tierConfig) return null;
                
                return (
                  <div key={tierKey} className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="font-medium text-green-900 text-xs mb-1">
                      {tier.tier_name} ({tier.balance_range})
                    </div>
                    <div className="text-xs text-green-800 space-y-1">
                      <div>Beta: {tierConfig.lowRateBetaMultiplier}x - {tierConfig.highRateBetaMultiplier}x</div>
                      <div>Zones: {tierConfig.lowToMidConvexityZone}% | {tierConfig.midToHighConvexityZone}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <BeakerIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <strong>Development Mode:</strong> This is the safe, configuration-only version of the beta ladder builder. 
            No complex chart interactions or real-time calculations that could cause performance issues.
          </div>
        </div>
      </div>

      {/* Calibration Results Modal */}
      {showCalibrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-green-600" />
                Historical Calibration Results
              </h3>
              <button
                onClick={() => setShowCalibrationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {calibrationResults ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">Calibration Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-700">Approach:</span>
                        <div className="text-green-900">{calibrationResults.approach === 'zone_based' ? 'Zone-Based' : 'Through-Cycle'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Methodology:</span>
                        <div className="text-green-900">{calibrationResults.methodology.replace('_', ' ').toUpperCase()}</div>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Time Period:</span>
                        <div className="text-green-900">{calibrationResults.timePeriod.replace('_', ' ').toUpperCase()}</div>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Sample Size:</span>
                        <div className="text-green-900">{calibrationResults.sampleSize} months</div>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Confidence:</span>
                        <div className="text-green-900">{calibrationResults.overallConfidence}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Zone-Based or Through-Cycle Information */}
                  {calibrationResults.approach === 'zone_based' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Detected Convexity Zones</h4>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="font-medium text-blue-700">Zone Transitions:</span>
                        <div className="mt-2 grid grid-cols-3 gap-4">
                          <div className="bg-white rounded p-3 border border-blue-200">
                            <div className="font-medium text-blue-800">Low Rate Zone</div>
                            <div className="text-xs text-blue-600">BoE ≤ {calibrationResults.convexityZones.lowToMid}%</div>
                            <div className="text-xs text-blue-600">High sensitivity environment</div>
                          </div>
                          <div className="bg-white rounded p-3 border border-blue-200">
                            <div className="font-medium text-blue-800">Mid Rate Zone</div>
                            <div className="text-xs text-blue-600">{calibrationResults.convexityZones.lowToMid}% - {calibrationResults.convexityZones.midToHigh}%</div>
                            <div className="text-xs text-blue-600">Normal sensitivity environment</div>
                          </div>
                          <div className="bg-white rounded p-3 border border-blue-200">
                            <div className="font-medium text-blue-800">High Rate Zone</div>
                            <div className="text-xs text-blue-600">BoE &gt; {calibrationResults.convexityZones.midToHigh}%</div>
                            <div className="text-xs text-blue-600">Low sensitivity environment</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600">
                        Detection confidence: {calibrationResults.convexityZones.confidence}%
                      </div>
                    </div>
                    </div>
                  ) : (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-3">Through-the-Cycle Configuration</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-purple-700">Rate Step Size:</span>
                            <div className="text-purple-900">{calibrationResults.throughCycleConfig?.rateStepSize}%</div>
                          </div>
                          <div>
                            <span className="font-medium text-purple-700">Smoothing Applied:</span>
                            <div className="text-purple-900">{calibrationResults.throughCycleConfig?.smoothing ? 'Yes' : 'No'}</div>
                          </div>
                          <div>
                            <span className="font-medium text-purple-700">Rate Steps Analyzed:</span>
                            <div className="text-purple-900">{Object.values(calibrationResults.tierResults)[0]?.calculation?.details?.totalRateSteps || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="text-xs text-purple-600">
                          Each BoE rate level gets its own historically-calibrated beta coefficient
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tier Results */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Tier-Specific Beta Calculations</h4>
                    <div className="space-y-4">
                      {Object.entries(calibrationResults.tierResults).map(([tierKey, tierResult]: [string, any]) => (
                        <div key={tierKey} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-medium text-gray-900">{tierResult.tierName}</h5>
                            <div className="text-sm text-gray-600">
                              Current Rate: {tierResult.currentRate.toFixed(2)}%
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded p-3">
                              <h6 className="font-medium text-gray-700 mb-2">Calculated Betas</h6>
                              <div className="space-y-1 text-sm">
                                <div>Low Rate Beta: <span className="font-mono font-medium">{tierResult.calculatedBetas.lowRate.toFixed(3)}</span></div>
                                <div>High Rate Beta: <span className="font-mono font-medium">{tierResult.calculatedBetas.highRate.toFixed(3)}</span></div>
                                <div>R² Correlation: <span className="font-mono font-medium">{tierResult.rSquared.toFixed(3)}</span></div>
                                <div>Data Points: <span className="font-mono font-medium">{tierResult.dataPoints}</span></div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded p-3">
                              <h6 className="font-medium text-gray-700 mb-2">Calculation Details</h6>
                              <div className="space-y-2 text-xs text-gray-600">
                                <div><strong>Method:</strong> {tierResult.calculation.methodology.replace('_', ' ').toUpperCase()}</div>
                                
                                {tierResult.calculation.details && (
                                  <div className="bg-white p-2 rounded border">
                                    {tierResult.calculation.details.formula && (
                                      <div className="font-mono text-xs mb-2">{tierResult.calculation.details.formula}</div>
                                    )}
                                    {tierResult.calculation.details.equation && (
                                      <div className="font-mono text-xs mb-2">{tierResult.calculation.details.equation}</div>
                                    )}
                                    
                                    {/* Zone-Specific Beta Breakdown */}
                                    {tierResult.calculation.details.zoneBreakdown && (
                                      <div className="mt-2 border-t pt-2">
                                        <div className="font-medium text-xs text-gray-700 mb-2">Zone-Specific Betas:</div>
                                        <div className="space-y-1">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-blue-700">Low Rate Zone ({tierResult.calculation.details.zoneBreakdown.lowZone.threshold}):</span>
                                            <span className="font-mono text-xs">β={tierResult.calculation.details.zoneBreakdown.lowZone.beta} (n={tierResult.calculation.details.zoneBreakdown.lowZone.dataPoints})</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-green-700">Mid Rate Zone ({tierResult.calculation.details.zoneBreakdown.midZone.threshold}):</span>
                                            <span className="font-mono text-xs">β={tierResult.calculation.details.zoneBreakdown.midZone.beta} (n={tierResult.calculation.details.zoneBreakdown.midZone.dataPoints})</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-red-700">High Rate Zone ({tierResult.calculation.details.zoneBreakdown.highZone.threshold}):</span>
                                            <span className="font-mono text-xs">β={tierResult.calculation.details.zoneBreakdown.highZone.beta} (n={tierResult.calculation.details.zoneBreakdown.highZone.dataPoints})</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Through-Cycle Beta Breakdown */}
                                    {tierResult.calculation.details.throughCycleBreakdown && (
                                      <div className="mt-2 border-t pt-2">
                                        <div className="font-medium text-xs text-gray-700 mb-2">Rate-Specific Betas:</div>
                                        <div className="max-h-32 overflow-y-auto bg-white border rounded">
                                          <table className="w-full text-xs">
                                            <thead className="bg-gray-100 sticky top-0">
                                              <tr>
                                                <th className="px-2 py-1 text-left">BoE Rate</th>
                                                <th className="px-2 py-1 text-left">Beta</th>
                                                <th className="px-2 py-1 text-left">Data Points</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {tierResult.calculation.details.throughCycleBreakdown.map((step: any, idx: number) => (
                                                <tr key={idx} className="border-t border-gray-100">
                                                  <td className="px-2 py-1 font-mono">{step.boeRate}</td>
                                                  <td className="px-2 py-1 font-mono font-medium">{step.beta}</td>
                                                  <td className="px-2 py-1 font-mono">{step.details?.dataPoints || 'N/A'}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          Step Size: {tierResult.calculation.details.rateStepSize} | 
                                          Smoothing: {tierResult.calculation.details.smoothingApplied ? 'Applied' : 'None'}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {tierResult.calculation.details.hikeCount !== undefined && (
                                      <div>Rate Hikes: {tierResult.calculation.details.hikeCount} (β={tierResult.calculation.details.hikeBeta})</div>
                                    )}
                                    {tierResult.calculation.details.cutCount !== undefined && (
                                      <div>Rate Cuts: {tierResult.calculation.details.cutCount} (β={tierResult.calculation.details.cutBeta})</div>
                                    )}
                                    {tierResult.calculation.details.windowSize && (
                                      <div>Rolling Window: {tierResult.calculation.details.windowSize} periods</div>
                                    )}
                                    {tierResult.calculation.details.dataPoints && (
                                      <div>Regression Points: {tierResult.calculation.details.dataPoints}</div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Raw Data Breakdown */}
                                <div className="mt-3">
                                  <div className="font-medium text-gray-700 mb-2">Historical Rate Changes:</div>
                                  <div className="max-h-32 overflow-y-auto bg-white border rounded">
                                    <table className="w-full text-xs">
                                      <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                          <th className="px-2 py-1 text-left">Date</th>
                                          <th className="px-2 py-1 text-left">BoE Δ</th>
                                          <th className="px-2 py-1 text-left">Tier Δ</th>
                                          <th className="px-2 py-1 text-left">Beta</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {tierResult.calculation.breakdown?.slice(-10).map((row: any, idx: number) => (
                                          <tr key={idx} className="border-t border-gray-100">
                                            <td className="px-2 py-1">{row.date}</td>
                                            <td className="px-2 py-1 font-mono">{row.boeChange}</td>
                                            <td className="px-2 py-1 font-mono">{row.tierChange}</td>
                                            <td className="px-2 py-1 font-mono">{row.beta}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    {tierResult.calculation.breakdown && tierResult.calculation.breakdown.length > 10 && (
                                      <div className="text-xs text-gray-500 text-center py-1">
                                        Showing last 10 of {tierResult.calculation.breakdown.length} data points
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowCalibrationModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={applyCalibrationResults}
                      className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors"
                    >
                      Apply These Results
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Historical Calibration</h4>
                  <p className="text-gray-600 mb-4">
                    This feature will analyze historical rate movements to automatically calculate optimal beta parameters for each tier.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
                    <h5 className="font-medium text-blue-900 mb-3">Calculation Process:</h5>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div><strong>1. Data Collection:</strong> Fetch historical BoE rates and product tier rates for selected time period</div>
                      <div><strong>2. Change Detection:</strong> Calculate rate changes and identify significant movements</div>
                      <div><strong>3. Beta Calculation:</strong> Apply selected methodology (simple average, directional weighted, rolling average, or regression)</div>
                      <div><strong>4. Convexity Analysis:</strong> Detect breakpoints where rate sensitivity changes significantly</div>
                      <div><strong>5. Validation:</strong> Calculate confidence intervals and goodness-of-fit metrics</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCalibrationModal(false)}
                    className="mt-6 px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}