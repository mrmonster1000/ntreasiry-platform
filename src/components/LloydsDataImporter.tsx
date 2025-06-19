'use client';

import React, { useState } from 'react';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { importLloydsDataBrowser, lloydsHistoricalData, type ImportResult } from '@/utils/import-lloyds-browser';

export function LloydsDataImporter() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const result = await importLloydsDataBrowser();
      setImportResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  // Get data summary for preview
  const dataSummary = {
    totalRecords: lloydsHistoricalData.length,
    products: Array.from(new Set(lloydsHistoricalData.map(r => r.product_name))),
    dateRange: {
      earliest: Math.min(...lloydsHistoricalData.map(r => new Date(r.effective_from).getTime())),
      latest: Math.max(...lloydsHistoricalData.map(r => new Date(r.effective_to || r.effective_from).getTime()))
    },
    totalTiers: lloydsHistoricalData.reduce((sum, r) => sum + r.tiers.length, 0)
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <BanknotesIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lloyds Historical Data Import</h2>
          <p className="text-sm text-gray-600">Import comprehensive historical rate data for beta calibration testing</p>
        </div>
      </div>

      {/* Data Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Data Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-800">Total Records</div>
            <div className="text-blue-600">{dataSummary.totalRecords}</div>
          </div>
          <div>
            <div className="font-medium text-blue-800">Products</div>
            <div className="text-blue-600">{dataSummary.products.length}</div>
          </div>
          <div>
            <div className="font-medium text-blue-800">Rate Tiers</div>
            <div className="text-blue-600">{dataSummary.totalTiers}</div>
          </div>
          <div>
            <div className="font-medium text-blue-800">Date Range</div>
            <div className="text-blue-600">
              {new Date(dataSummary.dateRange.earliest).getFullYear()} - {new Date(dataSummary.dateRange.latest).getFullYear()}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-medium text-blue-800 mb-2">Products Included:</div>
          <div className="text-xs text-blue-700 space-y-1">
            {dataSummary.products.map(product => (
              <div key={product}>• {product}</div>
            ))}
          </div>
          <div className="mt-3 text-xs text-blue-600">
            <strong>Coverage:</strong> Complete historical data from 2004-2023 including early banking crisis period, 
            Club Lloyds high-rate era (2014-2017), and COVID-era rate reductions.
          </div>
        </div>
      </div>

      {/* Import Controls */}
      <div className="space-y-4">
        <button
          onClick={handleImport}
          disabled={isImporting}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            isImporting
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isImporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Importing...</span>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="w-5 h-5" />
              <span>Import Lloyds Historical Data</span>
            </>
          )}
        </button>

        {/* Import Results */}
        {importResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-900">Import Completed Successfully</h4>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <div className="font-medium text-green-800">Imported</div>
                <div className="text-green-600">{importResult.imported}</div>
              </div>
              <div>
                <div className="font-medium text-green-800">Duplicates</div>
                <div className="text-green-600">{importResult.duplicates}</div>
              </div>
              <div>
                <div className="font-medium text-green-800">Errors</div>
                <div className="text-green-600">{importResult.errors.length}</div>
              </div>
            </div>

            {importResult.details && importResult.details.length > 0 && (
              <div className="text-xs text-green-700 bg-green-100 rounded p-3">
                <div className="font-medium mb-2">Import Details:</div>
                {importResult.details.map((detail, index) => (
                  <div key={index}>{detail}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-red-900">Import Failed</h4>
            </div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Import Errors */}
        {importResult && importResult.errors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
              <h4 className="font-medium text-yellow-900">Import Warnings</h4>
            </div>
            <div className="text-sm text-yellow-700 space-y-1">
              {importResult.errors.map((err, index) => (
                <div key={index}>• {err}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <InformationCircleIcon className="w-5 h-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">Usage Instructions</h4>
        </div>
        <div className="text-sm text-gray-700 space-y-2">
          <div>1. <strong>Import Data:</strong> Click the import button to add Lloyds historical rates to the database</div>
          <div>2. <strong>Test Beta Calibration:</strong> Use the imported data to test dynamic zone detection algorithms</div>
          <div>3. <strong>Analyze Rate Patterns:</strong> The data includes various Club Lloyds products with tiered rate structures</div>
          <div>4. <strong>Historical Range:</strong> Data covers 2014-2023 with multiple rate change periods</div>
        </div>
      </div>
    </div>
  );
}