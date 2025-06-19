'use client';

import { useState } from 'react';

// Enhanced color mapping for products with variations for same bank
function getProductColor(bankCode: string, productName: string, index: number = 0): string {
  const bankBaseColors: { [key: string]: string[] } = {
    'HSBC': ['#DC143C', '#FF1744', '#C51162'],
    'BARCLAYS': ['#004B87', '#1565C0', '#0277BD'], 
    'NATWEST': ['#5B2C87', '#7B1FA2', '#8E24AA'],
    'SANTANDER': ['#EC1C24', '#F44336', '#E53935'],
    'LLOYDS': ['#006853', '#00796B', '#4CAF50'],
    'NATIONWIDE': ['#FFD320', '#FFC107', '#FF9800'],
    'CHASE': ['#117ACA', '#1976D2', '#2196F3'],
    'TSB': ['#0073BA', '#1976D2', '#42A5F5'],
    'MONZO': ['#EB008B', '#E91E63', '#AD1457']
  };
  
  const colors = bankBaseColors[bankCode] || ['#6B7280', '#9CA3AF', '#D1D5DB'];
  return colors[index % colors.length];
}

// Hierarchical Selector Component
const HierarchicalSelector = ({ data, selectedItems, setSelectedItems, expandedNodes, setExpandedNodes, showAverages }: any) => {
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev: any) => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const toggleSelection = (itemId: string) => {
    setSelectedItems((prev: string[]) => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Helper functions for folder-level selection
  const getAllTiersInCategory = (categoryData: any): string[] => {
    const items: string[] = [];
    Object.values(categoryData.banks).forEach((bank: any) => {
      Object.entries(bank.products).forEach(([productKey, product]: [string, any]) => {
        Object.keys(product.tiers).forEach((tierKey) => {
          if (tierKey === 'single') {
            items.push(productKey);
          } else {
            items.push(`${productKey}_${tierKey}`);
          }
        });
      });
    });
    return items;
  };

  const getAllTiersInBank = (bankData: any): string[] => {
    const items: string[] = [];
    Object.entries(bankData.products).forEach(([productKey, product]: [string, any]) => {
      Object.keys(product.tiers).forEach((tierKey) => {
        if (tierKey === 'single') {
          items.push(productKey);
        } else {
          items.push(`${productKey}_${tierKey}`);
        }
      });
    });
    return items;
  };

  const getAllTiersInProduct = (productKey: string, product: any): string[] => {
    const items: string[] = [];
    Object.keys(product.tiers).forEach((tierKey) => {
      if (tierKey === 'single') {
        items.push(productKey);
      } else {
        items.push(`${productKey}_${tierKey}`);
      }
    });
    return items;
  };

  const getSelectionState = (allItems: string[]): 'none' | 'some' | 'all' => {
    const selectedCount = allItems.filter(item => selectedItems.includes(item)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === allItems.length) return 'all';
    return 'some';
  };

  const toggleFolderSelection = (allItems: string[]) => {
    const state = getSelectionState(allItems);
    if (state === 'all') {
      // Unselect all
      setSelectedItems((prev: string[]) => prev.filter(item => !allItems.includes(item)));
    } else {
      // Select all
      setSelectedItems((prev: string[]) => [...new Set([...prev, ...allItems])]);
    }
  };

  return (
    <div className="p-6 overflow-y-auto max-h-96">
      <div className="space-y-2">
        {Object.entries(data).map(([categoryKey, categoryData]: [string, any]) => {
          const categoryItems = getAllTiersInCategory(categoryData);
          const categorySelectionState = getSelectionState(categoryItems);
          
          return (
            <div key={categoryKey} className="border border-gray-200 rounded-lg">
              {/* Category Level */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={categorySelectionState === 'all'}
                    ref={(el) => {
                      if (el) el.indeterminate = categorySelectionState === 'some';
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleFolderSelection(categoryItems);
                    }}
                    className="rounded border-gray-300"
                  />
                  <span 
                    className="text-lg cursor-pointer"
                    onClick={() => toggleNode(categoryKey)}
                  >
                    {expandedNodes[categoryKey] ? '📂' : '📁'}
                  </span>
                  <span className="font-semibold text-gray-900">{categoryData.name}</span>
                  <span className="text-sm text-gray-500">({Object.keys(categoryData.banks).length} banks)</span>
                </div>
              </div>

              {/* Banks Level */}
              {expandedNodes[categoryKey] && (
                <div className="pl-6 pb-3">
                  {Object.entries(categoryData.banks).map(([bankKey, bankData]: [string, any]) => {
                    const bankItems = getAllTiersInBank(bankData);
                    const bankSelectionState = getSelectionState(bankItems);
                    
                    return (
                      <div key={bankKey} className="mb-2">
                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={bankSelectionState === 'all'}
                              ref={(el) => {
                                if (el) el.indeterminate = bankSelectionState === 'some';
                              }}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleFolderSelection(bankItems);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span 
                              className="text-sm cursor-pointer"
                              onClick={() => toggleNode(`${categoryKey}_${bankKey}`)}
                            >
                              {expandedNodes[`${categoryKey}_${bankKey}`] ? '📂' : '📁'}
                            </span>
                            <span className="font-medium text-gray-800">{bankData.name}</span>
                            <span className="text-xs text-gray-500">({Object.keys(bankData.products).length} products)</span>
                          </div>
                        </div>

                        {/* Products Level */}
                        {expandedNodes[`${categoryKey}_${bankKey}`] && (
                          <div className="pl-6 space-y-1">
                            {Object.entries(bankData.products).map(([productKey, productData]: [string, any]) => {
                              const productItems = getAllTiersInProduct(productKey, productData);
                              const productSelectionState = getSelectionState(productItems);
                              
                              return (
                                <div key={productKey} className="border-l-2 border-gray-200 pl-3">
                                  <div className="flex items-center justify-between py-1">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={productSelectionState === 'all'}
                                        ref={(el) => {
                                          if (el) el.indeterminate = productSelectionState === 'some';
                                        }}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          toggleFolderSelection(productItems);
                                        }}
                                        className="rounded border-gray-300"
                                      />
                                      <span className="text-sm">💰</span>
                                      <span className="text-sm font-medium">{productData.name}</span>
                                      <span className="text-xs text-gray-500">{productData.rate}% AER</span>
                                    </div>
                                  </div>

                                  {/* Tiers Level */}
                                  <div className="pl-4 space-y-1">
                                    {Object.entries(productData.tiers).map(([tierKey, tierData]: [string, any]) => {
                                      const fullTierKey = `${productKey}_${tierKey}`;
                                      const isSelected = selectedItems.includes(fullTierKey);
                                      
                                      return (
                                        <label key={tierKey} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelection(fullTierKey)}
                                            className="rounded border-gray-300"
                                          />
                                          <span className="text-xs">🏷️</span>
                                          <span>{tierKey === 'single' ? 'Standard Rate' : `Tier ${tierKey.split('_')[1]}`}</span>
                                          <span className="text-gray-500">({tierData.range})</span>
                                          <span className="text-gray-600">{tierData.rate.toFixed(2)}%</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Faceted Selector Component
const FacetedSelector = ({ data, selectedItems, setSelectedItems, showAverages }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredData = data.filter((item: any) => {
    const searchMatch = !searchTerm || item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       item.bankName.toLowerCase().includes(searchTerm.toLowerCase());
    const bankMatch = !filterBank || item.bankCode === filterBank;
    const categoryMatch = !filterCategory || item.category === filterCategory;
    
    // Debug logging when bank filter is active
    if (filterBank) {
      console.log(`Filtering: ${item.bankName} (${item.bankCode}) - Bank filter: ${filterBank} - Match: ${bankMatch}`);
    }
    
    return searchMatch && bankMatch && categoryMatch;
  });

  const toggleSelection = (itemId: string) => {
    setSelectedItems((prev: string[]) => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="p-6">
      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <select 
          value={filterBank} 
          onChange={(e) => setFilterBank(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Banks</option>
          {Array.from(new Map(data.map((item: any) => [item.bankCode, item.bankName])).entries()).map(([bankCode, bankName]) => (
            <option key={bankCode} value={bankCode}>{bankName} ({bankCode})</option>
          ))}
        </select>
        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Categories</option>
          {Array.from(new Set(data.map((item: any) => item.category))).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredData.map((item: any) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: getProductColor(item.bankCode, item.productName, 0) }}
                ></div>
                <div>
                  <div className="font-medium text-gray-900">{item.bankCode} - {item.productName}</div>
                  <div className="text-sm text-gray-500">{item.category} • {item.productType?.replace(/_/g, ' ')}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{item.rate.toFixed(2)}% AER</div>
              </div>
            </div>

            {/* Tier Selection */}
            <div className="flex flex-wrap gap-2">
              {item.tiers.map((tier: any) => {
                const isSelected = selectedItems.includes(tier.id);
                return (
                  <label key={tier.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(tier.id)}
                      className="rounded border-gray-300"
                    />
                    <span className={`px-2 py-1 text-xs rounded ${
                      isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tier.name} ({tier.range}) - {tier.rate.toFixed(2)}%
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-sm text-gray-500 mt-4">
        Showing {filteredData.length} of {data.length} products
      </div>
    </div>
  );
};

interface Props {
  show: boolean;
  onClose: () => void;
  onApply: (selectedItems: string[], showAverages: boolean) => void;
  hierarchicalData: any;
  facetedData: any[];
}

export function ProductSelectionModal({ show, onClose, onApply, hierarchicalData, facetedData }: Props) {
  const [selectionMode, setSelectionMode] = useState<'hierarchy' | 'faceted'>('hierarchy');
  const [expandedNodes, setExpandedNodes] = useState<{[key: string]: boolean}>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAverages, setShowAverages] = useState(true);

  if (!show) return null;

  // Helper functions for Select All
  const getAllHierarchicalItems = (data: any): string[] => {
    const items: string[] = [];
    Object.values(data).forEach((category: any) => {
      Object.values(category.banks).forEach((bank: any) => {
        Object.entries(bank.products).forEach(([productKey, product]: [string, any]) => {
          Object.keys(product.tiers).forEach((tierKey) => {
            if (tierKey === 'single') {
              items.push(productKey);
            } else {
              items.push(`${productKey}_${tierKey}`);
            }
          });
        });
      });
    });
    console.log('getAllHierarchicalItems generated:', items);
    return items;
  };

  const getAllFacetedItems = (data: any[]): string[] => {
    const items: string[] = [];
    data.forEach((product) => {
      product.tiers.forEach((tier: any) => {
        items.push(tier.id);
      });
    });
    console.log('getAllFacetedItems generated:', items);
    return items;
  };

  // Function to synchronize selections between hierarchy and faceted modes
  const synchronizeSelections = (targetMode: 'hierarchy' | 'faceted') => {
    const currentMode = selectionMode;
    console.log(`Synchronizing selections from ${currentMode} to ${targetMode}`);
    console.log('Current selections:', selectedItems);
    
    if (currentMode === targetMode) return; // No sync needed
    
    // Create mapping between hierarchy and faceted item IDs
    const synchronizedItems: string[] = [];
    
    selectedItems.forEach(itemId => {
      if (targetMode === 'faceted') {
        // Converting from hierarchy to faceted
        // Find corresponding faceted items
        facetedData.forEach(product => {
          product.tiers.forEach((tier: any) => {
            // Check if this tier corresponds to the hierarchy selection
            if (tier.id === itemId || 
                tier.id.replace('tier', 'tier_') === itemId ||
                tier.id.replace('_tier', '_tier_') === itemId) {
              synchronizedItems.push(tier.id);
            }
          });
        });
      } else {
        // Converting from faceted to hierarchy
        // Find corresponding hierarchy items
        const facetedItem = facetedData.find(product => 
          product.tiers.some((tier: any) => tier.id === itemId)
        );
        
        if (facetedItem) {
          const tier = facetedItem.tiers.find((t: any) => t.id === itemId);
          if (tier) {
            // Map to hierarchy format
            const hierarchyId = tier.id.replace('tier', 'tier_');
            synchronizedItems.push(hierarchyId);
          }
        }
      }
    });
    
    // Remove duplicates and update selections
    const uniqueSyncedItems = [...new Set(synchronizedItems)];
    console.log('Synchronized selections:', uniqueSyncedItems);
    setSelectedItems(uniqueSyncedItems);
  };

  // Function to add average calculations for related tiers
  const addAverageCalculations = (products: string[]): string[] => {
    const result = [...products];
    
    // Group products by base product (without tier suffix)
    const productGroups: {[baseProduct: string]: string[]} = {};
    
    products.forEach(productKey => {
      const baseKey = productKey.replace(/_tier\d+$/, '');
      if (!productGroups[baseKey]) {
        productGroups[baseKey] = [];
      }
      productGroups[baseKey].push(productKey);
    });
    
    // Add average for groups with multiple tiers
    Object.entries(productGroups).forEach(([baseKey, tiers]) => {
      if (tiers.length > 1) {
        const averageKey = `${baseKey}_average`;
        result.push(averageKey);
        console.log(`Added average for ${baseKey}: ${averageKey} (combining ${tiers.length} tiers)`);
      }
    });
    
    return result;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Product & Tier Selection</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          
          {/* Selection Mode Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  if (selectionMode === 'faceted' && selectedItems.length > 0) {
                    // Show confirmation when switching with selections
                    if (window.confirm('Switching modes will synchronize your selections. Some items may appear differently. Continue?')) {
                      synchronizeSelections('hierarchy');
                      setSelectionMode('hierarchy');
                    }
                  } else {
                    setSelectionMode('hierarchy');
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectionMode === 'hierarchy' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📁 Browse by Category
              </button>
              <button
                onClick={() => {
                  if (selectionMode === 'hierarchy' && selectedItems.length > 0) {
                    // Show confirmation when switching with selections
                    if (window.confirm('Switching modes will synchronize your selections. Some items may appear differently. Continue?')) {
                      synchronizeSelections('faceted');
                      setSelectionMode('faceted');
                    }
                  } else {
                    setSelectionMode('faceted');
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectionMode === 'faceted' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔍 Search & Filter
              </button>
            </div>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showAverages}
                onChange={(e) => setShowAverages(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Auto-calculate averages</span>
            </label>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {selectionMode === 'hierarchy' ? (
            <HierarchicalSelector 
              data={hierarchicalData}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              expandedNodes={expandedNodes}
              setExpandedNodes={setExpandedNodes}
              showAverages={showAverages}
            />
          ) : (
            <FacetedSelector 
              data={facetedData}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              showAverages={showAverages}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Selected: {selectedItems.length} items
                {showAverages && selectedItems.length > 1 && (
                  <span className="ml-2 text-blue-600">(+ averages will be calculated)</span>
                )}
                {selectedItems.length > 0 && (
                  <div className="ml-3 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    💡 Selections sync between modes
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Select all available items based on current selection mode
                    const allItems = selectionMode === 'hierarchy' 
                      ? getAllHierarchicalItems(hierarchicalData)
                      : getAllFacetedItems(facetedData);
                    
                    console.log('=== SELECT ALL DEBUG ===');
                    console.log('Selection mode:', selectionMode);
                    console.log('All items to select:', allItems.length, 'items');
                    console.log('First 5 items:', allItems.slice(0, 5));
                    
                    // Limit to prevent chart performance issues
                    const maxItems = 15;
                    if (allItems.length > maxItems) {
                      if (window.confirm(`This will select ${allItems.length} items, which may impact performance. Select first ${maxItems} items instead?`)) {
                        setSelectedItems(allItems.slice(0, maxItems));
                      } else {
                        setSelectedItems(allItems);
                      }
                    } else {
                      setSelectedItems(allItems);
                    }
                  }}
                  className="px-3 py-1 text-xs border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                >
                  Select All
                </button>
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setSelectedItems([])}
                    className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('=== APPLY SELECTION DEBUG ===');
                  console.log('Selected items from modal:', selectedItems);
                  
                  // Convert selected items to the format expected by the chart
                  const mappedProducts = selectedItems.map(itemId => {
                    console.log('Processing itemId:', itemId);
                    
                    // Handle different item ID formats from hierarchical vs faceted selectors
                    if (itemId.includes('_tier')) {
                      // This is a tier selection from faceted selector - keep the tier info
                      console.log('  -> Tier selection, keeping as:', itemId);
                      return itemId;
                    } else if (itemId.includes('_')) {
                      // This is a product selection
                      console.log('  -> Product selection, keeping as:', itemId);
                      return itemId;
                    } else {
                      // This might be a hierarchical selection, need to map to product key
                      const item = facetedData.find(p => p.id === itemId);
                      const result = item ? item.selectionKey : itemId;
                      console.log('  -> Hierarchical selection, mapped to:', result);
                      return result;
                    }
                  }).filter(Boolean);
                  
                  console.log('Mapped products before deduplication:', mappedProducts);
                  
                  // Remove duplicates and set products
                  const uniqueProducts = [...new Set(mappedProducts)];
                  console.log('Final unique products:', uniqueProducts);
                  
                  // Add averages if enabled
                  const finalProducts = showAverages ? addAverageCalculations(uniqueProducts) : uniqueProducts;
                  console.log('Final products with averages:', finalProducts);
                  
                  onApply(finalProducts, showAverages);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Selection ({selectedItems.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}