'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  PlayIcon, 
  ChartBarIcon, 
  ArrowDownTrayIcon,
  ClockIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/outline';
import { ExportModal } from './ExportModal';

export function QuickActions() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link
          href="/extract"
          className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors duration-200 group"
        >
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-700 transition-colors duration-200">
            <PlayIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Run Extraction</div>
            <div className="text-sm text-gray-600">Start manual extraction</div>
          </div>
        </Link>

        <Link
          href="/calibration"
          className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200 group"
        >
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-700 transition-colors duration-200">
            <CursorArrowRaysIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">🚀 Calibration Lab</div>
            <div className="text-sm text-gray-600">Clean beta environment (36 widgets to migrate)</div>
          </div>
        </Link>

        <Link
          href="/reports"
          className="flex items-center space-x-3 p-4 bg-lime-50 rounded-lg hover:bg-lime-100 transition-colors duration-200 group"
        >
          <div className="w-10 h-10 bg-lime-600 rounded-lg flex items-center justify-center group-hover:bg-lime-700 transition-colors duration-200">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">View Reports</div>
            <div className="text-sm text-gray-600">Market intelligence</div>
          </div>
        </Link>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center space-x-3 p-4 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors duration-200 group"
        >
          <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center group-hover:bg-emerald-800 transition-colors duration-200">
            <ArrowDownTrayIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Export Data</div>
            <div className="text-sm text-gray-600">Download CSV/JSON</div>
          </div>
        </button>

        <Link
          href="/history"
          className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 group"
        >
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors duration-200">
            <ClockIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">View History</div>
            <div className="text-sm text-gray-600">Past extractions</div>
          </div>
        </Link>
      </div>

      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
    </div>
  );
}