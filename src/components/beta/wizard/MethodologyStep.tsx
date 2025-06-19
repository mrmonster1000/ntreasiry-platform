'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClockIcon,
  ChartBarSquareIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import type { BetaConfig, CurrentProduct, HistoricalMethodology } from '../BetaCalibrationWizard';

interface MethodologyStepProps {
  config: BetaConfig;
  updateConfig: (updates: Partial<BetaConfig>) => void;
  currentProduct?: CurrentProduct;
  disabled?: boolean;
  onValidationChange?: (errors: string[]) => void;
}

export function MethodologyStep({
  config,
  updateConfig,
  currentProduct,
  disabled = false,
  onValidationChange
}: MethodologyStepProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Validate configuration
  useEffect(() => {
    const errors: string[] = [];
    
    if (config.calibrationMethod === 'historical') {
      if (!config.historicalConfig?.methodology) {
        errors.push('Please select a calculation methodology');
      }
      
      if (!config.historicalConfig?.timePeriod?.preset && config.historicalConfig?.timePeriod?.preset !== 'custom') {
        errors.push('Please select a time period');
      }
      
      if (config.historicalConfig?.timePeriod?.preset === 'custom') {
        if (!config.historicalConfig?.timePeriod?.startDate) {
          errors.push('Please provide a start date for custom time period');
        }
        if (!config.historicalConfig?.timePeriod?.endDate) {
          errors.push('Please provide an end date for custom time period');
        }
        if (config.historicalConfig?.timePeriod?.startDate && 
            config.historicalConfig?.timePeriod?.endDate &&
            new Date(config.historicalConfig.timePeriod.startDate) >= new Date(config.historicalConfig.timePeriod.endDate)) {
          errors.push('End date must be after start date');
        }
      }
    }
    
    setValidationErrors(errors);
    onValidationChange?.(errors);
  }, [config]);

  // Handle methodology selection
  const selectMethodology = useCallback((methodology: HistoricalMethodology) => {
    updateConfig({
      historicalConfig: {
        ...config.historicalConfig!,
        methodology
      }
    });
  }, [config.historicalConfig, updateConfig]);

  // Handle time period selection
  const selectTimePeriod = useCallback((preset: 'last_2_years' | 'last_year' | 'custom') => {
    const timePeriod = preset === 'custom' 
      ? { preset, startDate: customStartDate, endDate: customEndDate }
      : { preset };
      
    updateConfig({
      historicalConfig: {
        ...config.historicalConfig!,
        timePeriod
      }
    });
  }, [config.historicalConfig, updateConfig, customStartDate, customEndDate]);

  // Handle custom date changes
  const updateCustomDates = useCallback((startDate: string, endDate: string) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    
    if (config.historicalConfig?.timePeriod?.preset === 'custom') {
      updateConfig({
        historicalConfig: {
          ...config.historicalConfig!,
          timePeriod: {
            preset: 'custom',
            startDate,
            endDate
          }
        }
      });
    }
  }, [config.historicalConfig, updateConfig]);

  // Handle outlier exclusion toggle
  const toggleExcludeOutliers = useCallback((excludeOutliers: boolean) => {
    updateConfig({
      historicalConfig: {
        ...config.historicalConfig!,
        excludeOutliers
      }
    });
  }, [config.historicalConfig, updateConfig]);

  // Skip this step for non-historical methods
  if (config.calibrationMethod !== 'historical') {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-gray-800 font-medium flex items-center">
            <ClockIcon className="w-5 h-5 mr-2" />
            Methodology & Time Period
          </h4>
          <p className="text-gray-600 text-sm mt-1">
            This step is only applicable to historical calibration methods.
          </p>
          <div className="mt-3 text-xs text-gray-500">
            Selected method: <strong>{config.calibrationMethod}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Methodology Selection */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ChartBarSquareIcon className="w-5 h-5 mr-2" />
          Historical Calculation Methodology
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => selectMethodology('simple_average')}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              config.historicalConfig?.methodology === 'simple_average'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="font-medium text-blue-800">Simple Average</div>
            <div className="text-xs text-blue-600 mt-1">
              Average all historical beta coefficients equally
            </div>
            <div className="mt-2 text-xs text-blue-700">
              ✓ Stable, robust approach
            </div>
          </button>
          
          <button
            onClick={() => selectMethodology('directional_weighted')}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              config.historicalConfig?.methodology === 'directional_weighted'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="font-medium text-green-800">Directional Weighted</div>
            <div className="text-xs text-green-600 mt-1">
              Weight recent rate movements more heavily
            </div>
            <div className="mt-2 text-xs text-green-700">
              ✓ Responsive to market trends
            </div>
          </button>
          
          <button
            onClick={() => selectMethodology('rolling_average')}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              config.historicalConfig?.methodology === 'rolling_average'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="font-medium text-purple-800">Rolling Average</div>
            <div className="text-xs text-purple-600 mt-1">
              Smooth out short-term volatility with rolling windows
            </div>
            <div className="mt-2 text-xs text-purple-700">
              ✓ Reduces noise, stable trends
            </div>
          </button>
          
          <button
            onClick={() => selectMethodology('regression_fit')}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              config.historicalConfig?.methodology === 'regression_fit'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="font-medium text-orange-800">Regression Fit</div>
            <div className="text-xs text-orange-600 mt-1">
              Statistical regression to find best-fit relationships
            </div>
            <div className="mt-2 text-xs text-orange-700">
              ✓ Statistically optimal, captures correlations
            </div>
          </button>
        </div>
      </div>

      {/* Time Period Selection */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CalendarDaysIcon className="w-5 h-5 mr-2" />
          Historical Time Period
        </h4>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="timePeriod"
              checked={config.historicalConfig?.timePeriod?.preset === 'last_2_years'}
              onChange={() => selectTimePeriod('last_2_years')}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Last 2 Years</div>
              <div className="text-xs text-gray-600">Standard period for stable beta calibration</div>
            </div>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="timePeriod"
              checked={config.historicalConfig?.timePeriod?.preset === 'last_year'}
              onChange={() => selectTimePeriod('last_year')}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Last 12 Months</div>
              <div className="text-xs text-gray-600">More responsive to recent market conditions</div>
            </div>
          </label>
          
          <label className="flex items-start space-x-3">
            <input
              type="radio"
              name="timePeriod"
              checked={config.historicalConfig?.timePeriod?.preset === 'custom'}
              onChange={() => selectTimePeriod('custom')}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Custom Date Range</div>
              <div className="text-xs text-gray-600 mb-3">Specify exact historical period</div>
              
              {config.historicalConfig?.timePeriod?.preset === 'custom' && (
                <div className="grid grid-cols-2 gap-3 ml-0">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => updateCustomDates(e.target.value, customEndDate)}
                      disabled={disabled}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => updateCustomDates(customStartDate, e.target.value)}
                      disabled={disabled}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Additional Options */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
          Additional Options
        </h4>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={config.historicalConfig?.excludeOutliers ?? false}
              onChange={(e) => toggleExcludeOutliers(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Exclude Statistical Outliers</div>
              <div className="text-xs text-gray-600">
                Remove data points that are more than 2 standard deviations from the mean
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Methodology Information */}
      {config.historicalConfig?.methodology && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
            <InformationCircleIcon className="w-4 h-4 mr-2" />
            Selected Methodology Details
          </h5>
          
          {config.historicalConfig.methodology === 'simple_average' && (
            <div className="text-xs text-blue-800">
              <strong>Simple Average:</strong> All historical beta coefficients will be weighted equally. 
              This provides a stable, robust estimate that's less sensitive to recent market volatility.
              Best for long-term strategic planning.
            </div>
          )}
          
          {config.historicalConfig.methodology === 'directional_weighted' && (
            <div className="text-xs text-blue-800">
              <strong>Directional Weighted:</strong> Recent rate movements will be weighted more heavily 
              than older data. This approach is more responsive to changing market conditions and competitive dynamics.
              Best for dynamic rate environments.
            </div>
          )}
          
          {config.historicalConfig.methodology === 'rolling_average' && (
            <div className="text-xs text-blue-800">
              <strong>Rolling Average:</strong> Beta coefficients will be calculated using rolling time windows 
              to smooth out short-term volatility. This reduces noise while maintaining responsiveness to trends.
              Best for balanced stability and responsiveness.
            </div>
          )}
          
          {config.historicalConfig.methodology === 'regression_fit' && (
            <div className="text-xs text-blue-800">
              <strong>Regression Fit:</strong> Statistical regression analysis will find the optimal relationship 
              between BoE rates and product rates. This provides the most statistically rigorous calibration.
              Best for data-driven, statistically optimal results.
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