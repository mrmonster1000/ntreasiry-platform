'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BuildingLibraryIcon, 
  LinkIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

interface AllProductsTableProps {
  selectedDate?: string;
  selectedCategories?: string[];
  compact?: boolean; // For dashboard use
}

export function AllProductsTable({ selectedDate, selectedCategories, compact = false }: AllProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'bank' | 'product' | 'min_rate' | 'max_rate' | 'type' | 'spread'>('max_rate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [selectedProductType, setSelectedProductType] = useState<string>('all');

  // Use detailed product rates to get min/max rate information
  const { data: productRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['product-rates-table', selectedDate, selectedBanks, selectedProductType],
    queryFn: () => api.getProductRates({
      banks: selectedBanks.length > 0 ? selectedBanks : 'all',
      productType: selectedProductType,
      extractionDate: selectedDate
    }),
  });

  const { data: masterCatalogue } = useQuery({
    queryKey: ['master-catalogue'],
    queryFn: api.getMasterCatalogue,
  });

  const getProductUrl = (bankName: string, productName: string) => {
    return masterCatalogue?.find(p => 
      p.bank_name === bankName && 
      p.product_name.toLowerCase().includes(productName.toLowerCase())
    )?.product_url;
  };

  // Get available filter options
  const availableBanks = productRates ? 
    Array.from(new Set(productRates.map(p => p.bank_code))).sort() : [];
  
  const availableProductTypes = productRates ? 
    Array.from(new Set(productRates.map(p => p.product_type))).sort() : [];

  // Add spread calculation and filter/sort data
  const filteredAndSortedRates = productRates
    ?.map(product => ({
      ...product,
      spread: product.max_rate - product.min_rate
    }))
    ?.filter(rate => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        rate.bank_name.toLowerCase().includes(search) ||
        rate.product_name.toLowerCase().includes(search) ||
        rate.product_type.toLowerCase().includes(search)
      );
    })
    ?.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'bank':
          comparison = a.bank_name.localeCompare(b.bank_name);
          break;
        case 'product':
          comparison = a.product_name.localeCompare(b.product_name);
          break;
        case 'min_rate':
          comparison = a.min_rate - b.min_rate;
          break;
        case 'max_rate':
          comparison = a.max_rate - b.max_rate;
          break;
        case 'spread':
          comparison = a.spread - b.spread;
          break;
        case 'type':
          comparison = a.product_type.localeCompare(b.product_type);
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    }) || [];

  const handleSort = (column: 'bank' | 'product' | 'min_rate' | 'max_rate' | 'type' | 'spread') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection(['min_rate', 'max_rate', 'spread'].includes(column) ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ column }: { column: 'bank' | 'product' | 'min_rate' | 'max_rate' | 'type' | 'spread' }) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? 
      <ArrowUpIcon className="w-4 h-4 inline ml-1" /> : 
      <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  if (ratesLoading) {
    return (
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-white">All Products</h3>
          <p className="text-sm text-gray-300 mt-1">Complete list of all monitored savings products</p>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(compact ? 5 : 10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayRates = compact ? filteredAndSortedRates.slice(0, 10) : filteredAndSortedRates;

  return (
    <div className="relative overflow-hidden bg-black rounded-3xl shadow-2xl border border-gray-800">
      <div className="relative px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">All Products</h3>
            <p className="text-sm text-gray-300 mt-1">
              {compact ? 'Top 10 products by rate' : 'Complete list of all monitored savings products'}
            </p>
          </div>
          <div className="text-sm text-gray-300">
            Showing {filteredAndSortedRates.length} products
          </div>
        </div>
        
        {/* Enhanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Product Type Filter */}
          <div>
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Product Types</option>
              {availableProductTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Bank Filter */}
          <div>
            <select
              multiple
              value={selectedBanks}
              onChange={(e) => setSelectedBanks(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              size={3}
            >
              {availableBanks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
            {selectedBanks.length > 0 && (
              <button
                onClick={() => setSelectedBanks([])}
                className="text-xs text-emerald-600 hover:text-emerald-800 mt-1"
              >
                Clear banks ({selectedBanks.length} selected)
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setSortBy('max_rate');
                setSortDirection('desc');
              }}
              className="w-full text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md hover:bg-emerald-100"
            >
              Top Rates
            </button>
            <button
              onClick={() => {
                setSortBy('spread');
                setSortDirection('desc');
              }}
              className="w-full text-xs bg-lime-50 text-lime-700 px-3 py-1 rounded-md hover:bg-lime-100"
            >
              Biggest Spreads
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('bank')}
              >
                Bank <SortIcon column="bank" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('product')}
              >
                Product <SortIcon column="product" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('type')}
              >
                Type <SortIcon column="type" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('min_rate')}
              >
                Min Rate <SortIcon column="min_rate" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('max_rate')}
              >
                Max Rate <SortIcon column="max_rate" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('spread')}
              >
                Spread <SortIcon column="spread" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Tiers
              </th>
            </tr>
          </thead>
          <tbody className="bg-emerald-950 divide-y divide-emerald-800">
            {displayRates.map((rate, index) => (
              <tr key={index} className="hover:bg-emerald-900 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <BuildingLibraryIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-white">
                      {rate.bank_name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-white">{rate.product_name}</div>
                    {getProductUrl(rate.bank_name, rate.product_name) && (
                      <a
                        href={getProductUrl(rate.bank_name, rate.product_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {rate.product_type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {rate.min_rate.toFixed(2)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-emerald-400">
                    {rate.max_rate.toFixed(2)}%
                  </div>
                  {rate.max_rate > rate.min_rate + 0.1 && (
                    <div className="text-xs text-lime-400">
                      Best rate
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {rate.spread > 0.01 ? (
                      <span className="text-lime-400 font-medium">
                        {rate.spread.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        Fixed
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <span className="inline-flex px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full">
                    {rate.tier_count} tier{rate.tier_count !== 1 ? 's' : ''}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {compact && filteredAndSortedRates.length > 10 && (
        <div className="px-6 py-3 bg-gray-800 border-t border-gray-700 text-center">
          <span className="text-sm text-gray-300">
            Showing top 10 of {filteredAndSortedRates.length} products
          </span>
        </div>
      )}
      
      {/* Subtle glow effect */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
    </div>
  );
}