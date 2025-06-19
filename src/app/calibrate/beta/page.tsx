'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BetaCalibrationChart } from '@/components/beta/BetaCalibrationChart';
import { ProductSelectionModal } from '@/components/beta/ProductSelectionModal';
import { BetaHistoryTable } from '@/components/beta/BetaHistoryTable';
import { BetaAverageTableSimple } from '@/components/beta/BetaAverageTableSimple';

export default function CalibrateBetaPage() {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [groupingMode, setGroupingMode] = useState<'categories' | 'manual'>('categories');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Big 4', 'Challengers', 'Building Societies']);

  // Bank categories for aggregation (updated to match our actual data)
  const bankCategories = {
    'Big 4': ['HSBC', 'BARCLAYS', 'LLOYDS', 'NATWEST'],
    'Challengers': ['CHALLENGERS'], // App-based challengers in our data
    'Building Societies': ['NATIONWIDE'],
    'Traditional': ['SANTANDER'],
    'Digital Banks': [] // No digital banks in current dataset
  };

  // Fetch latest rates to get products
  const { data: latestRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['latest-rates', selectedDate],
    queryFn: () => api.getLatestRates(selectedDate, []),
  });

  // Build hierarchical data structure for product selection
  const buildHierarchicalData = () => {
    if (!latestRates) return {};
    
    const hierarchy: any = {};
    
    // Group by bank category first
    Object.entries(bankCategories).forEach(([categoryName, bankCodes]) => {
      hierarchy[categoryName] = {
        type: 'category',
        name: categoryName,
        banks: {}
      };
      
      bankCodes.forEach(bankCode => {
        const bankProducts = latestRates.filter(r => r.bank_code === bankCode);
        if (bankProducts.length > 0) {
          hierarchy[categoryName].banks[bankCode] = {
            type: 'bank',
            name: bankProducts[0].bank_name,
            code: bankCode,
            products: {}
          };
          
          // Group products by product name
          const productGroups = bankProducts.reduce((acc: any, rate) => {
            if (!acc[rate.product_name]) {
              acc[rate.product_name] = [];
            }
            acc[rate.product_name].push(rate);
            return acc;
          }, {});
          
          Object.entries(productGroups).forEach(([productName, rates]: [string, any[]]) => {
            const productKey = `${bankCode}_${productName}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
            hierarchy[categoryName].banks[bankCode].products[productKey] = {
              type: 'product',
              name: productName,
              productType: rates[0].product_type,
              rate: rates[0].current_effective_rate,
              tiers: productName === 'Rainy Day Saver' && bankCode === 'BARCLAYS' ? {
                'tier_1': { rate: 1.05, range: '£1-5k' },
                'tier_2': { rate: 4.52, range: '£5k+' }
              } : rates.length > 1 ? {
                'tier_1': { rate: rates[0].current_effective_rate, range: '£1-5k' },
                'tier_2': { rate: rates[0].current_effective_rate * 0.95, range: '£5k+' }
              } : {
                'single': { rate: rates[0].current_effective_rate, range: 'All balances' }
              }
            };
          });
        }
      });
    });
    
    return hierarchy;
  };

  // Build faceted data structure for search/filter
  const buildFacetedData = () => {
    if (!latestRates) return [];
    
    return latestRates.map((rate, index) => {
      const productKey = `${rate.bank_code}_${rate.product_name}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const category = Object.entries(bankCategories).find(([_, banks]) => 
        banks.includes(rate.bank_code)
      )?.[0] || 'Other';
      
      return {
        id: productKey,
        selectionKey: productKey,
        category,
        bankCode: rate.bank_code,
        bankName: rate.bank_name,
        productName: rate.product_name,
        productType: rate.product_type,
        rate: rate.current_effective_rate,
        // Real tier data for Barclays Rainy Day Saver based on actual product structure
        tiers: rate.product_name === 'Rainy Day Saver' && rate.bank_code === 'BARCLAYS' ? [
          { id: `${productKey}_tier1`, name: 'Tier 1', rate: 1.05, range: '£1-5k' },
          { id: `${productKey}_tier2`, name: 'Tier 2', rate: 4.52, range: '£5k+' }
        ] : [
          { id: productKey, name: 'Standard', rate: rate.current_effective_rate, range: 'All balances' }
        ]
      };
    });
  };

  const hierarchicalData = buildHierarchicalData();
  const facetedData = buildFacetedData();

  const handleSelectionModalApply = (selectedItems: string[], showAverages: boolean) => {
    console.log('Applying selection:', selectedItems);
    setSelectedProducts(selectedItems);
    setGroupingMode('manual');
    setShowSelectionModal(false);
  };

  if (ratesLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading beta calibration interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="space-y-8 p-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-black rounded-3xl shadow-2xl border border-gray-800">
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm font-semibold uppercase tracking-wider">Historical Rate Analysis</span>
                </div>
                <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Beta Calibration
                </h1>
                <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
                  Historical rate movements showing product rates vs Bank of England base rate over time.
                </p>
              </div>
              <div className="text-right space-y-3">
                <div className="bg-gray-900 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
                  <div className="text-4xl font-black text-white">
                    {latestRates?.length || 0}
                  </div>
                  <div className="text-gray-300 text-sm font-semibold uppercase tracking-wider">Products</div>
                  <div className="text-xs text-gray-400 mt-1">Available for Analysis</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
        </div>

        {/* Beta Calibration Chart Widget */}
        <BetaCalibrationChart
          latestRates={latestRates || []}
          selectedProducts={selectedProducts}
          selectedCategories={selectedCategories}
          groupingMode={groupingMode}
          onSelectionChange={() => setShowSelectionModal(true)}
        />

        {/* Beta History Table Widget */}
        <BetaHistoryTable
          selectedBanks={Object.entries(bankCategories)
            .filter(([category]) => selectedCategories.includes(category))
            .flatMap(([_, banks]) => banks)
          }
          selectedCategories={selectedCategories}
          selectedProducts={selectedProducts}
          timeWindow={90}
          groupingThreshold={7}
          enableGrouping={false}
          forwardLookingDays={90}
          onSelectionChange={() => setShowSelectionModal(true)}
        />

        {/* Beta Average Table Widget (Simple Version) */}
        <BetaAverageTableSimple
          selectedBanks={Object.entries(bankCategories)
            .filter(([category]) => selectedCategories.includes(category))
            .flatMap(([_, banks]) => banks)
          }
          selectedCategories={selectedCategories}
          selectedProducts={selectedProducts}
          onSelectionChange={() => setShowSelectionModal(true)}
        />

        {/* Product Selection Modal Widget */}
        <ProductSelectionModal
          show={showSelectionModal}
          onClose={() => setShowSelectionModal(false)}
          onApply={handleSelectionModalApply}
          hierarchicalData={hierarchicalData}
          facetedData={facetedData}
        />
      </div>
    </div>
  );
}