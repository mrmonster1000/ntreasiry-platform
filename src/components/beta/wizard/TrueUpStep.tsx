'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import type { 
  TrueUpConfig, 
  ProductTier, 
  CurrentProduct, 
  HistoricalConfig, 
  BetaConfig 
} from '../BetaCalibrationWizard';

interface TrueUpStepProps {
  config: BetaConfig;
  updateConfig: (updates: Partial<BetaConfig>) => void;
  currentProduct?: CurrentProduct;
  disabled?: boolean;
  onValidationChange?: (errors: string[]) => void;
}

interface GapAnalysis {
  tierName: string;
  currentRate: number;
  modelPrediction: number;
  gap: number; // in basis points
  gapPercentage: number;
  adjustmentNeeded: boolean;
  // Floor analysis
  floorRate: number;
  downShockPrediction: number;
  floorGap: number; // in basis points
  floorGapPercentage: number;
}

export function TrueUpStep({
  config,
  updateConfig,
  currentProduct,
  disabled = false,
  onValidationChange
}: TrueUpStepProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize true-up config if it doesn't exist
  useEffect(() => {
    if (config.calibrationMethod === 'historical' && !config.historicalConfig?.trueUp) {
      const defaultTrueUp: TrueUpConfig = {
        enabled: false,
        targetRates: {},
        allowedAdjustmentRange: 25, // 25% max adjustment
        proportionalAdjustment: true,
        gapTolerance: 10, // 10 basis points
        applySpotTrueUp: false,
        applyFloorTrueUp: false,
        adjustmentStrategy: 'all_zones' // Default: proportional across all zones
      };

      // Auto-populate target rates from current product
      if (currentProduct?.tiers) {
        currentProduct.tiers.forEach(tier => {
          defaultTrueUp.targetRates[tier.tier_name] = tier.rate;
        });
      }

      updateConfig({
        historicalConfig: {
          ...config.historicalConfig!,
          trueUp: defaultTrueUp
        }
      });
    }
  }, [config.calibrationMethod, config.historicalConfig, currentProduct]);

  // Calculate model prediction using precise zone-based beta progression
  const calculateModelPrediction = useCallback((tierName: string): number => {
    const currentBoeRate = 5.25; // Current BoE rate
    const historicalBoeRate = 0.5; // Starting point
    
    // Zone definitions with thresholds
    const zones = config.historicalConfig?.convexityZones?.zones || [
      { id: 'zone-1', name: 'Low Rate Regime', threshold: 2.0 },
      { id: 'zone-2', name: 'Medium Rate Regime', threshold: 4.5 },
      { id: 'zone-3', name: 'High Rate Regime', threshold: undefined }
    ];
    
    // Zone-specific beta coefficients for each tier
    const zoneBaseBetas = {
      'Tier 1': [0.12, 0.15, 0.18], // Low, Medium, High rate zones
      'Tier 2': [0.20, 0.25, 0.30]  // Higher betas for Tier 2
    };
    
    const tierBetas = zoneBaseBetas[tierName as keyof typeof zoneBaseBetas] || [0.15, 0.15, 0.15];
    
    // Starting product rate (historical base when BoE was 0.5%)
    let productRate = tierName === 'Tier 1' ? 0.8 : 1.2;
    let currentBoE = historicalBoeRate; // Start from 0.5%
    
    // Precise calculation using very small steps for accuracy
    while (currentBoE < currentBoeRate) {
      // Find current zone
      let zoneIndex = 0;
      for (let i = 0; i < zones.length; i++) {
        if (zones[i].threshold === undefined || currentBoE <= zones[i].threshold) {
          zoneIndex = i;
          break;
        }
      }
      
      const zoneBeta = tierBetas[zoneIndex];
      const step = 0.01; // Small step for precision
      const nextBoE = Math.min(currentBoE + step, currentBoeRate);
      const increment = (nextBoE - currentBoE) * zoneBeta;
      productRate += increment;
      currentBoE = nextBoE;
    }
    
    return Math.max(0.1, productRate);
  }, [config.historicalConfig?.convexityZones?.zones]);

  // Calculate model prediction for down shock scenario using FORWARD calculation approach
  const calculateDownShockPrediction = useCallback((tierName: string): number => {
    // Zone definitions with thresholds
    const zones = config.historicalConfig?.convexityZones?.zones || [
      { id: 'zone-1', name: 'Low Rate Regime', threshold: 2.0 },
      { id: 'zone-2', name: 'Medium Rate Regime', threshold: 4.5 },
      { id: 'zone-3', name: 'High Rate Regime', threshold: undefined }
    ];
    
    // Zone-specific beta coefficients for each tier
    const zoneBaseBetas = {
      'Tier 1': [0.12, 0.15, 0.18], // Low, Medium, High rate zones
      'Tier 2': [0.20, 0.25, 0.30]  // Higher betas for Tier 2
    };
    
    const tierBetas = zoneBaseBetas[tierName as keyof typeof zoneBaseBetas] || [0.15, 0.15, 0.15];
    
    // Step 1: Calculate what rate we get at 5.25% using current betas (forward from historical base)
    let spotRateWithCurrentBetas = tierName === 'Tier 1' ? 0.8 : 1.2; // Historical base
    let currentBoE = 0.5;
    
    while (currentBoE < 5.25) {
      let zoneIndex = 0;
      for (let i = 0; i < zones.length; i++) {
        if (zones[i].threshold === undefined || currentBoE <= zones[i].threshold) {
          zoneIndex = i;
          break;
        }
      }
      
      const zoneBeta = tierBetas[zoneIndex];
      const step = 0.01;
      const nextBoE = Math.min(currentBoE + step, 5.25);
      spotRateWithCurrentBetas += (nextBoE - currentBoE) * zoneBeta;
      currentBoE = nextBoE;
    }
    
    // Step 2: Now calculate floor by working backwards from this calculated spot rate
    let floorRate = spotRateWithCurrentBetas;
    currentBoE = 5.25;
    
    while (currentBoE > 0) {
      let zoneIndex = 0;
      for (let i = 0; i < zones.length; i++) {
        if (zones[i].threshold === undefined || currentBoE <= zones[i].threshold) {
          zoneIndex = i;
          break;
        }
      }
      
      const zoneBeta = tierBetas[zoneIndex];
      const step = 0.01;
      const nextBoE = Math.max(currentBoE - step, 0);
      floorRate -= (currentBoE - nextBoE) * zoneBeta;
      currentBoE = nextBoE;
    }
    
    return Math.max(0.01, floorRate);
  }, [config.historicalConfig?.convexityZones?.zones]);

  // Calculate gap analysis when true-up is enabled
  useEffect(() => {
    if (config.historicalConfig?.trueUp?.enabled && currentProduct?.tiers) {
      const analysis: GapAnalysis[] = currentProduct.tiers.map(tier => {
        // Spot rate analysis (current environment)
        const currentRate = config.historicalConfig!.trueUp!.targetRates[tier.tier_name] || tier.rate;
        const modelPrediction = calculateModelPrediction(tier.tier_name);
        const spotGap = (currentRate - modelPrediction) * 100; // Convert to basis points
        const spotGapPercentage = modelPrediction > 0 ? (spotGap / (modelPrediction * 100)) * 100 : 0;
        
        // Floor rate analysis (down shock scenario)
        const floorRate = config.rateFloorActive ? config.rateFloor : 0.1; // Use configured floor or 0.1% default
        const downShockPrediction = calculateDownShockPrediction(tier.tier_name);
        const floorGap = (floorRate - downShockPrediction) * 100; // Convert to basis points
        const floorGapPercentage = downShockPrediction > 0 ? (floorGap / (downShockPrediction * 100)) * 100 : 0;
        
        const gapTolerance = config.historicalConfig!.trueUp!.gapTolerance;
        
        return {
          tierName: tier.tier_name,
          currentRate,
          modelPrediction,
          gap: spotGap,
          gapPercentage: spotGapPercentage,
          adjustmentNeeded: Math.abs(spotGap) > gapTolerance || Math.abs(floorGap) > gapTolerance,
          // Add floor analysis
          floorRate,
          downShockPrediction,
          floorGap,
          floorGapPercentage
        };
      });
      
      setGapAnalysis(analysis);
    } else {
      setGapAnalysis([]);
    }
  }, [config.historicalConfig?.trueUp, config.rateFloor, config.rateFloorActive, currentProduct, calculateModelPrediction, calculateDownShockPrediction]);

  // Validate configuration
  useEffect(() => {
    const errors: string[] = [];
    
    if (config.historicalConfig?.trueUp?.enabled) {
      const trueUp = config.historicalConfig.trueUp;
      
      if (!trueUp.targetRates || Object.keys(trueUp.targetRates).length === 0) {
        errors.push('Please set target rates for true-up calibration');
      }
      
      if (trueUp.allowedAdjustmentRange <= 0 || trueUp.allowedAdjustmentRange > 100) {
        errors.push('Allowed adjustment range must be between 0% and 100%');
      }
      
      if (trueUp.gapTolerance < 0 || trueUp.gapTolerance > 100) {
        errors.push('Gap tolerance must be between 0 and 100 basis points');
      }
      
      // Check if any gaps exceed adjustment limits
      if (gapAnalysis.length > 0) {
        const maxGap = Math.max(...gapAnalysis.map(g => Math.abs(g.gapPercentage)));
        if (maxGap > trueUp.allowedAdjustmentRange) {
          errors.push(`Gap exceeds allowed adjustment range (${maxGap.toFixed(1)}% > ${trueUp.allowedAdjustmentRange}%)`);
        }
      }
    }

    setValidationErrors(errors);
    onValidationChange?.(errors);
  }, [config.historicalConfig?.trueUp, gapAnalysis]);

  const trueUpConfig = config.historicalConfig?.trueUp;
  
  if (config.calibrationMethod !== 'historical') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <InformationCircleIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">
          True-up calibration is only available for historical calibration methods.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* True-Up Introduction */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-blue-800 font-medium flex items-center mb-3">
          <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
          True-Up Calibration
        </h4>
        <p className="text-blue-700 text-sm mb-3">
          True-up calibration adjusts historical beta calculations to ensure your model accurately predicts current market rates. 
          This helps validate that your calibration approach produces realistic results.
        </p>
        <div className="bg-blue-100 border border-blue-300 rounded p-3">
          <p className="text-xs text-blue-800">
            <strong>How it works:</strong> The system compares your model's predictions against current actual rates, 
            then proportionally adjusts zone betas to minimize gaps while maintaining calibration coherence.
          </p>
        </div>
      </div>

      {/* Enable True-Up Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h5 className="font-medium text-gray-900">Enable True-Up Calibration</h5>
            <p className="text-sm text-gray-600">Adjust historical betas to match current rates</p>
          </div>
          <button
            onClick={() => {
              updateConfig({
                historicalConfig: {
                  ...config.historicalConfig!,
                  trueUp: {
                    ...trueUpConfig!,
                    enabled: !trueUpConfig?.enabled
                  }
                }
              });
            }}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              trueUpConfig?.enabled ? 'bg-blue-600' : 'bg-gray-200'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                trueUpConfig?.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Model Prediction Explanation - show if enabled */}
      {trueUpConfig?.enabled && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h5 className="font-medium text-gray-900 mb-3">How Model Predictions Are Calculated</h5>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Current Setup:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Current BoE Base Rate: <strong>5.25%</strong></li>
              <li>Zone Strategy: <strong>{config.historicalConfig?.convexityZones?.zoneStrategy || 'zones'}</strong></li>
              <li>Methodology: <strong>{config.historicalConfig?.methodology || 'simple_average'}</strong></li>
            </ul>
            <p><strong>Zone-Based Prediction:</strong> Each rate environment uses a different beta coefficient</p>
            <div className="mt-2 text-xs text-gray-600 bg-gray-100 rounded p-2">
              <p><strong>Zone-by-Zone Calculation (Tier 1 Example):</strong></p>
              
              <div className="mt-2 space-y-1">
                <p>• <strong>Starting Base:</strong> 0.8% (when BoE was 0.5%)</p>
                <p>• <strong>Zone 1 (0.5% → 2.0%):</strong> +1.5% × 0.12 = +0.18%</p>
                <p>• <strong>Zone 2 (2.0% → 4.5%):</strong> +2.5% × 0.15 = +0.38%</p>
                <p>• <strong>Zone 3 (4.5% → 5.25%):</strong> +0.75% × 0.18 = +0.14%</p>
                <p className="border-t border-gray-300 pt-1 font-medium">
                  • <strong>Total:</strong> 0.8% + 0.18% + 0.38% + 0.14% = <strong>1.50%</strong>
                </p>
              </div>
              
              <p className="mt-2 font-medium text-green-700">vs. Actual: <strong>1.50%</strong> (perfect match!)</p>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <p><strong>Zone-Specific Beta Coefficients:</strong></p>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="bg-blue-50 rounded p-1 text-center">
                  <div className="font-medium text-blue-800">Low Rate Zone</div>
                  <div>T1: 0.12 | T2: 0.20</div>
                </div>
                <div className="bg-green-50 rounded p-1 text-center">
                  <div className="font-medium text-green-800">Medium Rate Zone</div>
                  <div>T1: 0.15 | T2: 0.25</div>
                </div>
                <div className="bg-red-50 rounded p-1 text-center border border-red-200">
                  <div className="font-medium text-red-800">High Rate Zone (Current)</div>
                  <div>T1: 0.18 | T2: 0.30</div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="font-medium text-yellow-800 mb-1">💡 Cumulative Rate Calculation Method:</p>
              <p><strong>Current Rate:</strong> Cumulative rate from 0% BoE → each point using current betas</p>
              <p><strong>Adjusted Rate:</strong> Cumulative rate from 0% BoE → each point using adjusted betas</p>
              <p><strong>Rate Adj:</strong> Difference between adjusted and current cumulative rates</p>
              <p className="mt-1">
                <strong>Example:</strong> 70bp floor gap ÷ 525bp movement = 0.1333 beta adjustment across all zones
              </p>
            </div>
            
            <p className="text-xs text-gray-600 mt-2">
              Note: This is a simplified mock calculation. In the full implementation, betas would be derived from historical rate movements.
            </p>
          </div>
        </div>
      )}

      {/* True-Up Configuration - only show if enabled */}
      {trueUpConfig?.enabled && (
        <>
          {/* Target Rates Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Target Rates</h5>
            <p className="text-sm text-gray-600 mb-4">
              Set the current market rates that your model should predict accurately.
            </p>
            
            
            <div className="space-y-3">
              {currentProduct?.tiers?.map(tier => (
                <div key={tier.tier_name} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {tier.tier_name} Current Rate
                    </label>
                    <div className="text-xs text-gray-500">{tier.balance_range}</div>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      value={trueUpConfig.targetRates[tier.tier_name] || tier.rate}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        updateConfig({
                          historicalConfig: {
                            ...config.historicalConfig!,
                            trueUp: {
                              ...trueUpConfig,
                              targetRates: {
                                ...trueUpConfig.targetRates,
                                [tier.tier_name]: value
                              }
                            }
                          }
                        });
                      }}
                      disabled={disabled}
                      min="0"
                      max="10"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="text-sm text-gray-500">%</div>
                </div>
              ))}
            </div>
          </div>

          {/* True-Up Parameters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Adjustment Parameters</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Adjustment Range
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={trueUpConfig.allowedAdjustmentRange}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateConfig({
                        historicalConfig: {
                          ...config.historicalConfig!,
                          trueUp: {
                            ...trueUpConfig,
                            allowedAdjustmentRange: Math.min(100, Math.max(0, value))
                          }
                        }
                      });
                    }}
                    disabled={disabled}
                    min="0"
                    max="100"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum beta adjustment allowed</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gap Tolerance
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={trueUpConfig.gapTolerance}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateConfig({
                        historicalConfig: {
                          ...config.historicalConfig!,
                          trueUp: {
                            ...trueUpConfig,
                            gapTolerance: Math.max(0, value)
                          }
                        }
                      });
                    }}
                    disabled={disabled}
                    min="0"
                    max="100"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-500">bp</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Acceptable gap before adjustment</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment Method
                </label>
                <select
                  value={trueUpConfig.proportionalAdjustment ? 'proportional' : 'additive'}
                  onChange={(e) => {
                    updateConfig({
                      historicalConfig: {
                        ...config.historicalConfig!,
                        trueUp: {
                          ...trueUpConfig,
                          proportionalAdjustment: e.target.value === 'proportional'
                        }
                      }
                    });
                  }}
                  disabled={disabled}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="proportional">Proportional</option>
                  <option value="additive">Additive</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">How to distribute adjustments</p>
              </div>
            </div>
          </div>

          {/* True-Up Control Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h5 className="font-medium text-gray-900 mb-4">True-Up Strategy</h5>
            
            {/* Target Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <h6 className="text-sm font-medium text-gray-700">True-Up Targets</h6>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={trueUpConfig.applySpotTrueUp}
                    onChange={(e) => {
                      // Auto-populate target rates when enabling spot true-up
                      const autoTargetRates = currentProduct?.tiers ? 
                        currentProduct.tiers.reduce((acc, tier) => {
                          acc[tier.tier_name] = tier.rate;
                          return acc;
                        }, {} as Record<string, number>) : 
                        trueUpConfig.targetRates;

                      updateConfig({
                        historicalConfig: {
                          ...config.historicalConfig!,
                          trueUp: {
                            ...trueUpConfig,
                            applySpotTrueUp: e.target.checked,
                            targetRates: autoTargetRates
                          }
                        }
                      });
                    }}
                    disabled={disabled}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Apply Spot Rate True-Up (1.50% at 5.25%)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={trueUpConfig.applyFloorTrueUp}
                    onChange={(e) => {
                      // Auto-populate target rates when enabling floor true-up
                      const autoTargetRates = currentProduct?.tiers ? 
                        currentProduct.tiers.reduce((acc, tier) => {
                          acc[tier.tier_name] = tier.rate;
                          return acc;
                        }, {} as Record<string, number>) : 
                        trueUpConfig.targetRates;

                      updateConfig({
                        historicalConfig: {
                          ...config.historicalConfig!,
                          trueUp: {
                            ...trueUpConfig,
                            applyFloorTrueUp: e.target.checked,
                            targetRates: autoTargetRates
                          }
                        }
                      });
                    }}
                    disabled={disabled}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Apply Floor Rate True-Up ({config.rateFloor?.toFixed(2) || '0.10'}% at 0%)</span>
                </label>
              </div>
              
              <div className="space-y-2">
                <h6 className="text-sm font-medium text-gray-700">Zone Adjustment Strategy</h6>
                <select
                  value={trueUpConfig.adjustmentStrategy}
                  onChange={(e) => {
                    updateConfig({
                      historicalConfig: {
                        ...config.historicalConfig!,
                        trueUp: {
                          ...trueUpConfig,
                          adjustmentStrategy: e.target.value as any
                        }
                      }
                    });
                  }}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all_zones">Proportional Across All Zones</option>
                  <option value="current_zone">Current Zone Only (High Rate)</option>
                  <option value="low_zone">Low Zone Only</option>
                  <option value="high_zone">High Zone Only</option>
                  <option value="all_except_current">All Zones Except Current (Low + Medium)</option>
                </select>
                <p className="text-xs text-gray-500">
                  How to distribute beta adjustments across rate environments
                </p>
                
                {/* Strategy Validation Warnings */}
                {(trueUpConfig.adjustmentStrategy === 'current_zone' || trueUpConfig.adjustmentStrategy === 'high_zone') && 
                 trueUpConfig.applyFloorTrueUp && !trueUpConfig.applySpotTrueUp && (
                  <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
                    ⚠️ Adjusting only the high rate zone will have limited impact on floor rates at 0% BoE
                  </div>
                )}
                
                
                {trueUpConfig.adjustmentStrategy === 'all_except_current' && (
                  <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
                    💡 This strategy preserves current environment (High zone) sensitivities while adjusting Low + Medium zones
                  </div>
                )}
                
                {/* Dual-Target Conflict Warning */}
                {trueUpConfig.applySpotTrueUp && trueUpConfig.applyFloorTrueUp && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-3">
                    <div className="font-medium mb-1">🚨 Dual-Target Optimization Conflict</div>
                    <p className="mb-2">
                      You're trying to solve two conflicting equations with the same beta variables:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>Equation 1:</strong> Adjusted betas must produce 1.50% at 5.25% BoE (spot target)</li>
                      <li><strong>Equation 2:</strong> Same adjusted betas must produce 0.10% at 0% BoE (floor target)</li>
                    </ul>
                    <p className="mt-2">
                      <strong>Result:</strong> The model will compromise between both targets. Neither may be hit exactly. 
                      Consider applying only one true-up at a time for precise calibration.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comprehensive Rate Ladder Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium text-gray-900">Rate Ladder Analysis (Tier 1)</h5>
              <span className="text-xs text-gray-500">25bp increments | 0% to 5.25% BoE</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-2 font-medium text-gray-700">BoE Rate</th>
                    <th className="text-center py-2 px-2 font-medium text-gray-700">Zone</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">Current Beta</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">Current Rate</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">Beta Adj</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">Rate Adj</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700 bg-blue-50">Adjusted Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Calculate global beta adjustment once for the entire table
                    const zones = config.historicalConfig?.convexityZones?.zones || [
                      { id: 'zone-1', name: 'Low', threshold: 2.0 },
                      { id: 'zone-2', name: 'Mid', threshold: 4.5 },
                      { id: 'zone-3', name: 'High', threshold: undefined }
                    ];
                    // Dynamic zone base betas - should come from actual calibration
                    // For now, use reasonable defaults that scale with number of zones
                    const getZoneBaseBetas = (zoneCount: number) => {
                      if (zoneCount === 2) return [0.12, 0.20];
                      if (zoneCount === 3) return [0.12, 0.15, 0.18];
                      if (zoneCount === 4) return [0.10, 0.13, 0.16, 0.20];
                      if (zoneCount === 5) return [0.08, 0.11, 0.14, 0.17, 0.22];
                      return [0.12, 0.15, 0.18]; // Default fallback
                    };
                    const zoneBaseBetas = getZoneBaseBetas(zones.length);
                    const strategy = trueUpConfig.adjustmentStrategy;
                    
                    // Dynamic configuration based on actual setup
                    const historicalBaseRate = 0.5; // Historical BoE base rate (could be configurable)
                    const historicalProductRate = currentProduct?.tiers?.[0]?.rate ? 
                      currentProduct.tiers[0].rate * 0.53 : 0.8; // Historical rate based on tier 1, scaled down
                    const lowZoneThreshold = zones[0]?.threshold || 2.0;
                    const lowZoneMovement = lowZoneThreshold - historicalBaseRate;
                    
                    // Calculate the global beta adjustment for low zone and all_except_current strategies
                    let globalBetaAdjustment = 0;
                    if ((trueUpConfig.applySpotTrueUp || trueUpConfig.applyFloorTrueUp) && (strategy === 'low_zone' || strategy === 'all_except_current')) {
                      // Calculate actual gap using same logic as the newer true-up calculation
                      // Use floor target for floor true-up, spot target for spot true-up
                      const currentTargetRate = trueUpConfig.applyFloorTrueUp ? 0.10 : (trueUpConfig.targetRates['Tier 1'] || 1.50);
                      const targetBoERate = trueUpConfig.applyFloorTrueUp ? 0.0 : 5.25;
                      
                      // Use the SAME calculation logic as the newer true-up calculation
                      let currentSpotPrediction = historicalProductRate; // Use dynamic historical base
                      let tempBoE = historicalBaseRate; // Use dynamic historical BoE base
                      
                      if (trueUpConfig.applyFloorTrueUp) {
                        // For floor true-up: calculate what rate we get at 0% BoE (work backwards)
                        currentSpotPrediction = historicalProductRate - (historicalBaseRate * zoneBaseBetas[0]);
                      } else {
                        // For spot true-up: calculate what rate we get at 5.25% BoE (work forwards)
                        while (tempBoE < targetBoERate) {
                          let tempZoneIndex = 0;
                          for (let j = 0; j < zones.length; j++) {
                            if (zones[j].threshold === undefined || tempBoE <= zones[j].threshold) {
                              tempZoneIndex = j;
                              break;
                            }
                          }
                          
                          const tempBeta = zoneBaseBetas[tempZoneIndex];
                          const nextStep = Math.min(tempBoE + 0.25, targetBoERate);
                          const increment = (nextStep - tempBoE) * tempBeta;
                          currentSpotPrediction += increment;
                          tempBoE = nextStep;
                        }
                      }
                      
                      const actualGap = currentTargetRate - currentSpotPrediction;
                      if (trueUpConfig.applyFloorTrueUp) {
                        // For floor true-up: calculate beta adjustment to hit floor target
                        const currentFloorPrediction = historicalProductRate - (historicalBaseRate * zoneBaseBetas[0]);
                        const floorGap = currentTargetRate - currentFloorPrediction;
                        // Calculate range based on strategy using actual zone configuration
                        let adjustmentRange;
                        if (strategy === 'low_zone') {
                          // Low zone only: 0% to first zone threshold
                          adjustmentRange = zones[0]?.threshold || 2.0;
                        } else if (strategy === 'all_except_current') {
                          // All lower zones: 0% to threshold before current zone
                          // Find current zone (where 5.25% BoE falls)
                          let currentZoneIndex = zones.length - 1; // Default to last zone
                          for (let i = 0; i < zones.length; i++) {
                            if (zones[i].threshold === undefined || 5.25 <= zones[i].threshold) {
                              currentZoneIndex = i;
                              break;
                            }
                          }
                          // Use threshold of zone before current zone
                          if (currentZoneIndex > 0) {
                            adjustmentRange = zones[currentZoneIndex - 1]?.threshold || 4.5;
                          } else {
                            adjustmentRange = 2.0; // Fallback if current is first zone
                          }
                        }
                        globalBetaAdjustment = -floorGap / adjustmentRange; // Negative sign to correct direction
                      } else {
                        // For spot true-up: use proportional calculation based on strategy
                        if (strategy === 'low_zone') {
                          globalBetaAdjustment = actualGap / lowZoneMovement;
                        } else if (strategy === 'all_except_current') {
                          // Calculate movement for all zones except current
                          let currentZoneIndex = zones.length - 1;
                          for (let i = 0; i < zones.length; i++) {
                            if (zones[i].threshold === undefined || 5.25 <= zones[i].threshold) {
                              currentZoneIndex = i;
                              break;
                            }
                          }
                          // Calculate total movement from historical base to threshold before current zone
                          const beforeCurrentThreshold = currentZoneIndex > 0 ? zones[currentZoneIndex - 1]?.threshold || 4.5 : 2.0;
                          const allExceptCurrentMovement = beforeCurrentThreshold - historicalBaseRate;
                          globalBetaAdjustment = actualGap / allExceptCurrentMovement;
                        }
                      }
                    }
                    
                    return Array.from({ length: 22 }, (_, i) => {
                      const boeRate = i * 0.25; // 0%, 0.25%, 0.50%, ..., 5.25%
                      
                      // Determine zone index (0 = first/low zone, zones.length-1 = last/high zone)
                      let zoneIndex = 0;
                      for (let j = 0; j < zones.length; j++) {
                        if (zones[j].threshold === undefined || boeRate <= zones[j].threshold) {
                          zoneIndex = j;
                          break;
                        }
                      }
                      const zoneName = zones[zoneIndex]?.name || `Zone ${zoneIndex + 1}`;
                      
                      const currentBeta = zoneBaseBetas[zoneIndex];
                    
                    // Calculate CUMULATIVE current rate from 0% BoE up to this point (BASELINE - no adjustments)
                    let currentRate = historicalProductRate; // Historical base at starting BoE rate
                    let tempBoE = historicalBaseRate; // Starting point
                    
                    // If we're at or below the starting point, use the base rate
                    if (boeRate <= historicalBaseRate) {
                      // For rates at or below historical base%, work backwards from base
                      const backwardMovement = historicalBaseRate - boeRate;
                      const lowZoneBeta = zoneBaseBetas[0]; // Use low zone beta for backward movement
                      currentRate = historicalProductRate - (backwardMovement * lowZoneBeta);
                    } else {
                      // For rates above 0.5%, work forward from base using ORIGINAL betas (no adjustments)
                      while (tempBoE < boeRate) {
                        let tempZoneIndex = 0;
                        for (let j = 0; j < zones.length; j++) {
                          if (zones[j].threshold === undefined || tempBoE <= zones[j].threshold) {
                            tempZoneIndex = j;
                            break;
                          }
                        }
                        
                        const tempBeta = zoneBaseBetas[tempZoneIndex]; // Original beta, no adjustments
                        const nextStep = Math.min(tempBoE + 0.25, boeRate);
                        const increment = (nextStep - tempBoE) * tempBeta;
                        currentRate += increment;
                        tempBoE = nextStep;
                      }
                    }
                    
                    // Simple floor true-up calculation
                    let adjustedRate = currentRate;
                    let betaAdjustment = 0;
                    let rateAdjustment = 0;
                    
                    // Debug: Check if we should be calculating anything at all
                    const shouldCalculate = trueUpConfig.applyFloorTrueUp || trueUpConfig.applySpotTrueUp;
                    
                    
                    if (false && trueUpConfig.applyFloorTrueUp) { // Disable separate floor logic
                      // Floor true-up: ensures both floor (0.10% at 0% BoE) and spot (1.50% at 5.25% BoE) are hit
                      const targetFloor = 0.10;
                      const targetSpot = 1.50;
                      const strategy = trueUpConfig.adjustmentStrategy;
                      
                      // Zone-specific floor true-up strategies
                      switch (strategy) {
                        case 'all_zones':
                          // Uniform beta across all zones to achieve linear relationship
                          const requiredRateChange = targetSpot - targetFloor; // 1.40%
                          const requiredNewBeta = requiredRateChange / 5.25; // 0.2667
                          betaAdjustment = requiredNewBeta - currentBeta;
                          adjustedRate = targetFloor + (boeRate * (currentBeta + betaAdjustment));
                          break;
                          
                        case 'low_zone':
                          // Only adjust low zone beta to achieve floor target (0.10% at 0% BoE)
                          if (zoneIndex === 0) { // First zone (low zone)
                            // Calculate what the current model predicts at 0% BoE
                            const currentFloorPrediction = historicalProductRate - (historicalBaseRate * zoneBaseBetas[0]);
                            const floorGap = targetFloor - currentFloorPrediction; // e.g., 0.10% - 0.74% = -0.64%
                            
                            // To reduce the rate at 0% BoE, we need to REDUCE the beta in the low zone
                            // The gap is negative (need to go down), so we need a negative beta adjustment
                            betaAdjustment = floorGap / historicalBaseRate; // This will be negative, which is correct
                          } else {
                            betaAdjustment = 0; // No adjustment for medium/high zones
                          }
                          
                          // Calculate using zone-by-zone progression with adjusted low zone
                          // CRITICAL: The cumulative effect must carry forward through all zones
                          if (boeRate <= historicalBaseRate) {
                            const backwardMovement = historicalBaseRate - boeRate;
                            // Use the adjusted low zone beta even when going backwards
                            const adjustedLowBeta = zoneBaseBetas[0] + betaAdjustment;
                            adjustedRate = historicalProductRate - (backwardMovement * adjustedLowBeta);
                          } else {
                            // Build up the rate cumulatively, starting from the adjusted low zone base
                            let tempRate = historicalProductRate; // Use dynamic historical base
                            let tempBoE = historicalBaseRate;
                            
                            // Calculate the total boost from low zone adjustment
                            let accumulatedBoost = 0;
                            
                            while (tempBoE < boeRate) {
                              let tempZoneIdx = 0;
                              let tempZoneName = 'Low';
                              for (let j = 0; j < zones.length; j++) {
                                if (zones[j].threshold === undefined || tempBoE <= zones[j].threshold) {
                                  tempZoneIdx = j;
                                  tempZoneName = zones[j].name;
                                  break;
                                }
                              }
                              
                              const nextStep = Math.min(tempBoE + 0.25, boeRate);
                              const stepSize = nextStep - tempBoE;
                              
                              if (tempZoneIdx === 0) { // First zone (low zone)
                                // In low zone: apply the beta adjustment
                                const adjustedTempBeta = zoneBaseBetas[tempZoneIdx] + betaAdjustment;
                                const stepIncrement = stepSize * adjustedTempBeta;
                                tempRate += stepIncrement;
                                // Track the additional boost for later zones
                                accumulatedBoost += stepSize * betaAdjustment;
                              } else {
                                // In medium/high zones: use original beta but carry forward the accumulated boost
                                const originalIncrement = stepSize * zoneBaseBetas[tempZoneIdx];
                                tempRate += originalIncrement;
                                // The accumulated boost from low zone remains in the total rate
                              }
                              
                              tempBoE = nextStep;
                            }
                            adjustedRate = tempRate;
                          }
                          break;
                          
                        case 'all_except_current':
                          // Adjust all zones except current (high) zone
                          if (zoneIndex !== zones.length - 1) { // All zones except last zone (high zone)
                            const requiredRateChange = targetSpot - targetFloor; // 1.40%
                            const requiredNewBeta = requiredRateChange / 5.25; // 0.2667
                            betaAdjustment = requiredNewBeta - currentBeta;
                          } else {
                            betaAdjustment = 0; // No adjustment for high zone
                          }
                          
                          // Apply adjustment to all zones except high zone
                          if (zoneIndex !== zones.length - 1) { // All zones except last zone (high zone)
                            adjustedRate = targetFloor + (boeRate * (currentBeta + betaAdjustment));
                          } else {
                            // Keep high zone with original beta
                            adjustedRate = targetFloor + (boeRate * currentBeta);
                          }
                          break;
                          
                        case 'high_zone':
                          // Only adjust high zone beta (less effective for floor targeting)
                          if (zoneIndex === zones.length - 1) { // Last zone (high zone)
                            // Calculate what rate we get at 5.25% with current betas
                            let currentSpotWithOriginalBetas = 0.8; // Base at 0.5%
                            let tempBoE = 0.5;
                            while (tempBoE < 5.25) {
                              let tempZoneIdx = 0;
                              for (let j = 0; j < zones.length; j++) {
                                if (zones[j].threshold === undefined || tempBoE <= zones[j].threshold) {
                                  tempZoneIdx = j;
                                  break;
                                }
                              }
                              const tempBeta = zoneBaseBetas[tempZoneIdx];
                              const nextStep = Math.min(tempBoE + 0.25, 5.25);
                              currentSpotWithOriginalBetas += (nextStep - tempBoE) * tempBeta;
                              tempBoE = nextStep;
                            }
                            
                            // We need additional rate contribution from high zone only
                            const spotGap = targetSpot - currentSpotWithOriginalBetas; // e.g., 1.50% - 1.48% = 0.02%
                            
                            // High zone covers 4.5% to 5.25% BoE = 0.75% of BoE movement
                            const highZoneBoEMovement = 5.25 - 4.5; // 0.75%
                            
                            // To get 0.02% extra rate from 0.75% BoE movement: 0.02% / 0.75% = 0.0267 beta adjustment
                            betaAdjustment = spotGap / highZoneBoEMovement;
                          }
                          
                          // Calculate adjusted rate using zone-based progression with only high zone adjusted
                          if (boeRate <= 0.5) {
                            const backwardMovement = 0.5 - boeRate;
                            adjustedRate = 0.8 - (backwardMovement * 0.12); // No adjustment below 0.5%
                          } else {
                            let tempRate = 0.8; // Base at 0.5%
                            let tempBoE = 0.5;
                            while (tempBoE < boeRate) {
                              let tempZoneIdx = 0;
                              let tempZoneName = 'Low';
                              for (let j = 0; j < zones.length; j++) {
                                if (zones[j].threshold === undefined || tempBoE <= zones[j].threshold) {
                                  tempZoneIdx = j;
                                  tempZoneName = zones[j].name;
                                  break;
                                }
                              }
                              
                              // Only apply adjustment to high zone
                              const tempBetaAdjustment = tempZoneName.includes('High') ? betaAdjustment : 0;
                              const adjustedTempBeta = zoneBaseBetas[tempZoneIdx] + tempBetaAdjustment;
                              
                              const nextStep = Math.min(tempBoE + 0.25, boeRate);
                              tempRate += (nextStep - tempBoE) * adjustedTempBeta;
                              tempBoE = nextStep;
                            }
                            adjustedRate = tempRate;
                          }
                          break;
                          
                        case 'current_zone':
                          // Adjust the zone containing current BoE rate (High zone at 5.25%)
                          if (zoneName === 'High') {
                            // Same calculation as high_zone since current rate is in high zone
                            let currentSpotWithOriginalBetas = 0.8; // Base at 0.5%
                            let tempBoE = 0.5;
                            while (tempBoE < 5.25) {
                              let tempZoneIdx = 0;
                              for (let j = 0; j < zones.length; j++) {
                                if (zones[j].threshold === undefined || tempBoE <= zones[j].threshold) {
                                  tempZoneIdx = j;
                                  break;
                                }
                              }
                              const tempBeta = zoneBaseBetas[tempZoneIdx];
                              const nextStep = Math.min(tempBoE + 0.25, 5.25);
                              currentSpotWithOriginalBetas += (nextStep - tempBoE) * tempBeta;
                              tempBoE = nextStep;
                            }
                            
                            const spotGap = targetSpot - currentSpotWithOriginalBetas;
                            const currentZoneBoEMovement = 5.25 - 4.5; // High zone: 0.75%
                            betaAdjustment = spotGap / currentZoneBoEMovement;
                          }
                          
                          // Calculate adjusted rate using zone-based progression with only current zone adjusted
                          if (boeRate <= 0.5) {
                            const backwardMovement = 0.5 - boeRate;
                            adjustedRate = 0.8 - (backwardMovement * 0.12); // No adjustment below 0.5%
                          } else {
                            let tempRate = 0.8; // Base at 0.5%
                            let tempBoE = 0.5;
                            while (tempBoE < boeRate) {
                              let tempZoneIdx = 0;
                              let tempZoneName = 'Low';
                              for (let j = 0; j < zones.length; j++) {
                                if (zones[j].threshold === undefined || tempBoE <= zones[j].threshold) {
                                  tempZoneIdx = j;
                                  tempZoneName = zones[j].name;
                                  break;
                                }
                              }
                              
                              // Only apply adjustment to current zone (high zone)
                              const tempBetaAdjustment = tempZoneName.includes('High') ? betaAdjustment : 0;
                              const adjustedTempBeta = zoneBaseBetas[tempZoneIdx] + tempBetaAdjustment;
                              
                              const nextStep = Math.min(tempBoE + 0.25, boeRate);
                              tempRate += (nextStep - tempBoE) * adjustedTempBeta;
                              tempBoE = nextStep;
                            }
                            adjustedRate = tempRate;
                          }
                          break;
                      }
                      
                      rateAdjustment = adjustedRate - currentRate;
                      
                    } else if (trueUpConfig.applySpotTrueUp || trueUpConfig.applyFloorTrueUp) {
                      // Unified true-up: handles both spot and floor targets using consistent logic
                      const targetSpot = 1.50;
                      const strategy = trueUpConfig.adjustmentStrategy;
                      
                      
                      
                      
                      // Calculate what the current model predicts at target BoE rate
                      let currentSpotPrediction = historicalProductRate; // Use dynamic historical base
                      let tempBoE = historicalBaseRate; // Use dynamic historical BoE base
                      
                      if (trueUpConfig.applyFloorTrueUp) {
                        // For floor true-up: calculate what rate we get at 0% BoE
                        currentSpotPrediction = historicalProductRate - (historicalBaseRate * zoneBaseBetas[0]);
                      } else {
                        // For spot true-up: calculate what rate we get at 5.25% BoE
                        while (tempBoE < 5.25) {
                          let tempZoneIndex = 0;
                          for (let j = 0; j < zones.length; j++) {
                            if (zones[j].threshold === undefined || tempBoE <= zones[j].threshold) {
                              tempZoneIndex = j;
                              break;
                            }
                          }
                          
                          const tempBeta = zoneBaseBetas[tempZoneIndex];
                          const nextStep = Math.min(tempBoE + 0.25, 5.25);
                          const increment = (nextStep - tempBoE) * tempBeta;
                          currentSpotPrediction += increment;
                          tempBoE = nextStep;
                        }
                      }
                      
                      // Calculate gap and required adjustment
                      const targetRate = trueUpConfig.applyFloorTrueUp ? 0.10 : targetSpot;
                      const spotGap = targetRate - currentSpotPrediction; // Gap to target rate
                      
                      
                      // Apply zone-specific adjustment strategy
                      switch (strategy) {
                        case 'all_zones':
                          // Distribute proportionally across all zones
                          if (trueUpConfig.applyFloorTrueUp) {
                            // For floor true-up: we need to achieve both floor (0.10% at 0% BoE) and spot (1.50% at 5.25% BoE)
                            // This requires linear relationship: rate = floor + (BoE * uniform_beta)
                            // uniform_beta = (spot - floor) / (5.25 - 0) = (1.50 - 0.10) / 5.25 = 0.2667
                            const targetFloor = 0.10;
                            const targetSpot = 1.50;
                            const requiredUniformBeta = (targetSpot - targetFloor) / 5.25;
                            betaAdjustment = requiredUniformBeta - currentBeta;
                          } else {
                            // For spot true-up: distribute across total BoE movement
                            const totalBoeMovement = 5.25 - historicalBaseRate; // movement from historical base
                            betaAdjustment = spotGap / totalBoeMovement;
                          }
                          break;
                          
                        case 'current_zone':
                          // Only adjust the zone that contains current BoE rate (5.25% = Last zone)
                          if (zoneIndex === zones.length - 1) {
                            // Calculate how much BoE movement happens in high zone (4.5% to 5.25% = 0.75%)
                            const highZoneMovement = 5.25 - 4.5; // 0.75%
                            betaAdjustment = spotGap / highZoneMovement; // Larger adjustment since only high zone contributes
                          }
                          break;
                          
                        case 'high_zone':
                          // Only adjust high rate zone (last zone)
                          if (zoneIndex === zones.length - 1) {
                            const highZoneMovement = 5.25 - 4.5; // 0.75%
                            betaAdjustment = spotGap / highZoneMovement;
                          }
                          break;
                          
                        case 'low_zone':
                          // Only adjust low rate zone (first zone, index 0) - compensate for gap by boosting low zone rates
                          if (zoneIndex === 0) {
                            if (trueUpConfig.applyFloorTrueUp) {
                              // For floor true-up: calculate beta adjustment needed to hit target floor
                              // Current floor prediction: historicalProductRate - (historicalBaseRate * currentBeta)
                              // Target floor: 0.10%
                              // We need: targetFloor = historicalProductRate - (historicalBaseRate * adjustedBeta)
                              // So: adjustedBeta = (historicalProductRate - targetFloor) / historicalBaseRate
                              const targetFloor = 0.10;
                              // Use the same calculation as globalBetaAdjustment for consistency
                              betaAdjustment = globalBetaAdjustment;
                            } else {
                              // For spot true-up: calculate based on low zone movement
                              const lowZoneMovement = 2.0 - 0.5; // 1.5% movement in low zone
                              betaAdjustment = spotGap / lowZoneMovement; // Actual gap divided by low zone BoE movement
                            }
                          } else {
                            betaAdjustment = 0; // No adjustment for medium/high zones
                          }
                          break;
                          
                        case 'all_except_current':
                          // Adjust all zones except current (last) zone
                          if (zoneIndex !== zones.length - 1) {
                            // Distribute adjustment across low and medium zones (0.5% to 4.5% = 4.0% movement)
                            const nonCurrentZoneMovement = 4.5 - 0.5; // 4.0% movement (low + medium zones)
                            betaAdjustment = spotGap / nonCurrentZoneMovement;
                          } else {
                            betaAdjustment = 0; // No adjustment for high zone
                          }
                          break;
                      }
                      
                        // Calculate adjusted rate using the original model approach with zone-specific adjusted betas
                      // CRITICAL: For low zone strategy, ensure cumulative effect carries forward
                      
                      // Calculate adjusted rate using cumulative approach for ALL strategies
                      if (strategy === 'all_zones' && trueUpConfig.applyFloorTrueUp) {
                        // For all_zones floor true-up: use simple linear relationship
                        const targetFloor = 0.10;
                        adjustedRate = targetFloor + (boeRate * (currentBeta + betaAdjustment));
                      } else if (strategy === 'low_zone' && trueUpConfig.applyFloorTrueUp && boeRate <= (zones[0]?.threshold || 2.0)) {
                        // For low_zone floor true-up: work forward from target floor using adjusted beta
                        const targetFloor = 0.10;
                        const adjustedBeta = currentBeta + betaAdjustment;
                        adjustedRate = targetFloor + (boeRate * adjustedBeta);
                      } else if (strategy === 'all_except_current' && trueUpConfig.applyFloorTrueUp) {
                        // For all_except_current floor true-up: work forward from target floor using adjusted beta
                        // Determine if current rate is in a zone that should be adjusted
                        let currentZoneIndex = zones.length - 1; // Default to last zone
                        for (let i = 0; i < zones.length; i++) {
                          if (zones[i].threshold === undefined || 5.25 <= zones[i].threshold) {
                            currentZoneIndex = i;
                            break;
                          }
                        }
                        // Apply adjustment to all zones except current zone
                        if (zoneIndex < currentZoneIndex) {
                          const targetFloor = 0.10;
                          const adjustedBeta = currentBeta + betaAdjustment;
                          adjustedRate = targetFloor + (boeRate * adjustedBeta);
                        } else {
                          adjustedRate = currentRate; // No adjustment for current zone
                        }
                      } else if (boeRate <= historicalBaseRate) {
                        // Work backwards from historical base
                        const backwardMovement = historicalBaseRate - boeRate;
                        let tempBetaAdjustment = 0;
                        if (strategy === 'all_zones' ||
                            (strategy === 'low_zone' && zoneIndex === 0) ||
                            (strategy === 'all_except_current' && zoneIndex !== zones.length - 1)) {
                          tempBetaAdjustment = betaAdjustment;
                        }
                        const adjustedBeta = currentBeta + tempBetaAdjustment;
                        adjustedRate = historicalProductRate - (backwardMovement * adjustedBeta);
                      } else {
                        // For rates ABOVE historical base: floor true-up should NOT affect them
                        if (trueUpConfig.applyFloorTrueUp && strategy === 'low_zone') {
                          // Floor true-up with low zone strategy: no adjustment for rates above historical base
                          adjustedRate = currentRate; // Keep original rate unchanged
                        } else {
                          // Work forward from historical base with cumulative effect for other strategies
                          let tempRate = historicalProductRate; // Use dynamic historical base
                          let tempBoE = historicalBaseRate; // Use dynamic historical BoE base
                          
                          while (tempBoE < boeRate) {
                            let tempZoneIndex = 0;
                            let tempZoneName = 'Low';
                            for (let j = 0; j < zones.length; j++) {
                              if (zones[j].threshold === undefined || tempBoE <= zones[j].threshold) {
                                tempZoneIndex = j;
                                tempZoneName = zones[j].name;
                                break;
                              }
                            }
                            
                            const nextStep = Math.min(tempBoE + 0.25, boeRate);
                            const stepSize = nextStep - tempBoE;
                            
                            // Apply beta adjustment based on strategy for each step
                            let tempBetaAdjustment = 0;
                            if (strategy === 'all_zones') {
                              tempBetaAdjustment = betaAdjustment;
                            } else if (strategy === 'low_zone' && tempZoneIndex === 0) {
                              tempBetaAdjustment = globalBetaAdjustment;
                            } else if (strategy === 'high_zone' && tempZoneIndex === zones.length - 1) {
                              tempBetaAdjustment = betaAdjustment;
                            } else if (strategy === 'current_zone' && tempZoneIndex === zones.length - 1) {
                              tempBetaAdjustment = betaAdjustment;
                            } else if (strategy === 'all_except_current' && tempZoneIndex !== zones.length - 1) {
                              tempBetaAdjustment = betaAdjustment;
                            }
                            
                            const adjustedBeta = zoneBaseBetas[tempZoneIndex] + tempBetaAdjustment;
                            tempRate += stepSize * adjustedBeta;
                            tempBoE = nextStep;
                          }
                          
                          adjustedRate = tempRate;
                        }
                        
                      }
                      
                      // Calculate rate adjustment: show actual difference between adjusted and current rates
                      rateAdjustment = adjustedRate - currentRate;
                      
                      // For low zone strategy with floor true-up, only rates below the low zone threshold should be affected
                      if (strategy === 'low_zone' && trueUpConfig.applyFloorTrueUp) {
                        // For floor true-up: only zones at or below the low zone threshold should show adjustments
                        const lowZoneThreshold = zones[0]?.threshold || 2.0;
                        if (boeRate > lowZoneThreshold) {
                          // Rates above low zone threshold should not be affected by floor true-up
                          rateAdjustment = 0;
                          adjustedRate = currentRate;
                        }
                      }
                    }
                    
                    // Determine row styling
                    const isCurrentRate = boeRate === 5.25;
                    const isFloorRate = boeRate === 0;
                    const isZoneTransition = zones.some(z => z.threshold === boeRate);
                    
                    return (
                      <tr 
                        key={boeRate} 
                        className={`border-b border-gray-100 ${
                          isCurrentRate ? 'bg-green-50 border-green-200' : 
                          isFloorRate ? 'bg-red-50 border-red-200' :
                          isZoneTransition ? 'bg-yellow-50 border-yellow-200' : ''
                        }`}
                      >
                        <td className="py-1 px-2 font-medium">
                          {boeRate.toFixed(2)}%
                          {isCurrentRate && <span className="ml-1 text-green-600">*</span>}
                          {isFloorRate && <span className="ml-1 text-red-600">**</span>}
                        </td>
                        <td className={`py-1 px-2 text-center text-xs font-medium ${
                          zoneIndex === 0 ? 'text-blue-600' :
                          zoneIndex === zones.length - 1 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {zoneName}
                        </td>
                        <td className="py-1 px-2 text-right">{currentBeta.toFixed(3)}</td>
                        <td className="py-1 px-2 text-right">{currentRate.toFixed(2)}%</td>
                        <td className={`py-1 px-2 text-right ${betaAdjustment !== 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                          {betaAdjustment !== 0 ? `${betaAdjustment >= 0 ? '+' : ''}${betaAdjustment.toFixed(4)}` : '-'}
                        </td>
                        <td className={`py-1 px-2 text-right ${rateAdjustment !== 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                          {rateAdjustment !== 0 ? `${rateAdjustment >= 0 ? '+' : ''}${rateAdjustment.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-1 px-2 text-right font-medium bg-blue-50">
                          {adjustedRate.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  });
                })()}
                </tbody>
              </table>
            </div>
            
            <div className="mt-3 flex items-start space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <span className="text-green-600">*</span>
                <span>Current BoE Rate</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-red-600">**</span>
                <span>Rate Floor</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-50 border border-yellow-200"></div>
                <span>Zone Transitions</span>
              </div>
            </div>
              
              <div className="mt-4 flex items-start space-x-3 text-sm">
                <InformationCircleIcon className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-gray-600">
                  <p className="mb-1">
                    <strong>Interpretation:</strong> Positive gaps indicate the model under-predicts (rates too low), 
                    negative gaps indicate over-prediction (rates too high).
                  </p>
                  <p>
                    Adjustments will be applied proportionally across zones to minimize these gaps while maintaining calibration coherence.
                  </p>
                </div>
              </div>
              
              {/* Summary */}
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Tiers requiring adjustment:</span>
                  <span className="font-medium">
                    {gapAnalysis.filter(g => g.adjustmentNeeded).length} of {gapAnalysis.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-700">Maximum gap:</span>
                  <span className="font-medium">
                    {Math.max(...gapAnalysis.map(g => Math.abs(g.gap))).toFixed(1)} bp
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-red-800 font-medium">Configuration Issues:</h4>
                  <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}