'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CogIcon,
  ServerIcon,
  ClockIcon,
  BellIcon,
  KeyIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  TableCellsIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowUpTrayIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { api, HistoricalDataEntry } from '@/lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedBank, setSelectedBank] = useState('HSBC');
  const [promptContent, setPromptContent] = useState('');
  
  // Historical data management state
  const [showAddHistoricalData, setShowAddHistoricalData] = useState(false);
  const [historicalDataForm, setHistoricalDataForm] = useState({
    bank_code: 'HSBC',
    product_name: '',
    product_type: 'instant_access_savings',
    rate: '',
    date: '',
    notes: ''
  });
  
  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: api.getSystemHealth,
  });

  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: api.getBanks,
  });

  const { data: masterCatalogue = [] } = useQuery({
    queryKey: ['master-catalogue'],
    queryFn: api.getMasterCatalogue,
  });

  const { data: historicalData = [], refetch: refetchHistoricalData } = useQuery({
    queryKey: ['historical-data'],
    queryFn: api.getHistoricalData,
    enabled: activeTab === 'historical',
  });

  const bankCodes = ['HSBC', 'BARCLAYS', 'CHASE', 'LLOYDS', 'NATIONWIDE', 'NATWEST', 'SANTANDER', 'TSB', 'CHALLENGERS'];

  const loadPrompt = async (bankCode: string) => {
    try {
      const promptData = await api.getPrompt(bankCode);
      setPromptContent(promptData.content);
    } catch (error) {
      console.error('Failed to load prompt:', error);
      setPromptContent(`// Failed to load prompt for ${bankCode}`);
    }
  };

  const savePrompt = async () => {
    try {
      await api.updatePrompt(selectedBank, promptContent);
      // You could add a toast notification here
      console.log('Prompt saved successfully');
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  const testPrompt = async () => {
    try {
      const result = await api.testPrompt(selectedBank, promptContent);
      console.log('Test result:', result);
      // You could show test results in a modal or notification
    } catch (error) {
      console.error('Failed to test prompt:', error);
    }
  };

  const handleAddHistoricalData = async () => {
    try {
      if (!historicalDataForm.bank_code || !historicalDataForm.product_name || 
          !historicalDataForm.product_type || !historicalDataForm.rate || !historicalDataForm.date) {
        alert('Please fill in all required fields');
        return;
      }

      await api.addHistoricalData({
        bank_code: historicalDataForm.bank_code,
        product_name: historicalDataForm.product_name,
        product_type: historicalDataForm.product_type,
        rate: parseFloat(historicalDataForm.rate),
        date: historicalDataForm.date,
        notes: historicalDataForm.notes || ''
      });

      // Reset form and refresh data
      setHistoricalDataForm({
        bank_code: 'HSBC',
        product_name: '',
        product_type: 'instant_access_savings',
        rate: '',
        date: '',
        notes: ''
      });
      setShowAddHistoricalData(false);
      refetchHistoricalData();
      alert('Historical data entry added successfully!');
    } catch (error) {
      console.error('Failed to add historical data:', error);
      alert('Failed to add historical data entry');
    }
  };

  const handleDeleteHistoricalData = async (id: number) => {
    if (!confirm('Are you sure you want to delete this historical data entry?')) {
      return;
    }

    try {
      await api.deleteHistoricalData(id);
      refetchHistoricalData();
      alert('Historical data entry deleted successfully!');
    } catch (error) {
      console.error('Failed to delete historical data:', error);
      alert('Failed to delete historical data entry');
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        alert('CSV file is empty');
        return;
      }

      // Skip header row and parse data
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dataLines = lines.slice(1);
      
      const importData = [];
      const errors = [];

      for (let i = 0; i < dataLines.length; i++) {
        const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length < 5) {
          errors.push(`Line ${i + 2}: Invalid number of columns`);
          continue;
        }

        const [date, bank, product, type, rate, notes = ''] = values;
        
        // Validate data
        if (!date || !bank || !product || !type || !rate) {
          errors.push(`Line ${i + 2}: Missing required fields`);
          continue;
        }

        const rateNum = parseFloat(rate);
        if (isNaN(rateNum)) {
          errors.push(`Line ${i + 2}: Invalid rate value "${rate}"`);
          continue;
        }

        importData.push({
          bank_code: bank.toUpperCase(),
          product_name: product,
          product_type: type.toLowerCase().replace(/\s+/g, '_'),
          rate: rateNum,
          date: date,
          notes: notes
        });
      }

      if (importData.length === 0) {
        alert('No valid data found in CSV file. Please check the format.');
        return;
      }

      // Import the data
      const result = await api.importHistoricalData(importData);
      
      refetchHistoricalData();
      
      let message = `Import completed!\n`;
      message += `Imported: ${result.imported} entries\n`;
      if (result.duplicates > 0) {
        message += `Duplicates skipped: ${result.duplicates}\n`;
      }
      if (result.errors.length > 0) {
        message += `Errors: ${result.errors.length}\n`;
        message += `First few errors:\n${result.errors.slice(0, 3).join('\n')}`;
      }
      
      alert(message);
    } catch (error) {
      console.error('CSV import failed:', error);
      alert('Failed to import CSV file');
    }

    // Reset file input
    event.target.value = '';
  };

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'extraction', name: 'Extraction', icon: ClockIcon },
    { id: 'historical', name: 'Historical Data', icon: ChartBarIcon },
    { id: 'prompts', name: 'Prompt Editor', icon: CodeBracketIcon },
    { id: 'catalogue', name: 'Master Catalogue', icon: TableCellsIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'api', name: 'API & Security', icon: KeyIcon },
    { id: 'system', name: 'System', icon: ServerIcon },
    { id: 'help', name: 'Help & Documentation', icon: QuestionMarkCircleIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your savings rates intelligence system
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'prompts' && (
            <div className="space-y-6">
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Extraction Prompt Editor</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Customize the AI prompts used for each bank's data extraction
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Bank
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={selectedBank}
                      onChange={(e) => {
                        setSelectedBank(e.target.value);
                        loadPrompt(e.target.value);
                      }}
                    >
                      {bankCodes.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Prompt Content
                      </label>
                      <div className="flex space-x-2">
                        <button 
                          className="btn-secondary text-xs"
                          onClick={() => loadPrompt(selectedBank)}
                        >
                          Load Current
                        </button>
                        <button 
                          className="btn-secondary text-xs"
                          onClick={testPrompt}
                        >
                          Test Prompt
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                      rows={20}
                      value={promptContent}
                      onChange={(e) => setPromptContent(e.target.value)}
                      placeholder="Select a bank to load its prompt..."
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Prompt Writing Tips
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Be specific about the product types to extract</li>
                            <li>Include examples of rate formats to expect</li>
                            <li>Specify the exact JSON structure for output</li>
                            <li>Account for bank-specific terminology</li>
                            <li>Include instructions for handling missing data</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button 
                      className="btn-secondary"
                      onClick={() => loadPrompt(selectedBank)}
                    >
                      Reset to Default
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={savePrompt}
                    >
                      Save Prompt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historical' && (
            <div className="space-y-6">
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Historical Rate Data Management</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Manually add historical rate data for enhanced beta analysis and trend tracking
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        className="btn-secondary flex items-center space-x-2"
                        onClick={() => document.getElementById('csv-import')?.click()}
                      >
                        <ArrowUpTrayIcon className="w-4 h-4" />
                        <span>Import CSV</span>
                      </button>
                      <button 
                        className="btn-primary flex items-center space-x-2"
                        onClick={() => setShowAddHistoricalData(true)}
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Rate Entry</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hidden file input for CSV import */}
                <input
                  id="csv-import"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVImport}
                />

                {/* Add Historical Data Form */}
                {showAddHistoricalData && (
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Add Historical Rate Entry</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank
                        </label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={historicalDataForm.bank_code}
                          onChange={(e) => setHistoricalDataForm({...historicalDataForm, bank_code: e.target.value})}
                        >
                          {bankCodes.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Name
                        </label>
                        <input 
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={historicalDataForm.product_name}
                          onChange={(e) => setHistoricalDataForm({...historicalDataForm, product_name: e.target.value})}
                          placeholder="e.g., Online Bonus Saver"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Type
                        </label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={historicalDataForm.product_type}
                          onChange={(e) => setHistoricalDataForm({...historicalDataForm, product_type: e.target.value})}
                        >
                          <option value="instant_access_savings">Instant Access Savings</option>
                          <option value="instant_access_isa">Instant Access ISA</option>
                          <option value="fixed_rate_bond">Fixed Rate Bond</option>
                          <option value="fixed_rate_isa">Fixed Rate ISA</option>
                          <option value="regular_savings">Regular Savings</option>
                          <option value="notice_account">Notice Account</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate (%)
                        </label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={historicalDataForm.rate}
                          onChange={(e) => setHistoricalDataForm({...historicalDataForm, rate: e.target.value})}
                          placeholder="4.25"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <input 
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={historicalDataForm.date}
                          onChange={(e) => setHistoricalDataForm({...historicalDataForm, date: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (optional)
                        </label>
                        <input 
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={historicalDataForm.notes}
                          onChange={(e) => setHistoricalDataForm({...historicalDataForm, notes: e.target.value})}
                          placeholder="Source: Bank website"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-4">
                      <button 
                        className="btn-secondary"
                        onClick={() => {
                          setShowAddHistoricalData(false);
                          setHistoricalDataForm({
                            bank_code: 'HSBC',
                            product_name: '',
                            product_type: 'instant_access_savings',
                            rate: '',
                            date: '',
                            notes: ''
                          });
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn-primary"
                        onClick={handleAddHistoricalData}
                      >
                        Add Entry
                      </button>
                    </div>
                  </div>
                )}

                {/* Historical Data Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate (%)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historicalData.map((entry: any) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entry.bank_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                              {entry.product_type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {entry.rate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.notes}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-emerald-600 hover:text-emerald-900">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteHistoricalData(entry.id)}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add other tabs content here following same pattern */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">General configuration options will be restored here.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-6">
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Help & Documentation</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Access documentation, guides, and component references
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  
                  {/* Widget Documentation Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <TableCellsIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-blue-900 mb-2">Widget Registry</h4>
                        <p className="text-blue-800 mb-4">
                          Complete documentation of all reusable widgets and components in the application. 
                          Includes input/output specifications, dependencies, and usage guidelines.
                        </p>
                        <div className="flex items-center space-x-4">
                          <a 
                            href="/widget-registry" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            View Widget Registry
                          </a>
                          <span className="text-sm text-blue-700">
                            📍 Located at: <code className="bg-blue-100 px-2 py-1 rounded text-xs">/WIDGET_REGISTRY.md</code>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Beta Calibration Guide */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-green-900 mb-2">Beta Calibration System</h4>
                        <p className="text-green-800 mb-4">
                          The beta calibration feature allows you to analyze historical rate movements and correlations
                          with Bank of England base rate changes. Use the widget-based interface for modular analysis.
                        </p>
                        <div className="space-y-2 text-sm text-green-700">
                          <div><strong>Key Features:</strong></div>
                          <ul className="list-disc ml-6 space-y-1">
                            <li>Time series visualization with Recharts</li>
                            <li>Hierarchical and faceted product selection</li>
                            <li>Real-time beta calculations</li>
                            <li>Multi-tier product support (e.g., Barclays Rainy Day Saver)</li>
                            <li>Category and individual product grouping modes</li>
                          </ul>
                        </div>
                        <div className="mt-4">
                          <a 
                            href="/calibrate/beta" 
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                          >
                            Open Beta Calibration
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Reference Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Key Shortcuts */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <KeyIcon className="w-5 h-5 mr-2 text-gray-600" />
                        Available Features
                      </h4>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Dashboard:</span>
                          <code className="bg-gray-200 px-2 py-1 rounded text-xs">/dashboard</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Beta Calibration:</span>
                          <code className="bg-gray-200 px-2 py-1 rounded text-xs">/calibrate/beta</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Settings:</span>
                          <code className="bg-gray-200 px-2 py-1 rounded text-xs">/settings</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Data Validation:</span>
                          <code className="bg-gray-200 px-2 py-1 rounded text-xs">/validate</code>
                        </div>
                      </div>
                    </div>

                    {/* Component Architecture */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <CodeBracketIcon className="w-5 h-5 mr-2 text-gray-600" />
                        Architecture Notes
                      </h4>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div><strong>Widget Pattern:</strong> Modular, reusable components</div>
                        <div><strong>State Management:</strong> React Query for data fetching</div>
                        <div><strong>Styling:</strong> Tailwind CSS with consistent design system</div>
                        <div><strong>Charts:</strong> Recharts for time series visualization</div>
                        <div><strong>TypeScript:</strong> Full type safety throughout application</div>
                      </div>
                    </div>

                  </div>

                  {/* Contact and Support */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-amber-900 mb-2">Need Help?</h4>
                        <p className="text-amber-800 mb-4">
                          If you encounter issues or need assistance with the savings rates intelligence system,
                          please check the widget documentation first. For technical support or feature requests,
                          consult with your development team.
                        </p>
                        <div className="text-sm text-amber-700">
                          <div><strong>Latest Updates:</strong></div>
                          <ul className="list-disc ml-6 space-y-1 mt-2">
                            <li>Widget-based architecture implemented for better maintainability</li>
                            <li>Beta calibration system enhanced with multi-tier support</li>
                            <li>Historical data management with CSV import capability</li>
                            <li>Improved bank filtering with proper code/name display</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Add other tabs as needed */}
        </div>
      </div>
    </div>
  );
}