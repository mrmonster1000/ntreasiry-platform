'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowDownTrayIcon, DocumentTextIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [exportType, setExportType] = useState<'detailed' | 'summary'>('detailed');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const endpoint = exportType === 'detailed' ? '/api/export/detailed-rates' : '/api/export/rates';
      const url = `http://localhost:3002${endpoint}?format=${format}`;
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = ''; // Browser will use filename from Content-Disposition header
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Close modal after successful download
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Export Savings Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Type
            </label>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="detailed"
                  checked={exportType === 'detailed'}
                  onChange={(e) => setExportType(e.target.value as 'detailed')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Detailed Latest Rates</div>
                  <div className="text-sm text-gray-600">
                    Complete product details with all rate tiers, bonuses, conditions, features, and eligibility requirements
                  </div>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="summary"
                  checked={exportType === 'summary'}
                  onChange={(e) => setExportType(e.target.value as 'summary')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Summary Rates</div>
                  <div className="text-sm text-gray-600">
                    Basic overview with bank, product name, type, and effective rate only
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as 'csv')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <TableCellsIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">CSV</div>
                  <div className="text-xs text-gray-600">Excel compatible</div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as 'json')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">JSON</div>
                  <div className="text-xs text-gray-600">API compatible</div>
                </div>
              </label>
            </div>
          </div>

          {/* Preview of what will be exported */}
          {exportType === 'detailed' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="w-4 h-4 bg-emerald-600 rounded-full mt-0.5 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <div className="text-sm text-emerald-800">
                  <div className="font-medium mb-1">Detailed export includes:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• All rate tiers and balance ranges</li>
                    <li>• Bonus rates, promotional rates, and conditions</li>
                    <li>• Account features (online access, fees, limits)</li>
                    <li>• Eligibility requirements and relationship benefits</li>
                    <li>• Interest payment details and terms</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}