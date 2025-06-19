'use client';

import React, { useState, useEffect } from 'react';
import { 
  WrenchScrewdriverIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import type { BetaConfig, CalibrationMethod } from '../BetaCalibrationWizard';

interface CalibrationMethodStepProps {
  config: BetaConfig;
  updateConfig: (updates: Partial<BetaConfig>) => void;
  disabled?: boolean;
  onValidationChange?: (errors: string[]) => void;
}

export function CalibrationMethodStep({
  config,
  updateConfig,
  disabled = false,
  onValidationChange
}: CalibrationMethodStepProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate method selection
  useEffect(() => {
    const errors: string[] = [];
    
    if (!config.calibrationMethod) {
      errors.push('Please select a calibration method');
    }

    setValidationErrors(errors);
    onValidationChange?.(errors);
  }, [config.calibrationMethod]);

  const selectMethod = (method: CalibrationMethod) => {
    updateConfig({ calibrationMethod: method });
  };

  const calibrationMethods = [
    {
      id: 'manual' as const,
      icon: WrenchScrewdriverIcon,
      title: 'Manual Configuration',
      description: 'Set beta parameters manually based on judgment and strategy',
      details: [
        'Direct control over all beta multipliers',
        'Configure convexity zones manually',
        'Perfect for strategic positioning',
        'Requires beta expertise'
      ],
      pros: ['Full control', 'Strategic flexibility', 'No data dependency'],
      cons: ['Requires expertise', 'No empirical validation', 'Manual maintenance'],
      color: 'blue'
    },
    {
      id: 'historical' as const,
      icon: ChartBarIcon,
      title: 'Historical Calibration',
      description: 'Derive parameters from historical rate movement patterns',
      details: [
        'Analyze past BoE rate changes',
        'Calculate empirical beta relationships',
        'Zone-based or through-cycle approaches',
        'Multiple calculation methodologies'
      ],
      pros: ['Data-driven', 'Empirically validated', 'Multiple approaches'],
      cons: ['Past ≠ future', 'Requires clean data', 'Complex setup'],
      color: 'green'
    },
    {
      id: 'inherit' as const,
      icon: DocumentDuplicateIcon,
      title: 'Inherit & Track',
      description: 'Copy from another product or track competitor with spread',
      details: [
        'Inherit from existing product setup',
        'Track competitor rates with spread',
        'Real-time or scheduled updates',
        'Minimal configuration required'
      ],
      pros: ['Quick setup', 'Proven parameters', 'Competitive tracking'],
      cons: ['Limited customization', 'Dependency on source', 'Less strategic control'],
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Method Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {calibrationMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = config.calibrationMethod === method.id;
          const colorClasses = {
            blue: {
              border: isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
              icon: isSelected ? 'text-blue-600' : 'text-gray-400',
              title: isSelected ? 'text-blue-900' : 'text-gray-700',
              description: isSelected ? 'text-blue-700' : 'text-gray-600'
            },
            green: {
              border: isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
              icon: isSelected ? 'text-green-600' : 'text-gray-400',
              title: isSelected ? 'text-green-900' : 'text-gray-700',
              description: isSelected ? 'text-green-700' : 'text-gray-600'
            },
            purple: {
              border: isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300',
              icon: isSelected ? 'text-purple-600' : 'text-gray-400',
              title: isSelected ? 'text-purple-900' : 'text-gray-700',
              description: isSelected ? 'text-purple-700' : 'text-gray-600'
            }
          };
          
          const colors = colorClasses[method.color as keyof typeof colorClasses];

          return (
            <button
              key={method.id}
              onClick={() => selectMethod(method.id)}
              disabled={disabled}
              className={`p-6 rounded-lg border-2 transition-all text-left w-full ${colors.border} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Icon className={`w-8 h-8 ${colors.icon}`} />
                <h3 className={`text-lg font-semibold ${colors.title}`}>
                  {method.title}
                </h3>
              </div>
              
              <p className={`text-sm mb-4 ${colors.description}`}>
                {method.description}
              </p>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Key Features:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {method.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <h5 className="font-medium text-green-700 mb-1">Pros:</h5>
                    <ul className="text-green-600 space-y-1">
                      {method.pros.map((pro, idx) => (
                        <li key={idx}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-red-700 mb-1">Cons:</h5>
                    <ul className="text-red-600 space-y-1">
                      {method.cons.map((con, idx) => (
                        <li key={idx}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-xs font-medium text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Selected Method</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Method Summary */}
      {config.calibrationMethod && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Selected: {
            calibrationMethods.find(m => m.id === config.calibrationMethod)?.title
          }</h4>
          <p className="text-sm text-gray-600">
            {calibrationMethods.find(m => m.id === config.calibrationMethod)?.description}
          </p>
          
          {config.calibrationMethod === 'historical' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800">
                <strong>Next:</strong> You'll configure the historical approach (zone-based or through-cycle) 
                and see beta charts to validate zone settings.
              </p>
            </div>
          )}
          
          {config.calibrationMethod === 'inherit' && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-xs text-purple-800">
                <strong>Next:</strong> You'll select the source product or competitor to inherit/track 
                parameters from.
              </p>
            </div>
          )}
          
          {config.calibrationMethod === 'manual' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800">
                <strong>Next:</strong> You'll manually configure beta multipliers and convexity zones 
                for each tier.
              </p>
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
              <h4 className="text-red-800 font-medium">Please select a calibration method</h4>
              <p className="text-red-700 text-sm mt-1">
                Choose one of the three approaches above to continue with the calibration process.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Method Comparison */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Method Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Aspect</th>
                <th className="px-3 py-2 text-left font-medium text-blue-700">Manual</th>
                <th className="px-3 py-2 text-left font-medium text-green-700">Historical</th>
                <th className="px-3 py-2 text-left font-medium text-purple-700">Inherit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-3 py-2 font-medium text-gray-700">Setup Time</td>
                <td className="px-3 py-2 text-gray-600">Medium</td>
                <td className="px-3 py-2 text-gray-600">High</td>
                <td className="px-3 py-2 text-gray-600">Low</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-gray-700">Data Required</td>
                <td className="px-3 py-2 text-gray-600">None</td>
                <td className="px-3 py-2 text-gray-600">Historical rates</td>
                <td className="px-3 py-2 text-gray-600">Source product</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-gray-700">Empirical Basis</td>
                <td className="px-3 py-2 text-gray-600">Strategy-based</td>
                <td className="px-3 py-2 text-gray-600">Data-driven</td>
                <td className="px-3 py-2 text-gray-600">Proven setup</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-gray-700">Maintenance</td>
                <td className="px-3 py-2 text-gray-600">Manual updates</td>
                <td className="px-3 py-2 text-gray-600">Periodic recalibration</td>
                <td className="px-3 py-2 text-gray-600">Automatic tracking</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-gray-700">Best For</td>
                <td className="px-3 py-2 text-gray-600">Strategic positioning</td>
                <td className="px-3 py-2 text-gray-600">Empirical accuracy</td>
                <td className="px-3 py-2 text-gray-600">Quick deployment</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}