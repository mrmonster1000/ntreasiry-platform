'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from '@/components/DashboardStats';
import { AllProductsTable } from '@/components/AllProductsTable';
import { QuickActions } from '@/components/QuickActions';
import { ProductRatesChart } from '@/components/ProductRatesChart';
import { MarketCommentary } from '@/components/MarketCommentary';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['major_banks', 'building_societies', 'challenger_banks']);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats,
  });

  const { data: latestRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['latest-rates', selectedDate, selectedCategories],
    queryFn: () => api.getLatestRates(selectedDate, selectedCategories),
  });

  const { data: spreads, isLoading: spreadsLoading } = useQuery({
    queryKey: ['spreads', selectedDate],
    queryFn: () => api.getSpreads(selectedDate),
  });

  const { data: completeness, isLoading: completenessLoading } = useQuery({
    queryKey: ['completeness-summary', selectedDate],
    queryFn: () => api.getCompletenessSummary(selectedDate),
  });

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
                  <span className="text-gray-300 text-sm font-semibold uppercase tracking-wider">Live Intelligence</span>
                </div>
                <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  neuro-treasury market intelligence
                </h1>
                <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
                  Advanced analytics platform for UK banking market intelligence, powered by Claude AI 
                  for real-time savings rate monitoring and analysis.
                </p>
                <div className="flex items-center space-x-6 pt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm font-medium">Real-time Monitoring</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm font-medium">Market Analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm font-medium">Claude AI Enhanced</span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-3">
                <div className="bg-gray-900 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
                  <div className="text-4xl font-black text-white">
                    {stats?.totalBanks || 9}
                  </div>
                  <div className="text-gray-300 text-sm font-semibold uppercase tracking-wider">Banks Monitored</div>
                  <div className="text-xs text-gray-400 mt-1">Real-time Surveillance</div>
                </div>
                <div className="bg-gray-900 backdrop-blur-xl rounded-2xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-white">
                    {stats?.totalProducts || 'Loading...'}
                  </div>
                  <div className="text-gray-300 text-xs font-medium">Active Products</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
        </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Dashboard Stats */}
      <DashboardStats stats={stats} isLoading={statsLoading} />

      {/* AI Market Commentary */}
      <MarketCommentary />

      {/* Completeness Summary */}
      {completeness && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Extraction Completeness Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-700">
                {completeness.overall.total_products_extracted}
              </div>
              <div className="text-sm text-gray-600">Products Extracted</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">
                {completeness.overall.products_found}
              </div>
              <div className="text-sm text-gray-600">Products Found</div>
            </div>
            <div className="bg-lime-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-lime-700">
                {completeness.overall.total_expected_products}
              </div>
              <div className="text-sm text-gray-600">Expected Products</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-700">
                {completeness.overall.completeness_percentage}%
              </div>
              <div className="text-sm text-gray-600">Completeness</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completeness.by_category.map((cat) => (
              <div key={cat.category} className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {cat.category.replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {cat.products_found}/{cat.products_expected} products ({cat.completeness_percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Rate Ranges - Full Width */}
      <div>
        <ProductRatesChart
          selectedDate={selectedDate}
        />
      </div>

      {/* All Products Table - Full Width */}
      <div>
        <AllProductsTable
          selectedDate={selectedDate}
          selectedCategories={selectedCategories}
          compact={false}
        />
      </div>
      </div>
    </div>
  );
}