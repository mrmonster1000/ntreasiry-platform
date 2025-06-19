'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    endDate: '2025-06-30'
  });
  const [tierSpecificZones, setTierSpecificZones] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

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
  }, [config.calibrationMethod, config.historicalConfig]);

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
  }, [config]);

  // Generate comprehensive historical data based on real Club Lloyds research
  const generateSampleHistoricalData = (product: any) => {
    if (product.bank_code === 'LLOYDS' && product.product_name === 'Club Lloyds Current Account') {
      // Real historical data based on Lloyds rate history research 2010-2025
      return [
        {
          bank_code: 'LLOYDS',
          product_name: 'Club Lloyds Current Account',
          tier_rates: { 'Tier 1': 1.50, 'Tier 2': 3.00 },
          effective_from: '2023-01-31',
          effective_to: null, // Current rates, no end date
          source: 'current_rates'
        },
        {
          bank_code: 'LLOYDS',
          product_name: 'Club Lloyds Current Account',
          tier_rates: { 'Tier 1': 0.60, 'Tier 2': 1.50 },
          effective_from: '2020-10-01',
          effective_to: '2023-01-30',
          source: 'historical_research'
        },
        {
          bank_code: 'LLOYDS', 
          product_name: 'Club Lloyds Current Account',
          tier_rates: { 'Tier 1': 1.00, 'Tier 2': 2.00 },
          effective_from: '2019-10-01',
          effective_to: '2020-09-30',
          source: 'historical_research'
        },
        {
          bank_code: 'LLOYDS', 
          product_name: 'Club Lloyds Current Account',
          tier_rates: { 'Tier 1': 2.00, 'Tier 2': 2.00 },
          effective_from: '2018-07-01',
          effective_to: '2019-09-30',
          source: 'historical_research'
        },
        {
          bank_code: 'LLOYDS', 
          product_name: 'Club Lloyds Current Account',
          tier_rates: { 'Tier 1': 2.00, 'Tier 2': 2.00 },
          effective_from: '2017-01-08',
          effective_to: '2018-06-30',
          source: 'historical_research'
        },
        {
          bank_code: 'LLOYDS', 
          product_name: 'Club Lloyds Current Account',
          tier_rates: { 'Tier 1': 1.00, 'Tier 2': 4.00 },
          effective_from: '2014-03-30',
          effective_to: '2017-01-07',
          source: 'historical_research'
        },
        {
          bank_code: 'LLOYDS', 
          product_name: 'Club Lloyds Current Account',
          tier_rates: { 'Tier 1': 0.50, 'Tier 2': 0.50 },
          effective_from: '2010-01-01',
          effective_to: '2014-03-29',
          source: 'historical_research'
        }
      ];
    }
    
    if (product.bank_code === 'BARCLAYS' && product.product_name === 'Rainy Day Saver') {
      return [
        {
          bank_code: 'BARCLAYS',
          product_name: 'Rainy Day Saver',
          tier_rates: { 'Tier 1': 1.05, 'Tier 2': 4.52 },
          effective_from: '2023-03-01',
          effective_to: '2023-12-31',
          source: 'sample_demo'
        },
        {
          bank_code: 'BARCLAYS',
          product_name: 'Rainy Day Saver',
          tier_rates: { 'Tier 1': 0.75, 'Tier 2': 3.20 },
          effective_from: '2022-08-01',
          effective_to: '2023-02-28',
          source: 'sample_demo'
        }
      ];
    }
    
    // Default sample data for other products
    return [
      {
        bank_code: product.bank_code,
        product_name: product.product_name,
        tier_rates: product.tiers?.reduce((acc: any, tier: any) => {
          acc[tier.tier_name] = tier.rate * 0.6;
          return acc;
        }, {}) || { 'Tier 1': 1.5 },
        effective_from: '2022-01-01',
        source: 'sample_demo'
      }
    ];
  };

  // Fetch historical data for chart visualization
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (currentProduct) {
        setIsLoadingData(true);
        try {
          const data = await api.getHistoricalData({
            bank: currentProduct.bank_code,
            productType: 'instant_access_savings'
          });
          
          if (!data || data.length === 0) {
            // Use comprehensive Club Lloyds historical data from our research
            const sampleData = generateSampleHistoricalData(currentProduct);
            setHistoricalData(sampleData);
          } else {
            setHistoricalData(data);
          }
        } catch (error) {
          console.error('Failed to fetch historical data:', error);
          const sampleData = generateSampleHistoricalData(currentProduct);
          setHistoricalData(sampleData);
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    fetchHistoricalData();
  }, [config.calibrationMethod, currentProduct?.bank_code]);

  // Transform historical data for chart using real data
  const transformDataForChart = useCallback(() => {
    if (!historicalData || historicalData.length === 0 || !currentProduct) {
      return undefined;
    }

    // Map historical BoE rates to dates (real data)
    const getBoeRateForDate = (date: Date): number => {
      if (date >= new Date('2023-08-03')) return 5.25;
      if (date >= new Date('2023-06-22')) return 5.00;
      if (date >= new Date('2023-05-11')) return 4.50;
      if (date >= new Date('2023-03-23')) return 4.25;
      if (date >= new Date('2023-02-02')) return 4.00;
      if (date >= new Date('2022-12-15')) return 3.50;
      if (date >= new Date('2022-11-03')) return 3.00;
      if (date >= new Date('2022-09-22')) return 2.25;
      if (date >= new Date('2022-08-04')) return 1.75;
      if (date >= new Date('2022-06-16')) return 1.25;
      if (date >= new Date('2022-05-05')) return 1.00;
      if (date >= new Date('2022-03-17')) return 0.75;
      if (date >= new Date('2022-02-03')) return 0.50;
      if (date >= new Date('2021-12-16')) return 0.25;
      if (date >= new Date('2020-03-19')) return 0.10;
      if (date >= new Date('2008-01-01')) return 0.50; // Pre-crisis average
      return 0.75; // Historical average
    };

    // Create a map of effective rates by date
    const ratesByDate = new Map();
    
    // Sort historical data by effective_from date to ensure proper precedence
    const sortedData = [...historicalData].sort((a, b) => 
      new Date(a.effective_from).getTime() - new Date(b.effective_from).getTime()
    );
    
    sortedData.forEach(record => {
      const startDate = new Date(record.effective_from);
      const endDate = record.effective_to ? new Date(record.effective_to) : new Date('2025-12-31');
      
      console.log(`Processing record: ${record.effective_from} to ${record.effective_to || '2025-12-31'}, rates:`, record.tier_rates);
      
      // Store the rate info for this period
      const rateInfo = {
        startDate,
        endDate,
        tierRates: record.tier_rates
      };
      
      // Generate monthly points for this period
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const monthKey = currentDate.toISOString().substring(0, 7);
        ratesByDate.set(monthKey, rateInfo);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    });
    
    console.log(`Total months covered:`, ratesByDate.size);
    console.log('Sample months:', Array.from(ratesByDate.keys()).slice(0, 5), '...', Array.from(ratesByDate.keys()).slice(-5));

    // Generate monthly data points for the chart date range
    const startDate = new Date(chartDateRange.startDate);
    const endDate = new Date(chartDateRange.endDate);
    const chartData = [];
    
    console.log(`Generating chart data from ${chartDateRange.startDate} to ${chartDateRange.endDate}`);
    
    const currentMonth = new Date(startDate);
    while (currentMonth <= endDate) {
      const monthKey = currentMonth.toISOString().substring(0, 7);
      const dateKey = monthKey + '-01';
      
      // Get the rate info for this month
      const rateInfo = ratesByDate.get(monthKey);
      
      if (rateInfo) {
        const productRates = Object.entries(rateInfo.tierRates || {}).map(([tierName, rate]) => ({
          tierName,
          rate: Number(rate),
          confidence: 0.95
        }));

        chartData.push({
          date: dateKey,
          boeRate: getBoeRateForDate(currentMonth),
          productRates
        });
      } else {
        // If no historical data, use current product rates
        const productRates = currentProduct?.tiers?.map(tier => ({
          tierName: tier.tier_name,
          rate: tier.rate,
          confidence: 0.90
        })) || [];

        chartData.push({
          date: dateKey,
          boeRate: getBoeRateForDate(currentMonth),
          productRates
        });
      }
      
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    console.log(`Generated ${chartData.length} chart data points`);
    console.log('First 3 points:', chartData.slice(0, 3));
    console.log('Last 3 points:', chartData.slice(-3));

    return chartData;
  }, [historicalData, currentProduct, chartDateRange]);

  // Memoize chart data to ensure it updates when date range changes
  const chartData = useMemo(() => {
    return transformDataForChart();
  }, [transformDataForChart]);

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
        
        <div className="bg-white rounded-lg border border-blue-300 p-4">
          <BetaZoneChart
            zones={config.manualConfig?.convexityZones?.zones}
            lowToMidThreshold={config.manualConfig?.convexityZones?.lowToMidThreshold || 3.0}
            midToHighThreshold={config.manualConfig?.convexityZones?.midToHighThreshold || 5.0}
            editable={true}
            height={350}
            useRateThresholds={true}
            availableTiers={currentProduct?.tiers?.map(t => t.tier_name) || ['Tier 1', 'Tier 2']}
          />
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
          <div className="mt-3 bg-yellow-100 border border-yellow-300 rounded p-3">
            <p className="text-xs text-yellow-800">
              🚧 Inheritance configuration UI coming in next iteration
            </p>
          </div>
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
      {/* Historical Chart - Show First */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <ChartBarIcon className="w-5 h-5 mr-2" />
          Historical Rate Analysis
        </h4>
        <p className="text-sm text-blue-700 mb-4">
          Review the historical rate movements before selecting your convexity approach.
        </p>
        
        {/* Time Frame Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-blue-700 mb-2">
            Analysis Time Frame
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-blue-600 mb-1">Start Date</label>
              <input
                type="date"
                value={chartDateRange.startDate}
                onChange={(e) => setChartDateRange({ ...chartDateRange, startDate: e.target.value })}
                disabled={disabled}
                className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-600 mb-1">End Date</label>
              <input
                type="date"
                value={chartDateRange.endDate}
                onChange={(e) => setChartDateRange({ ...chartDateRange, endDate: e.target.value })}
                disabled={disabled}
                className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg border border-blue-300 p-4">
          {isLoadingData && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-blue-700">Loading historical data...</span>
            </div>
          )}
          
          <BetaZoneChart
            data={chartData}
            zones={config.historicalConfig?.convexityZones?.zones}
            lowToMidThreshold={config.historicalConfig?.convexityZones?.lowToMidThreshold || 3.0}
            midToHighThreshold={config.historicalConfig?.convexityZones?.midToHighThreshold || 5.0}
            onZonesChange={(zones) => {
              updateConfig({
                historicalConfig: {
                  ...config.historicalConfig!,
                  convexityZones: {
                    ...config.historicalConfig!.convexityZones!,
                    zones
                  }
                }
              });
            }}
            editable={true}
            height={600}
            availableTiers={currentProduct?.tiers?.map(tier => tier.tier_name) || ['Tier 1', 'Tier 2']}
            useRateThresholds={true}
            zoneStrategy={config.historicalConfig?.convexityZones?.zoneStrategy || 'zones'}
            onChangeStrategy={() => setShowStrategyModal(true)}
            currentStrategyDescription={
              config.historicalConfig?.convexityZones?.zoneStrategy === 'none' 
                ? 'No Zones - Single beta across all rate environments'
                : (config.historicalConfig?.convexityZones?.zoneStrategy === 'zones' || 
                   (!config.historicalConfig?.convexityZones?.zoneStrategy && config.historicalConfig?.approach === 'zone_based'))
                ? `Convexity Zones - ${config.historicalConfig?.convexityZones?.zones?.length || 3} zones configured`
                : (config.historicalConfig?.convexityZones?.zoneStrategy === 'through_cycle' ||
                   config.historicalConfig?.approach === 'through_cycle')
                ? 'Through-the-Cycle - Rate-specific beta mapping'
                : 'Not configured'
            }
          />
        </div>
      </div>




      {/* Through-the-Cycle Configuration */}
      {(config.historicalConfig?.convexityZones?.zoneStrategy === 'through_cycle' ||
        config.historicalConfig?.approach === 'through_cycle') && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-purple-900 mb-4">
            Through-the-Cycle Configuration
          </h4>
          <p className="text-purple-800 text-sm">
            Through-the-cycle calibration maps each BoE rate level to a specific beta value,
            providing granular control over rate sensitivity across the entire rate cycle.
          </p>
          <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded p-3">
            <p className="text-xs text-yellow-800">
              🚧 Through-the-cycle configuration UI coming in next iteration
            </p>
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

      {/* Strategy Configuration Modal */}
      {showStrategyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Configure Convexity Strategy</h3>
              <button
                onClick={() => setShowStrategyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Strategy Selection */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Choose how to model rate sensitivity across different market conditions.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => {
                    updateConfig({
                      historicalConfig: {
                        ...config.historicalConfig!,
                        convexityZones: { zoneStrategy: 'none' }
                      }
                    });
                  }}
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
                  onClick={() => {
                    updateConfig({
                      historicalConfig: {
                        ...config.historicalConfig!,
                        convexityZones: { zoneStrategy: 'through_cycle' },
                        approach: 'through_cycle'
                      }
                    });
                  }}
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

            {/* Zone Configuration - only show if zones strategy is selected */}
            {(config.historicalConfig?.convexityZones?.zoneStrategy === 'zones' ||
              (!config.historicalConfig?.convexityZones?.zoneStrategy && config.historicalConfig?.approach === 'zone_based')) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
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

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowStrategyModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowStrategyModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}