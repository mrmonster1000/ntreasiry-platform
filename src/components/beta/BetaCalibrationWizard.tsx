'use client';

import React, { useState, useCallback } from 'react';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

// Import step components (we'll create these)
import { GlobalConstraintsStep } from './wizard/GlobalConstraintsStep';
import { CalibrationMethodStep } from './wizard/CalibrationMethodStep';
import { ApproachConfigurationStep } from './wizard/ApproachConfigurationStep';
import { MethodologyStep } from './wizard/MethodologyStep';
import { TrueUpStep } from './wizard/TrueUpStep';
import { ResultsStep } from './wizard/ResultsStep';

// Re-export interfaces from SafeBetaLadderBuilder
export interface TierConfig {
  lowRateBetaMultiplier: number;
  highRateBetaMultiplier: number;
  lowToMidConvexityZone: number;
  midToHighConvexityZone: number;
}

export type CalibrationMethod = 'manual' | 'historical' | 'inherit';
export type HistoricalApproach = 'zone_based' | 'through_cycle';
export type HistoricalMethodology = 
  | 'simple_average'
  | 'directional_weighted' 
  | 'rolling_average'
  | 'regression_fit';

export interface DynamicZoneDetectionConfig {
  consecutiveMovements: number;      // Number of consecutive movements to analyze (default: 3)
  betaExceedanceThreshold: number;   // Beta threshold that must be exceeded (e.g., 0.33 for 33%)
}

export interface ConvexityZone {
  id: string;
  name: string;
  threshold?: number; // undefined for the last zone
  beta?: number; // calculated during calibration
  color: string;
}

export interface ConvexityZoneConfig {
  // New dynamic zone structure
  zones?: ConvexityZone[];
  zoneStrategy?: 'none' | 'zones' | 'through_cycle';
  
  // Legacy support - will be migrated to zones array
  lowToMidThreshold?: string | number;
  midToHighThreshold?: string | number;
  autoDetect?: boolean;
  confidence?: number;
}

export interface TrueUpConfig {
  enabled: boolean;
  targetRates: Record<string, number>; // tier_name -> current rate
  allowedAdjustmentRange: number; // max % adjustment allowed per zone
  proportionalAdjustment: boolean; // true = proportional, false = additive
  gapTolerance: number; // acceptable gap in basis points before adjustment
  // True-up strategy controls
  applySpotTrueUp: boolean;
  applyFloorTrueUp: boolean;
  adjustmentStrategy: 'all_zones' | 'current_zone' | 'low_zone' | 'high_zone' | 'all_except_current';
}

export interface HistoricalConfig {
  approach: HistoricalApproach;
  methodology: HistoricalMethodology;
  timePeriod: {
    startDate?: string;
    endDate?: string;
    preset?: 'last_2_years' | 'last_year' | 'custom';
  };
  excludeOutliers: boolean;
  convexityZones?: ConvexityZoneConfig;
  throughCycle?: {
    rateStepSize: number;
    smoothing: boolean;
  };
  trueUp?: TrueUpConfig;
}

export interface InheritanceConfig {
  sourceProductId: string;
  sourceProductName: string;
  modificationLevel: 'exact_copy' | 'copy_and_adjust' | 'structure_only';
  competitorTracking?: {
    enabled: boolean;
    spreadBasisPoints: number;
    updateFrequency: 'realtime' | 'daily' | 'manual';
  };
}

export interface ManualConfig {
  convexityZones: ConvexityZoneConfig;
  betaMultipliers?: {
    lowZone: number;
    midZone: number;
    highZone: number;
  };
}

export interface BetaConfig {
  calibrationMethod: CalibrationMethod;
  historicalConfig?: HistoricalConfig;
  inheritanceConfig?: InheritanceConfig;
  manualConfig?: ManualConfig;
  
  // Global Constraints
  maxSpreadOverBase: number;
  maxSpreadUnderBase: number;
  rateFloor: number;
  rateCeiling: number;
  
  // Constraint activation flags
  rateFloorActive: boolean;
  rateCeilingActive: boolean;
  maxSpreadOverBaseActive: boolean;
  maxSpreadUnderBaseActive: boolean;
  
  // Tier-Specific Configurations
  tierConfigs: Record<string, TierConfig>;
}

export interface ProductTier {
  tier_name: string;
  rate: number;
  balance_range: string;
}

export interface CurrentProduct {
  bank_code: string;
  product_name: string;
  tiers: ProductTier[];
}

