'use client';

import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import type { BetaConfig, CurrentProduct } from '../BetaCalibrationWizard';

interface GlobalConstraintsStepProps {
  config: BetaConfig;
  updateConfig: (updates: Partial<BetaConfig>) => void;
  currentProduct?: CurrentProduct;
  disabled?: boolean;
  onValidationChange?: (errors: string[]) => void;
}

export function GlobalConstraintsStep({
  config,
  updateConfig,
  currentProduct,
  disabled = false,
  onValidationChange
}: GlobalConstraintsStepProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get product rate constraints for validation
  const getProductRateConstraints = () => {
    if (!currentProduct?.tiers) return null;
    
    const rates = currentProduct.tiers.map(t => t.rate);
    return {
      minTierRate: Math.min(...rates),
      maxTierRate: Math.max(...rates),
      tiers: currentProduct.tiers
    };
  };

  // Validate constraints
  useEffect(() => {
    const errors: string[] = [];
    const productConstraints = getProductRateConstraints();

    // Rate floor vs ceiling validation
    if (config.rateFloorActive && config.rateCeilingActive && config.rateFloor >= config.rateCeiling) {
      errors.push('Rate floor must be less than rate ceiling');
    }

    // Negative spreads validation
    if (config.maxSpreadOverBaseActive && config.maxSpreadOverBase < 0) {
      errors.push('Max spread over base cannot be negative');
    }
    if (config.maxSpreadUnderBaseActive && config.maxSpreadUnderBase < 0) {
      errors.push('Max spread under base cannot be negative');
    }

    // Product-specific rate floor validation
    if (config.rateFloorActive && productConstraints && config.rateFloor >= productConstraints.minTierRate) {
      const violatingTier = productConstraints.tiers.find(tier => config.rateFloor >= tier.rate);
      errors.push(`Rate floor (${config.rateFloor.toFixed(2)}%) cannot exceed ${violatingTier?.tier_name} rate (${violatingTier?.rate.toFixed(2)}%)`);
    }

    setValidationErrors(errors);
    onValidationChange?.(errors);
  }, [config, currentProduct]);

  // Constraint input component
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

      if (validateForRateFloor && productConstraints && numValue >= productConstraints.minTierRate) {
        setHasError(true);
        setErrorMessage(`Cannot exceed minimum tier rate (${productConstraints.minTierRate.toFixed(2)}%)`);
        return false;
      }

      setHasError(false);
      setErrorMessage('');
      return true;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      
      const numValue = parseFloat(newValue);
      if (validateValue(numValue)) {
        onChange(numValue);
      }
    };

    const handleBlur = () => {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        setInputValue(numValue.toFixed(2));
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id={`${label.toLowerCase().replace(/\s+/g, '-')}-active`}
              checked={isActive}
              onChange={(e) => onToggle(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label 
              htmlFor={`${label.toLowerCase().replace(/\s+/g, '-')}-active`}
              className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
            >
              {label}
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              disabled={!isActive || disabled}
              className={`w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            <span className="text-sm text-gray-500">{unit}</span>
          </div>
        </div>
        
        {description && (
          <p className="text-xs text-gray-600 ml-7">{description}</p>
        )}
        
        {hasError && errorMessage && (
          <p className="text-xs text-red-600 ml-7">{errorMessage}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Product Info */}
      {currentProduct && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Product: {currentProduct.bank_code} {currentProduct.product_name}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {currentProduct.tiers.map((tier, idx) => (
              <div key={idx} className="bg-white rounded p-2 border border-blue-200">
                <div className="font-medium text-blue-800">{tier.tier_name}</div>
                <div className="text-blue-600">{tier.rate.toFixed(2)}% • {tier.balance_range}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Constraints */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          Global Constraints
          <InformationCircleIcon className="w-4 h-4 text-gray-500 ml-2" />
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          These constraints apply to all product tiers. Activate only the constraints you need.
        </p>
        
        <div className="space-y-4">
          <ConstraintInput
            label="Rate Floor"
            value={config.rateFloor}
            isActive={config.rateFloorActive}
            onChange={(value) => updateConfig({ rateFloor: value })}
            onToggle={(active) => updateConfig({ rateFloorActive: active })}
            description="Minimum product rate regardless of BoE rate"
            validateForRateFloor={true}
          />
          
          <ConstraintInput
            label="Rate Ceiling"
            value={config.rateCeiling}
            isActive={config.rateCeilingActive}
            onChange={(value) => updateConfig({ rateCeiling: value })}
            onToggle={(active) => updateConfig({ rateCeilingActive: active })}
            description="Maximum product rate regardless of BoE rate"
          />
          
          <ConstraintInput
            label="Max Spread Over BoE"
            value={config.maxSpreadOverBase / 100}
            isActive={config.maxSpreadOverBaseActive}
            onChange={(value) => updateConfig({ maxSpreadOverBase: value * 100 })}
            onToggle={(active) => updateConfig({ maxSpreadOverBaseActive: active })}
            description="Maximum premium over Bank of England rate"
          />
          
          <ConstraintInput
            label="Max Spread Under BoE"
            value={config.maxSpreadUnderBase / 100}
            isActive={config.maxSpreadUnderBaseActive}
            onChange={(value) => updateConfig({ maxSpreadUnderBase: value * 100 })}
            onToggle={(active) => updateConfig({ maxSpreadUnderBaseActive: active })}
            description="Maximum discount below Bank of England rate"
          />
        </div>
      </div>

      {/* Active Constraints Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-green-900 mb-3">Active Constraints Summary</h5>
        <div className="flex flex-wrap gap-2">
          {config.rateFloorActive && (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              Floor: {config.rateFloor.toFixed(2)}%
            </div>
          )}
          {config.rateCeilingActive && (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              Ceiling: {config.rateCeiling.toFixed(2)}%
            </div>
          )}
          {config.maxSpreadOverBaseActive && (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              Max Over: +{(config.maxSpreadOverBase/100).toFixed(2)}%
            </div>
          )}
          {config.maxSpreadUnderBaseActive && (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              Max Under: -{(config.maxSpreadUnderBase/100).toFixed(2)}%
            </div>
          )}
          {!config.rateFloorActive && !config.rateCeilingActive && !config.maxSpreadOverBaseActive && !config.maxSpreadUnderBaseActive && (
            <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
              No constraints active
            </div>
          )}
        </div>
        
        {(!config.rateFloorActive && !config.rateCeilingActive && !config.maxSpreadOverBaseActive && !config.maxSpreadUnderBaseActive) && (
          <div className="mt-3 flex items-start space-x-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-700">
              Consider activating at least one constraint to ensure rate behavior stays within acceptable bounds.
            </p>
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium">Validation Issues:</h4>
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