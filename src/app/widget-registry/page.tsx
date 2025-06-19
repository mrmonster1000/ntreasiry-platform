'use client';

import { useEffect, useState } from 'react';
import { DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function WidgetRegistryPage() {
  const [registryContent, setRegistryContent] = useState('Loading widget registry...');

  useEffect(() => {
    // Read the WIDGET_REGISTRY.md file content
    fetch('/WIDGET_REGISTRY.md')
      .then(response => response.text())
      .then(content => setRegistryContent(content))
      .catch(error => {
        console.error('Failed to load widget registry:', error);
        setRegistryContent(`# Widget Registry

This file documents all reusable widgets/components in the nrates application to maintain clear documentation and prevent disasters.

## Widget Documentation

| Widget Name | File Path | Purpose | Inputs | Outputs | Dependencies |
|-------------|-----------|---------|--------|---------|-----------------|
| **BetaCalibrationChart** | \`/src/components/beta/BetaCalibrationChart.tsx\` | Interactive time series chart showing Bank of England base rate vs product rates with beta calculations | \`latestRates: any[]\` - Product rate data<br/>\`selectedProducts: string[]\` - Selected product keys<br/>\`selectedCategories: string[]\` - Selected bank categories<br/>\`groupingMode: string\` - Chart grouping mode<br/>\`onSelectionChange: () => void\` - Callback for product selection | Renders time series chart with Recharts LineChart component | \`@tanstack/react-query\`, \`recharts\`, \`@/lib/api\` |
| **ProductSelectionModal** | \`/src/components/beta/ProductSelectionModal.tsx\` | Modal for selecting products and tiers with hierarchical browsing and faceted search | \`show: boolean\` - Modal visibility<br/>\`onClose: () => void\` - Close callback<br/>\`onApply: (selectedItems: string[], showAverages: boolean) => void\` - Apply callback<br/>\`hierarchicalData: any\` - Hierarchical product data<br/>\`facetedData: any[]\` - Flat product data for search | Calls \`onApply\` with selected product IDs and average preference | None (pure React component) |

## Widget Creation Guidelines

When creating new widgets:

1. **Document immediately** - Add entry to this table when creating the widget
2. **Clear interfaces** - Define precise TypeScript interfaces for props
3. **Single responsibility** - Each widget should have one clear purpose
4. **Reusable** - Design for reuse across different pages
5. **Self-contained** - Minimize external dependencies where possible

## Recent Changes

- **2025-06-10**: Created initial widget registry
- **2025-06-10**: Extracted beta calibration chart and product selection modal from main page`);
      });
  }, []);

  // Simple markdown-to-HTML renderer for the registry content
  const renderMarkdown = (content: string) => {
    // Basic markdown parsing for headers, lists, tables, and code blocks
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold text-gray-900 mb-4">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-semibold text-gray-800 mt-8 mb-4">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold text-gray-700 mt-6 mb-3">{line.substring(4)}</h3>;
        }
        
        // Code blocks (backticks)
        if (line.trim().startsWith('`') && line.trim().endsWith('`') && !line.includes('|')) {
          const code = line.trim().substring(1, line.trim().length - 1);
          return <code key={index} className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{code}</code>;
        }
        
        // Lists
        if (line.trim().startsWith('- ')) {
          return (
            <li key={index} className="ml-6 text-gray-700">
              {line.substring(line.indexOf('- ') + 2)}
            </li>
          );
        }
        if (/^\d+\./.test(line.trim())) {
          return (
            <li key={index} className="ml-6 text-gray-700 list-decimal">
              {line.substring(line.indexOf('. ') + 2)}
            </li>
          );
        }
        
        // Table headers
        if (line.includes('|') && line.includes('---')) {
          return null; // Skip table separator lines
        }
        
        // Table rows
        if (line.includes('|') && line.trim() !== '') {
          const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
          const isHeader = line.includes('Widget Name') || line.includes('File Path');
          
          return (
            <tr key={index} className={isHeader ? 'bg-gray-50' : 'hover:bg-gray-50'}>
              {cells.map((cell, cellIndex) => {
                const Tag = isHeader ? 'th' : 'td';
                return (
                  <Tag 
                    key={cellIndex} 
                    className={`px-4 py-3 text-left border-b border-gray-200 ${
                      isHeader ? 'font-semibold text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {/* Handle code formatting within cells */}
                    {cell.includes('`') ? (
                      <span dangerouslySetInnerHTML={{
                        __html: cell.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
                      }} />
                    ) : cell.includes('**') ? (
                      <span dangerouslySetInnerHTML={{
                        __html: cell.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                      }} />
                    ) : (
                      cell
                    )}
                  </Tag>
                );
              })}
            </tr>
          );
        }
        
        // Regular paragraphs
        if (line.trim() !== '') {
          return <p key={index} className="text-gray-700 mb-4 leading-relaxed">{line}</p>;
        }
        
        return null;
      })
      .filter(element => element !== null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <a 
              href="/settings"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Settings
            </a>
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Widget Registry</h1>
            </div>
          </div>
          <p className="text-gray-600 max-w-3xl">
            Complete documentation of all reusable widgets and components in the nrates application. 
            This registry helps maintain clear interfaces and prevents architectural disasters by 
            providing a central reference for all widget specifications.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            
            {/* Check if we have table content */}
            {registryContent.includes('|') ? (
              <div>
                <div className="mb-6">
                  {renderMarkdown(registryContent.split('| Widget Name |')[0])}
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full">
                    <tbody>
                      {renderMarkdown(registryContent)}
                    </tbody>
                  </table>
                </div>
                
                {/* Rest of content after table */}
                <div>
                  {renderMarkdown(registryContent.split('## Widget Creation Guidelines')[1] ? 
                    '## Widget Creation Guidelines' + registryContent.split('## Widget Creation Guidelines')[1] : '')}
                </div>
              </div>
            ) : (
              // Fallback for non-table content
              <div className="prose max-w-none">
                {renderMarkdown(registryContent)}
              </div>
            )}
            
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Widget Registry • Last updated: June 10, 2025 • 
            <a href="/settings" className="text-blue-600 hover:text-blue-800 ml-1">Return to Settings</a>
          </p>
        </div>

      </div>
    </div>
  );
}