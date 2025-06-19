'use client';

import { useState, useEffect } from 'react';
import { BeakerIcon, ExclamationTriangleIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { BetaCalibrationWizard } from '@/components/beta/BetaCalibrationWizard';
import { LloydsDataImporter } from '@/components/LloydsDataImporter';
import { api } from '@/lib/api';

export default function TestPage() {
  const [widgetEnabled, setWidgetEnabled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('club-lloyds');
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real products from API
  useEffect(() => {
    async function fetchProducts() {
      try {
        const products = await api.getBetaProducts();
        
        // Add Club Lloyds Current Account if not already present
        const hasClubLloyds = products.some(p => p.product_name === 'Club Lloyds Current Account');
        if (!hasClubLloyds) {
          products.unshift({
            key: 'LLOYDS-Club Lloyds Current Account',
            bank_name: 'Lloyds Bank UK',
            bank_code: 'LLOYDS',
            product_name: 'Club Lloyds Current Account',
            product_type: 'instant_access_savings',
            tiers: [
              {
                tier_number: 1,
                tier_name: 'Tier 1',
                total_rate: 1.50,
                balance_minimum: 1,
                balance_maximum: 3999
              },
              {
                tier_number: 2,
                tier_name: 'Tier 2',
                total_rate: 3.00,
                balance_minimum: 4000,
                balance_maximum: 5000
              }
            ]
          });
        }
        
        setAvailableProducts(products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Fallback to hardcoded data if API fails
        setAvailableProducts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  // Convert API products to format expected by wizard
  const products = availableProducts.reduce((acc: any, product: any) => {
    const key = product.key.toLowerCase().replace(/[^a-z0-9]/g, '-');
    acc[key] = {
      bank_code: product.bank_code,
      product_name: product.product_name,
      tiers: product.tiers.map((tier: any) => ({
        tier_name: tier.tier_name,
        rate: tier.total_rate,
        balance_range: tier.balance_maximum 
          ? `£${tier.balance_minimum.toLocaleString()}-£${tier.balance_maximum.toLocaleString()}`
          : `£${tier.balance_minimum.toLocaleString()}+`
      }))
    };
    return acc;
  }, {
    'none': undefined // Keep the no-product option  
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <BeakerIcon className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Widget Development Lab</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Safe testing environment for new widgets before deployment to production pages. 
            This page is isolated and won't affect the main application.
          </p>
        </div>

        {/* Safety Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Development Environment</h3>
              <p className="text-sm text-amber-700 mt-1">
                This page is for testing new widgets safely. Changes here won't affect production functionality.
              </p>
            </div>
          </div>
        </div>

        {/* Widget Testing Area */}
        <div className="space-y-8">
          {/* Lloyds Data Import Section */}
          <LloydsDataImporter />
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">New Widget Test Area</h2>
              <div className="flex items-center space-x-4">
                {widgetEnabled && (
                  <div className="flex items-center space-x-2">
                    <label htmlFor="product-select" className="text-sm font-medium text-gray-700">
                      Test Product:
                    </label>
                    <select
                      id="product-select"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                      disabled={loading}
                    >
                      <option value="none">No Product (No Validation)</option>
                      {loading ? (
                        <option disabled>Loading products...</option>
                      ) : (
                        availableProducts.map((product) => {
                          const key = product.key.toLowerCase().replace(/[^a-z0-9]/g, '-');
                          return (
                            <option key={key} value={key}>
                              {product.bank_name} - {product.product_name}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>
                )}
                <button
                  onClick={() => setWidgetEnabled(!widgetEnabled)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    widgetEnabled 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {widgetEnabled ? 'Widget Enabled' : 'Enable Widget'}
                </button>
              </div>
            </div>

            {widgetEnabled ? (
              loading ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading products...</p>
                </div>
              ) : (
                <BetaCalibrationWizard
                  currentProduct={products[selectedProduct as keyof typeof products]}
                  onConfigChange={(config) => {
                    console.log('Beta config updated:', config);
                    console.log('Current product:', products[selectedProduct as keyof typeof products]);
                  }}
                  onClose={() => setWidgetEnabled(false)}
                  disabled={false}
                />
              )
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  Click "Enable Widget" above to activate the testing area.
                </p>
              </div>
            )}
          </div>

          {/* Development Notes */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Development Notes</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Test all widget states: loading, error, empty data, full data</li>
              <li>• Verify responsive design across different screen sizes</li>
              <li>• Check console for any errors or warnings</li>
              <li>• Test all interactive features and callbacks</li>
              <li>• Validate TypeScript interfaces and prop types</li>
              <li>• Ensure proper error boundaries and fallback states</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}