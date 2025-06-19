'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type BankCategories } from '@/lib/api';

interface BankCategoryToggleProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  className?: string;
}

const categoryLabels = {
  major_banks: 'Major Banks',
  building_societies: 'Building Societies', 
  challenger_banks: 'Challenger Banks',
  digital_banks: 'Digital Banks',
  traditional_banks: 'Traditional Banks',
  app_based: 'App-Based'
};

export function BankCategoryToggle({ 
  selectedCategories, 
  onCategoriesChange, 
  className = "" 
}: BankCategoryToggleProps) {
  const { data: categories } = useQuery<BankCategories>({
    queryKey: ['bank-categories'],
    queryFn: api.getBankCategories,
  });

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const selectAll = () => {
    if (categories) {
      onCategoriesChange(Object.keys(categories));
    }
  };

  const clearAll = () => {
    onCategoriesChange([]);
  };

  if (!categories) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Bank Categories:
        </label>
        <div className="flex space-x-2">
          <button
            onClick={selectAll}
            className="text-xs text-primary-600 hover:text-primary-800 underline"
          >
            All
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-gray-600 hover:text-gray-800 underline"
          >
            None
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Object.entries(categories).map(([category, bankCodes]) => (
          <label
            key={category}
            className="flex items-center space-x-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedCategories.includes(category)}
              onChange={() => handleCategoryToggle(category)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-gray-700">
              {categoryLabels[category as keyof typeof categoryLabels]} ({bankCodes.length})
            </span>
          </label>
        ))}
      </div>

      {selectedCategories.length > 0 && (
        <div className="text-xs text-gray-600">
          Showing {selectedCategories.length} of {Object.keys(categories).length} categories
        </div>
      )}
    </div>
  );
}