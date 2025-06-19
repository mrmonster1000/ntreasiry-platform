'use client';

import { useState, useCallback } from 'react';
import { 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LockClosedIcon,
  LockOpenIcon,
  CalculatorIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface EquationVariable {
  id: string;
  name: string;
  category: 'constraint' | 'gradient' | 'convexity' | 'strategy';
  currentValue: number;
  unit: 'bp' | '%' | 'ratio' | 'zone';
  min: number;
  max: number;
  description: string;
  equation?: string;
  dependencies?: string[];
}

interface BetaLadderEquationBuilderProps {
  config: any;
  onConfigUpdate: (updates: any) => void;
  isLocked: boolean;
  onToggleLock: () => void;
}

export default function BetaLadderEquationBuilder({
  config,
  onConfigUpdate,
  isLocked,
  onToggleLock
}: BetaLadderEquationBuilderProps) {
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [equations, setEquations] = useState<Record<string, string>>({
    floorConstraint: 'max(0, currentRate - maxSpreadUnderBase)',
    ceilingConstraint: 'min(10, boeRate + maxSpreadOverBase)',
    lowToMidGradient: 'lowRateBetaMultiplier * historicalBeta',
    midToHighGradient: 'highRateBetaMultiplier * historicalBeta',
    convexityImpact: '(1 - naturalStrategy) * rateEnvironmentMultiplier',
    franchiseAdjustment: 'franchiseWeight * (1 - newEntrantPressure)',
    cutSensitivity: 'cutSensitivityOverride || (historicalBeta * 0.8)',
    hikeSensitivity: 'hikeSensitivityOverride || (historicalBeta * 1.2)'
  });

  const variables: EquationVariable[] = [
    // Constraints
    {
      id: 'floorConstraint',
      name: 'Rate Floor',
      category: 'constraint',
      currentValue: 0,
      unit: '%',
      min: 0,
      max: 2,
      description: 'Minimum product rate regardless of BoE rate',
      equation: equations.floorConstraint
    },
    {
      id: 'ceilingConstraint',
      name: 'Rate Ceiling',
      category: 'constraint',
      currentValue: 10,
      unit: '%',
      min: 5,
      max: 15,
      description: 'Maximum product rate regardless of BoE rate',
      equation: equations.ceilingConstraint
    },
    {
      id: 'maxSpreadOverBase',
      name: 'Max Spread Over Base',
      category: 'constraint',
      currentValue: config.maxSpreadOverBase / 100,
      unit: '%',
      min: 0,
      max: 5,
      description: 'Maximum premium over BoE rate',
      equation: 'userDefined'
    },
    {
      id: 'maxSpreadUnderBase',
      name: 'Max Spread Under Base',
      category: 'constraint',
      currentValue: config.maxSpreadUnderBase / 100,
      unit: '%',
      min: 0,
      max: 5,
      description: 'Maximum discount below BoE rate',
      equation: 'userDefined'
    },

    // Gradients
    {
      id: 'lowToMidGradient',
      name: 'Low→Mid Beta Gradient',
      category: 'gradient',
      currentValue: config.lowRateBetaMultiplier,
      unit: 'ratio',
      min: 0.1,
      max: 2.0,
      description: 'Beta sensitivity in low rate environment',
      equation: equations.lowToMidGradient
    },
    {
      id: 'midToHighGradient',
      name: 'Mid→High Beta Gradient',
      category: 'gradient',
      currentValue: config.highRateBetaMultiplier,
      unit: 'ratio',
      min: 0.5,
      max: 3.0,
      description: 'Beta sensitivity in high rate environment',
      equation: equations.midToHighGradient
    },

    // Convexity Zones
    {
      id: 'lowToMidConvexity',
      name: 'Low→Mid Transition',
      category: 'convexity',
      currentValue: config.lowToMidConvexityZone,
      unit: 'zone',
      min: 1.0,
      max: 3.5,
      description: 'BoE rate where low transitions to mid',
      equation: 'userDefined'
    },
    {
      id: 'midToHighConvexity',
      name: 'Mid→High Transition',
      category: 'convexity',
      currentValue: config.midToHighConvexityZone,
      unit: 'zone',
      min: 3.0,
      max: 5.5,
      description: 'BoE rate where mid transitions to high',
      equation: 'userDefined'
    },

    // Strategy
    {
      id: 'franchiseAdjustment',
      name: 'Franchise Strategy',
      category: 'strategy',
      currentValue: config.naturalStrategy,
      unit: 'ratio',
      min: 0,
      max: 1,
      description: 'Balance between franchise and acquisition',
      equation: equations.franchiseAdjustment
    },
    {
      id: 'cutSensitivity',
      name: 'Cut Response Beta',
      category: 'strategy',
      currentValue: 0.8,
      unit: 'ratio',
      min: 0.1,
      max: 1.5,
      description: 'How quickly to pass through rate cuts',
      equation: equations.cutSensitivity
    },
    {
      id: 'hikeSensitivity',
      name: 'Hike Response Beta',
      category: 'strategy',
      currentValue: 1.2,
      unit: 'ratio',
      min: 0.5,
      max: 2.0,
      description: 'How quickly to pass through rate hikes',
      equation: equations.hikeSensitivity
    }
  ];

  const handleVariableUpdate = useCallback((variableId: string, newValue: number) => {
    if (isLocked) return;

    const variable = variables.find(v => v.id === variableId);
    if (!variable) return;

    // Update the config based on the variable
    const updates: any = {};
    
    switch (variableId) {
      case 'maxSpreadOverBase':
        updates.maxSpreadOverBase = newValue * 100; // Convert to bp
        break;
      case 'maxSpreadUnderBase':
        updates.maxSpreadUnderBase = newValue * 100;
        break;
      case 'lowToMidGradient':
        updates.lowRateBetaMultiplier = newValue;
        break;
      case 'midToHighGradient':
        updates.highRateBetaMultiplier = newValue;
        break;
      case 'lowToMidConvexity':
        updates.lowToMidConvexityZone = newValue;
        break;
      case 'midToHighConvexity':
        updates.midToHighConvexityZone = newValue;
        break;
      case 'franchiseAdjustment':
        updates.naturalStrategy = newValue;
        updates.rateEnvironmentStrategy = 1 - newValue;
        break;
      case 'cutSensitivity':
        updates.cutSensitivityOverride = newValue;
        break;
      case 'hikeSensitivity':
        updates.hikeSensitivityOverride = newValue;
        break;
    }

    onConfigUpdate(updates);
  }, [isLocked, onConfigUpdate]);

  const handleEquationUpdate = useCallback((variableId: string, newEquation: string) => {
    if (isLocked) return;
    
    setEquations(prev => ({
      ...prev,
      [variableId]: newEquation
    }));
  }, [isLocked]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'constraint': return 'border-red-300 bg-red-50';
      case 'gradient': return 'border-blue-300 bg-blue-50';
      case 'convexity': return 'border-purple-300 bg-purple-50';
      case 'strategy': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'constraint': return '🔒';
      case 'gradient': return '📈';
      case 'convexity': return '🎯';
      case 'strategy': return '🎮';
      default: return '📊';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Beta Ladder Variable Configuration</h3>
          <p className="text-sm text-gray-600">Define equations and constraints for rate ladder construction</p>
        </div>
        <button
          onClick={onToggleLock}
          className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${
            isLocked 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isLocked ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
          {isLocked ? 'Locked' : 'Unlocked'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variables List */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Configuration Variables</h4>
          
          {['constraint', 'gradient', 'convexity', 'strategy'].map(category => (
            <div key={category} className="space-y-2">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                {getCategoryIcon(category)} {category}s
              </h5>
              
              {variables
                .filter(v => v.category === category)
                .map(variable => (
                  <div
                    key={variable.id}
                    onClick={() => setSelectedVariable(variable.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      getCategoryColor(category)
                    } ${
                      selectedVariable === variable.id 
                        ? 'ring-2 ring-offset-2 ring-blue-500' 
                        : 'hover:shadow-md'
                    } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{variable.name}</span>
                      <span className="text-sm font-mono text-gray-700">
                        {variable.currentValue.toFixed(2)}{variable.unit}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${((variable.currentValue - variable.min) / (variable.max - variable.min)) * 100}%`
                        }}
                      />
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Variable Editor */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Variable Editor</h4>
          
          {selectedVariable ? (
            <>
              {(() => {
                const variable = variables.find(v => v.id === selectedVariable);
                if (!variable) return null;
                
                return (
                  <div className={`p-4 border rounded-lg ${getCategoryColor(variable.category)}`}>
                    <h5 className="text-lg font-medium text-gray-900 mb-2">{variable.name}</h5>
                    <p className="text-sm text-gray-600 mb-4">{variable.description}</p>
                    
                    {/* Value Slider */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Value: {variable.currentValue.toFixed(2)}{variable.unit}
                      </label>
                      <input
                        type="range"
                        min={variable.min}
                        max={variable.max}
                        step={(variable.max - variable.min) / 100}
                        value={variable.currentValue}
                        onChange={(e) => handleVariableUpdate(variable.id, parseFloat(e.target.value))}
                        disabled={isLocked}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{variable.min}{variable.unit}</span>
                        <span>{variable.max}{variable.unit}</span>
                      </div>
                    </div>
                    
                    {/* Equation Editor */}
                    {variable.equation && variable.equation !== 'userDefined' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Equation
                        </label>
                        <textarea
                          value={variable.equation}
                          onChange={(e) => handleEquationUpdate(variable.id, e.target.value)}
                          disabled={isLocked}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
                          rows={2}
                        />
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVariableUpdate(variable.id, variable.min)}
                        disabled={isLocked}
                        className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                      >
                        Min
                      </button>
                      <button
                        onClick={() => handleVariableUpdate(variable.id, (variable.min + variable.max) / 2)}
                        disabled={isLocked}
                        className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                      >
                        Mid
                      </button>
                      <button
                        onClick={() => handleVariableUpdate(variable.id, variable.max)}
                        disabled={isLocked}
                        className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                      >
                        Max
                      </button>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <CalculatorIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600">
                Select a variable to configure its value and equation
              </p>
            </div>
          )}
          
          {/* Visual Impact Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Impact Preview</h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Floor Rate:</span>
                <span className="font-mono">max(0%, {(config.currentRate - config.maxSpreadUnderBase/100).toFixed(2)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ceiling Rate:</span>
                <span className="font-mono">min(10%, {(4.25 + config.maxSpreadOverBase/100).toFixed(2)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Low Rate Beta:</span>
                <span className="font-mono">{config.lowRateBetaMultiplier.toFixed(3)} × historical</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">High Rate Beta:</span>
                <span className="font-mono">{config.highRateBetaMultiplier.toFixed(3)} × historical</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Strategy Mix:</span>
                <span className="font-mono">{(config.naturalStrategy * 100).toFixed(0)}% Natural / {(config.rateEnvironmentStrategy * 100).toFixed(0)}% Rate Env</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}