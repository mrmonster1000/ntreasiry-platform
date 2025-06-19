'use client';

import { useState } from 'react';
import { 
  ChartBarIcon, 
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function CalibrationPage() {
  const [selectedMethod, setSelectedMethod] = useState<'last_3_moves' | 'zone_averaged' | 'optimized_zones'>('last_3_moves');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🚀 Beta Calibration Lab</h1>
              <p className="text-gray-600">Clean environment for building and testing beta calibration features</p>
            </div>
          </div>
        </div>

        {/* Status Check */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Page Loading</div>
                <div className="text-sm text-green-600">✅ Working</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-medium text-green-800">UI Rendering</div>
                <div className="text-sm text-green-600">✅ Stable</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <ArrowPathIcon className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">API Testing</div>
                <div className="text-sm text-blue-600">🔧 Disabled for safety</div>
              </div>
            </div>
          </div>
        </div>

        {/* Method Selection Widget - SAFE VERSION */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Calibration Method Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                method: 'last_3_moves' as const,
                title: 'Last 3 Moves',
                description: 'Average of last 3 hikes vs last 3 cuts',
                icon: '📈'
              },
              {
                method: 'zone_averaged' as const,
                title: 'Zone Averaged',
                description: 'Historical average by rate environment',
                icon: '🎯'
              },
              {
                method: 'optimized_zones' as const,
                title: 'Optimized Zones',
                description: 'ML optimized convexity zones',
                icon: '🤖'
              }
            ].map(({ method, title, description, icon }) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedMethod === method
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{icon}</span>
                  <span className="font-medium">{title}</span>
                </div>
                <p className="text-sm text-gray-600">{description}</p>
                {selectedMethod === method && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    ✓ Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Migration Progress Widget */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Widget Migration Progress</h2>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Building the ultimate beta platform by migrating 36 widgets from the original page:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <h3 className="font-medium text-green-900 mb-2">✅ Safe and Working</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Basic page structure</li>
                  <li>• Method selection widget</li>
                  <li>• Status display widget</li>
                  <li>• Navigation framework</li>
                </ul>
              </div>
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h3 className="font-medium text-blue-900 mb-2">🚧 Ready to Migrate</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Beta configuration controls</li>
                  <li>• Simple rate ladder chart</li>
                  <li>• Historical calibration modal</li>
                  <li>• Strategy analysis panel</li>
                  <li>• + 28 more widgets...</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Development Strategy */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-purple-900 mb-2">🎯 Development Strategy</h3>
              <p className="text-sm text-purple-700 mb-4">
                Each widget will be migrated individually, tested, and refined before moving to the next. 
                This ensures stability and allows us to improve each feature.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-purple-600">📦 Extract</span>
                <span className="text-gray-400">→</span>
                <span className="text-blue-600">🧪 Test</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-600">✨ Refine</span>
                <span className="text-gray-400">→</span>
                <span className="text-orange-600">🔗 Integrate</span>
              </div>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>

        {/* Safe Environment Confirmation */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 border border-green-300 rounded-full text-green-800 text-sm">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Safe Environment - No API calls, no crashes</span>
          </div>
        </div>
      </div>
    </div>
  );
}