interface BetaCalibrationWizardProps {
  initialConfig?: Partial<BetaConfig>;
  onConfigChange?: (config: BetaConfig) => void;
  onClose?: () => void;
  disabled?: boolean;
  currentProduct?: CurrentProduct;
}

const WIZARD_STEPS = [
  {
    id: 'constraints',
    title: 'Global Constraints',
    description: 'Set rate floors, ceilings, and spread limits',
    component: GlobalConstraintsStep
  },
  {
    id: 'method',
    title: 'Calibration Method',
    description: 'Choose manual, historical, or inheritance approach',
    component: CalibrationMethodStep
  },
  {
    id: 'configuration',
    title: 'Approach Configuration',
    description: 'Configure zones or through-cycle settings',
    component: ApproachConfigurationStep
  },
  {
    id: 'methodology',
    title: 'Calculation Method',
    description: 'Select methodology and time period',
    component: MethodologyStep
  },
  {
    id: 'trueup',
    title: 'True-Up Calibration',
    description: 'Adjust historical betas to match current rates',
    component: TrueUpStep
  },
  {
    id: 'results',
    title: 'Results & Apply',
    description: 'Review calculations and apply to tiers',
    component: ResultsStep
  }
];

// Zone management utilities
export const generateZoneColors = (count: number): string[] => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  return colors.slice(0, count);
};

export const createDefaultZones = (count: number): ConvexityZone[] => {
  const templates = {
    2: ['Low Rate Environment', 'High Rate Environment'],
    3: ['Low Rate Regime', 'Medium Rate Regime', 'High Rate Regime'],
    4: ['Emergency Rates', 'Rising Rates', 'Normal Rates', 'Restrictive Rates'],
    5: ['Crisis', 'Recovery', 'Growth', 'Peak', 'Restrictive']
  };
  
  const names = templates[count as keyof typeof templates] || templates[3];
  const colors = generateZoneColors(count);
  const defaultThresholds = count === 2 ? [3.0] : 
                           count === 3 ? [2.0, 4.5] :
                           count === 4 ? [1.5, 3.0, 5.0] :
                           [1.0, 2.5, 4.0, 5.5];
  
  return names.map((name, index) => ({
    id: `zone-${index + 1}`,
    name,
    threshold: index < names.length - 1 ? defaultThresholds[index] : undefined,
    color: colors[index]
  }));
};

export const migrateLegacyZones = (config: ConvexityZoneConfig): ConvexityZone[] => {
  if (config.zones) return config.zones;
  
  // Migrate legacy lowToMidThreshold/midToHighThreshold to new format
  const lowThreshold = typeof config.lowToMidThreshold === 'number' ? config.lowToMidThreshold : 2.0;
  const highThreshold = typeof config.midToHighThreshold === 'number' ? config.midToHighThreshold : 4.5;
  
  return [
    { id: 'zone-1', name: 'Low Rate Regime', threshold: lowThreshold, color: '#3b82f6' },
    { id: 'zone-2', name: 'Medium Rate Regime', threshold: highThreshold, color: '#10b981' },
    { id: 'zone-3', name: 'High Rate Regime', threshold: undefined, color: '#ef4444' }
  ];
};


const DEFAULT_CONFIG: BetaConfig = {
  calibrationMethod: 'manual',
  maxSpreadOverBase: 150, // 1.5%
  maxSpreadUnderBase: 100, // 1.0%
  rateFloor: 0.1,
  rateCeiling: 8.0,
  rateFloorActive: true,
  rateCeilingActive: false,
  maxSpreadOverBaseActive: false,
  maxSpreadUnderBaseActive: false,
  tierConfigs: {}
};

