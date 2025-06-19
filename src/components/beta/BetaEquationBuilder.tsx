'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  PlusIcon, 
  MinusIcon, 
  XMarkIcon,
  PlayIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

interface Variable {
  id: string;
  name: string;
  symbol: string;
  type: 'rate' | 'spread' | 'beta' | 'multiplier' | 'constant';
  value: number;
  color: string;
  description: string;
}

interface EquationNode {
  id: string;
  type: 'variable' | 'operator' | 'function';
  content: Variable | string;
  x: number;
  y: number;
}

interface BetaEquationBuilderProps {
  onEquationChange: (equation: string, result: number) => void;
  isLocked: boolean;
  onToggleLock: () => void;
}

export default function BetaEquationBuilder({
  onEquationChange,
  isLocked,
  onToggleLock
}: BetaEquationBuilderProps) {
  const [availableVariables] = useState<Variable[]>([
    { id: 'boe_rate', name: 'BoE Base Rate', symbol: 'B', type: 'rate', value: 4.25, color: '#3b82f6', description: 'Current Bank of England base rate' },
    { id: 'current_spread', name: 'Current Spread', symbol: 'S', type: 'spread', value: 1.5, color: '#8b5cf6', description: 'Product rate minus BoE rate' },
    { id: 'historical_beta', name: 'Historical Beta', symbol: 'βₕ', type: 'beta', value: 0.75, color: '#ef4444', description: 'Historical beta coefficient' },
    { id: 'low_rate_mult', name: 'Low Rate Multiplier', symbol: 'Lₘ', type: 'multiplier', value: 0.7, color: '#f59e0b', description: 'Beta multiplier for low rate environment' },
    { id: 'mid_rate_mult', name: 'Mid Rate Multiplier', symbol: 'Mₘ', type: 'multiplier', value: 1.0, color: '#10b981', description: 'Beta multiplier for mid rate environment' },
    { id: 'high_rate_mult', name: 'High Rate Multiplier', symbol: 'Hₘ', type: 'multiplier', value: 1.2, color: '#f97316', description: 'Beta multiplier for high rate environment' },
    { id: 'market_pressure', name: 'Market Pressure', symbol: 'P', type: 'multiplier', value: 0.3, color: '#06b6d4', description: 'External market pressure factor' },
    { id: 'franchise_weight', name: 'Franchise Weight', symbol: 'F', type: 'multiplier', value: 0.5, color: '#84cc16', description: 'Franchise vs acquisition strategy weight' }
  ]);

  const [operators] = useState(['+', '-', '×', '÷', '(', ')']);
  const [functions] = useState(['max', 'min', 'avg', 'sqrt']);
  
  const [equationNodes, setEquationNodes] = useState<EquationNode[]>([]);
  const [draggedItem, setDraggedItem] = useState<Variable | string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [nextNodeId, setNextNodeId] = useState(1);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((item: Variable | string) => {
    if (isLocked) return;
    setDraggedItem(item);
    setIsDragging(true);
  }, [isLocked]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || isLocked) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: EquationNode = {
      id: `node_${nextNodeId}`,
      type: typeof draggedItem === 'string' ? 
        (operators.includes(draggedItem) ? 'operator' : 'function') : 'variable',
      content: draggedItem,
      x,
      y
    };

    setEquationNodes(prev => [...prev, newNode]);
    setNextNodeId(prev => prev + 1);
    setDraggedItem(null);
    setIsDragging(false);
  }, [draggedItem, nextNodeId, operators, isLocked]);

  const removeNode = useCallback((nodeId: string) => {
    if (isLocked) return;
    setEquationNodes(prev => prev.filter(node => node.id !== nodeId));
  }, [isLocked]);

  const calculateEquation = useCallback(() => {
    // Simple equation evaluation - in production this would be more sophisticated
    try {
      let equation = '';
      const sortedNodes = [...equationNodes].sort((a, b) => a.x - b.x);
      
      for (const node of sortedNodes) {
        if (node.type === 'variable') {
          const variable = node.content as Variable;
          equation += variable.value;
        } else if (node.type === 'operator') {
          const op = node.content as string;
          equation += op === '×' ? '*' : op === '÷' ? '/' : op;
        } else if (node.type === 'function') {
          equation += node.content;
        }
        equation += ' ';
      }

      // This is a simplified evaluation - real implementation would be more robust
      const result = eval(equation.replace(/[^\d\s+\-*/().]/g, ''));
      onEquationChange(equation.trim(), result || 0);
      return result;
    } catch {
      return 0;
    }
  }, [equationNodes, onEquationChange]);

  const clearEquation = useCallback(() => {
    if (isLocked) return;
    setEquationNodes([]);
    onEquationChange('', 0);
  }, [onEquationChange, isLocked]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Beta Equation Builder</h3>
          <p className="text-sm text-gray-600">Drag variables and operators to build custom beta calculations</p>
        </div>
        <div className="flex items-center space-x-2">
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
          <button
            onClick={calculateEquation}
            disabled={equationNodes.length === 0}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
          >
            <PlayIcon className="w-4 h-4" />
            Calculate
          </button>
          <button
            onClick={clearEquation}
            disabled={isLocked || equationNodes.length === 0}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Variable Palette */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Variables</h4>
          <div className="grid grid-cols-2 gap-2">
            {availableVariables.map(variable => (
              <div
                key={variable.id}
                draggable={!isLocked}
                onDragStart={() => handleDragStart(variable)}
                className={`p-2 border rounded-lg text-center text-xs cursor-move hover:shadow-md transition-all ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ 
                  borderColor: variable.color, 
                  backgroundColor: `${variable.color}15`,
                  color: variable.color 
                }}
                title={variable.description}
              >
                <div className="font-bold">{variable.symbol}</div>
                <div className="text-[10px] mt-1">{variable.name}</div>
                <div className="text-[10px] font-mono">{variable.value}</div>
              </div>
            ))}
          </div>

          <h4 className="text-sm font-medium text-gray-700 mt-4">Operators</h4>
          <div className="flex flex-wrap gap-2">
            {operators.map(op => (
              <div
                key={op}
                draggable={!isLocked}
                onDragStart={() => handleDragStart(op)}
                className={`w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-sm font-bold cursor-move hover:bg-gray-100 ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {op}
              </div>
            ))}
          </div>

          <h4 className="text-sm font-medium text-gray-700 mt-4">Functions</h4>
          <div className="flex flex-wrap gap-2">
            {functions.map(func => (
              <div
                key={func}
                draggable={!isLocked}
                onDragStart={() => handleDragStart(func)}
                className={`px-2 py-1 border border-purple-300 bg-purple-50 rounded text-xs font-mono cursor-move hover:bg-purple-100 ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {func}
              </div>
            ))}
          </div>
        </div>

        {/* Equation Canvas */}
        <div className="lg:col-span-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Equation Canvas</h4>
          <div
            ref={canvasRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="h-64 border-2 border-dashed border-gray-300 rounded-lg relative bg-gray-50 overflow-hidden"
          >
            {equationNodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                {isLocked ? 'Equation is locked' : 'Drag variables and operators here to build your equation'}
              </div>
            )}

            {equationNodes.map(node => (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: node.x, top: node.y }}
              >
                {node.type === 'variable' ? (
                  <div
                    className="p-2 border rounded-lg text-xs text-center shadow-sm"
                    style={{
                      borderColor: (node.content as Variable).color,
                      backgroundColor: `${(node.content as Variable).color}20`,
                      color: (node.content as Variable).color
                    }}
                  >
                    <div className="font-bold">{(node.content as Variable).symbol}</div>
                    <div className="text-[10px] font-mono">{(node.content as Variable).value}</div>
                  </div>
                ) : (
                  <div className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-bold shadow-sm">
                    {node.content as string}
                  </div>
                )}
                
                {!isLocked && (
                  <button
                    onClick={() => removeNode(node.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Equation Preview */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Current Equation:</div>
            <div className="font-mono text-sm text-gray-900">
              {equationNodes.length === 0 ? '(empty)' : 
                equationNodes
                  .sort((a, b) => a.x - b.x)
                  .map(node => {
                    if (node.type === 'variable') {
                      return (node.content as Variable).symbol;
                    }
                    return node.content;
                  })
                  .join(' ')
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}