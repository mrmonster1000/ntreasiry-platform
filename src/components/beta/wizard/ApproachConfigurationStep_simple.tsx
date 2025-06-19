'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChartBarIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { BetaZoneChart } from './BetaZoneChart';
import type { BetaConfig, CurrentProduct, HistoricalApproach, DynamicZoneDetectionConfig, ConvexityZone } from '../BetaCalibrationWizard';
import { createDefaultZones, migrateLegacyZones } from '../BetaCalibrationWizard';
import { api } from '@/lib/api';

interface ApproachConfigurationStepProps {
  config: BetaConfig;
  updateConfig: (updates: Partial<BetaConfig>) => void;
  currentProduct?: CurrentProduct;
  disabled?: boolean;
  onValidationChange?: (errors: string[]) => void;
}

export function ApproachConfigurationStep({
  config,
  updateConfig,
  currentProduct,
  disabled = false,
  onValidationChange
}: ApproachConfigurationStepProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [chartDateRange, setChartDateRange] = useState({
    startDate: '2020-03-01',
    endDate: '2023-12-31'
  });
  const [tierSpecificZones, setTierSpecificZones] = useState(false);

  // Initialize historical config if not exists
  useEffect(() => {
    if (config.calibrationMethod === 'historical' && !config.historicalConfig) {
      updateConfig({
        historicalConfig: {
          approach: 'zone_based',
          methodology: 'simple_average',
          timePeriod: { preset: 'last_2_years' },
          excludeOutliers: false,
          convexityZones: {
            zoneStrategy: 'zones',
            zones: createDefaultZones(3),
            // Legacy support
            lowToMidThreshold: 3.0,
            midToHighThreshold: 5.0,
            autoDetect: false
          }
        }
      });
    }
    
    // Migrate legacy configurations to new zone structure
    if (config.calibrationMethod === 'historical' && config.historicalConfig?.convexityZones) {
      const zones = config.historicalConfig.convexityZones;
      if (!zones.zoneStrategy && !zones.zones && (zones.lowToMidThreshold || zones.midToHighThreshold)) {
        // Migrate legacy configuration
        const migratedZones = migrateLegacyZones(zones);
        updateConfig({
          historicalConfig: {
            ...config.historicalConfig,
            convexityZones: {
              ...zones,
              zoneStrategy: 'zones',
              zones: migratedZones
            }
          }
        });
      }
    }
  }, [config.calibrationMethod, config.historicalConfig, updateConfig]);

  // Validate configuration
  useEffect(() => {
    const errors: string[] = [];
    
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
              errors.push(`Zone "${zones[i].name}" threshold (${currentThreshold}%) must be less than "${zones[i + 1].name}" threshold (${nextThreshold}%)`);
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

    setValidationErrors(errors);
    onValidationChange?.(errors);
  }, [config, onValidationChange]);

  // Handle approach selection
  const selectApproach = useCallback((approach: HistoricalApproach) => {
    updateConfig({
      historicalConfig: {
        ...config.historicalConfig!,
        approach
      }
    });
  }, [config.historicalConfig, updateConfig]);

  // Manual configuration
  if (config.calibrationMethod === 'manual') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-blue-800 font-medium flex items-center">
            <Cog6ToothIcon className="w-5 h-5 mr-2" />
            Manual Configuration
          </h4>
          <p className="text-blue-700 text-sm mt-1">
            Set convexity zones visually, then configure beta multipliers for each zone.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            Manual zone configuration will be implemented here.
          </p>
        </div>
      </div>
    );
  }

  // Inheritance configuration
  if (config.calibrationMethod === 'inherit') {
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-purple-800 font-medium">Inheritance Configuration</h4>
          <p className="text-purple-700 text-sm mt-1">
            Configure source product and tracking settings.
          </p>
        </div>
      </div>
    );
  }

  // Historical configuration (main focus)
  if (config.calibrationMethod !== 'historical') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Zone Strategy Selection */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Convexity Strategy</h4>
        <p className="text-sm text-gray-600 mb-4">
          Choose how to model rate sensitivity across different market conditions.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => updateConfig({
              historicalConfig: {
                ...config.historicalConfig!,
                convexityZones: { zoneStrategy: 'none' }
              }
            })}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              config.historicalConfig?.convexityZones?.zoneStrategy === 'none'
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-800">No Zones</div>
            <div className="text-xs text-gray-600 mt-1">
              Single beta across all rate environments
            </div>
            <div className="mt-2 text-xs text-gray-700">
              ✓ Simple, stable calibration
            </div>
          </button>
          
          <button
            onClick={() => {
              const existingZones = config.historicalConfig?.convexityZones?.zones;
              const defaultZones = existingZones || createDefaultZones(3);
              updateConfig({
                historicalConfig: {
                  ...config.historicalConfig!,
                  convexityZones: {
                    ...config.historicalConfig?.convexityZones,
                    zoneStrategy: 'zones',
                    zones: defaultZones
                  }
                }
              });
            }}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              config.historicalConfig?.convexityZones?.zoneStrategy === 'zones' || 
              (!config.historicalConfig?.convexityZones?.zoneStrategy && config.historicalConfig?.approach === 'zone_based')
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="font-medium text-green-800">Convexity Zones</div>
            <div className="text-xs text-green-600 mt-1">
              Different betas for rate regimes
            </div>
            <div className="mt-2 text-xs text-green-700">
              ✓ Captures non-linear sensitivities
            </div>
          </button>
          
          <button
            onClick={() => updateConfig({
              historicalConfig: {
                ...config.historicalConfig!,
                convexityZones: { zoneStrategy: 'through_cycle' },
                approach: 'through_cycle'
              }
            })}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              config.historicalConfig?.convexityZones?.zoneStrategy === 'through_cycle' ||
              config.historicalConfig?.approach === 'through_cycle'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="font-medium text-purple-800">Through-the-Cycle</div>
            <div className="text-xs text-purple-600 mt-1">
              Rate-specific beta mapping
            </div>
            <div className="mt-2 text-xs text-purple-700">
              ✓ Granular calibration
            </div>
          </button>
        </div>
      </div>

      {/* Zone Count Selector - only show if zones strategy is selected */}
      {(config.historicalConfig?.convexityZones?.zoneStrategy === 'zones' ||
        (!config.historicalConfig?.convexityZones?.zoneStrategy && config.historicalConfig?.approach === 'zone_based')) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-green-900 mb-3">Zone Configuration</h5>
          
          {/* Zone Count Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-green-700 mb-2">
              Number of Convexity Zones
            </label>
            <div className="flex space-x-3">
              {[2, 3, 4, 5].map(count => {
                const currentZoneCount = config.historicalConfig?.convexityZones?.zones?.length || 3;
                return (
                  <button
                    key={count}
                    onClick={() => {
                      const newZones = createDefaultZones(count);
                      updateConfig({
                        historicalConfig: {
                          ...config.historicalConfig!,
                          convexityZones: {
                            ...config.historicalConfig?.convexityZones,
                            zones: newZones
                          }
                        }
                      });
                    }}
                    disabled={disabled}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentZoneCount === count
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                    }`}
                  >
                    {count} Zones
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-green-600 mt-2">
              {config.historicalConfig?.convexityZones?.zones?.length === 2 && "Simple low/high rate environments"}
              {config.historicalConfig?.convexityZones?.zones?.length === 3 && "Classic low/medium/high zones (recommended)"}
              {config.historicalConfig?.convexityZones?.zones?.length === 4 && "Granular regime modeling"}
              {config.historicalConfig?.convexityZones?.zones?.length === 5 && "Very detailed rate cycle analysis"}
            </p>
          </div>
          
          {/* Zone Names and Thresholds */}
          {config.historicalConfig?.convexityZones?.zones && (
            <div className="space-y-3">
              <h6 className="text-sm font-medium text-green-800">Zone Names & Thresholds</h6>
              {config.historicalConfig.convexityZones.zones.map((zone, index) => (
                <div key={zone.id} className="flex items-center space-x-3 bg-white rounded border border-green-200 p-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={zone.name}
                      onChange={(e) => {
                        const updatedZones = [...config.historicalConfig!.convexityZones!.zones!];
                        updatedZones[index] = { ...zone, name: e.target.value };
                        updateConfig({
                          historicalConfig: {
                            ...config.historicalConfig!,
                            convexityZones: {
                              ...config.historicalConfig!.convexityZones!,
                              zones: updatedZones
                            }
                          }
                        });
                      }}
                      disabled={disabled}
                      className="w-full px-2 py-1 text-sm border border-green-300 rounded focus:ring-green-500 focus:border-green-500"
                      placeholder={`Zone ${index + 1} name`}
                    />
                  </div>
                  {zone.threshold !== undefined && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-green-600">Max BoE Rate:</span>
                      <input
                        type="number"
                        value={zone.threshold}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          const updatedZones = [...config.historicalConfig!.convexityZones!.zones!];
                          updatedZones[index] = { ...zone, threshold: value };
                          updateConfig({
                            historicalConfig: {
                              ...config.historicalConfig!,
                              convexityZones: {
                                ...config.historicalConfig!.convexityZones!,
                                zones: updatedZones
                              }
                            }
                          });
                        }}
                        disabled={disabled}
                        min="0"
                        max="10"
                        step="0.25"
                        className="w-20 px-2 py-1 text-sm border border-green-300 rounded focus:ring-green-500 focus:border-green-500"
                      />
                      <span className="text-xs text-green-600">%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
}