export function BetaCalibrationWizard({
  initialConfig = {},
  onConfigChange,
  onClose,
  disabled = false,
  currentProduct
}: BetaCalibrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<BetaConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });
  const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Update config and notify parent
  const updateConfig = useCallback((updates: Partial<BetaConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  }, [config, onConfigChange]);

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const errors: string[] = [];
    
    switch (currentStep) {
      case 0: // Global Constraints
        if (config.rateFloorActive && config.rateCeilingActive && config.rateFloor >= config.rateCeiling) {
          errors.push('Rate floor must be less than rate ceiling');
        }
        if (config.maxSpreadOverBaseActive && config.maxSpreadOverBase < 0) {
          errors.push('Max spread over base cannot be negative');
        }
        if (config.maxSpreadUnderBaseActive && config.maxSpreadUnderBase < 0) {
          errors.push('Max spread under base cannot be negative');
        }
        break;
        
      case 1: // Calibration Method
        if (!config.calibrationMethod) {
          errors.push('Please select a calibration method');
        }
        break;
        
      case 2: // Configuration
        if (config.calibrationMethod === 'historical') {
          const zoneStrategy = config.historicalConfig?.convexityZones?.zoneStrategy;
          
          if (!zoneStrategy && !config.historicalConfig?.approach) {
            errors.push('Please select a convexity strategy');
          }
          
          // Validate zone configuration
          if (zoneStrategy === 'zones' || (!zoneStrategy && config.historicalConfig?.approach === 'zone_based')) {
            const zones = config.historicalConfig?.convexityZones?.zones;
            if (zones && zones.length > 1) {
              // Validate thresholds are in ascending order
              for (let i = 0; i < zones.length - 1; i++) {
                const currentThreshold = zones[i].threshold;
                const nextThreshold = zones[i + 1].threshold;
                if (currentThreshold !== undefined && nextThreshold !== undefined && currentThreshold >= nextThreshold) {
                  errors.push(`Zone thresholds must be in ascending order`);
                  break;
                }
              }
            }
            
            // Legacy validation for backward compatibility
            if (config.historicalConfig?.convexityZones?.autoDetect === false) {
              const convexityZones = config.historicalConfig.convexityZones;
              if (convexityZones.lowToMidThreshold && convexityZones.midToHighThreshold &&
                  Number(convexityZones.lowToMidThreshold) >= Number(convexityZones.midToHighThreshold)) {
                errors.push('Low→Mid threshold must be less than Mid→High threshold');
              }
            }
          }
        }
        if (config.calibrationMethod === 'inherit' && !config.inheritanceConfig?.sourceProductId) {
          errors.push('Please select source product for inheritance');
        }
        break;
        
      case 3: // Methodology
        if (config.calibrationMethod === 'historical' && !config.historicalConfig?.methodology) {
          errors.push('Please select calculation methodology');
        }
        break;
        
      case 4: // True-Up
        if (config.calibrationMethod === 'historical' && config.historicalConfig?.trueUp?.enabled) {
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
        }
        break;
    }
    
    setStepErrors(prev => ({ ...prev, [currentStep]: errors }));
    
    if (errors.length === 0) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      return true;
    }
    return false;
  }, [currentStep, config]);

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    if (validateCurrentStep() && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateCurrentStep]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Navigate to specific step
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < WIZARD_STEPS.length) {
      setCurrentStep(stepIndex);
    }
  }, []);

  const currentStepData = WIZARD_STEPS[currentStep];
  const CurrentStepComponent = currentStepData.component;
  const currentErrors = stepErrors[currentStep] || [];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BeakerIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Beta Calibration Wizard</h2>
              <p className="text-sm text-gray-600">Step-by-step beta parameter configuration</p>
            </div>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <span className="sr-only">Close wizard</span>
              ✕
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-4">
          {WIZARD_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => goToStep(index)}
                disabled={disabled}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600 text-white'
                    : completedSteps.has(index)
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : stepErrors[index]?.length > 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === currentStep
                    ? 'bg-white text-blue-600'
                    : completedSteps.has(index)
                    ? 'bg-green-600 text-white'
                    : stepErrors[index]?.length > 0
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {completedSteps.has(index) ? (
                    <CheckCircleIcon className="w-4 h-4" />
                  ) : stepErrors[index]?.length > 0 ? (
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="hidden sm:block">{step.title}</span>
              </button>
              
              {index < WIZARD_STEPS.length - 1 && (
                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="px-6 py-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {currentStepData.description}
          </p>
          
          {/* Step Errors */}
          {currentErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-red-800 font-medium">Please fix these issues:</h4>
                  <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                    {currentErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Step Component */}
        <CurrentStepComponent
          config={config}
          updateConfig={updateConfig}
          currentProduct={currentProduct}
          disabled={disabled}
          onValidationChange={(errors: string[]) => {
            setStepErrors(prev => ({ ...prev, [currentStep]: errors }));
          }}
        />
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={goToPreviousStep}
          disabled={isFirstStep || disabled}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="text-sm text-gray-500">
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </div>

        {!isLastStep ? (
          <button
            onClick={goToNextStep}
            disabled={currentErrors.length > 0 || disabled}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onClose}
            disabled={disabled}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>Finish</span>
          </button>
        )}
      </div>
    </div>
  );
}