'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  PlayIcon, 
  CheckIcon, 
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { ExtractProgress } from '@/components/ExtractProgress';

const BANKS = [
  { code: 'HSBC', name: 'HSBC UK', description: 'Online Bonus Saver, Premier Banking' },
  { code: 'BARCLAYS', name: 'Barclays UK', description: 'Everyday Saver, Rainy Day Saver' },
  { code: 'CHASE', name: 'Chase UK', description: 'Saver Boosted, Promotional Rates' },
  { code: 'LLOYDS', name: 'Lloyds Bank UK', description: 'Easy Saver, Club Lloyds Benefits' },
  { code: 'NATIONWIDE', name: 'Nationwide Building Society', description: 'FlexDirect, Regular Saver' },
  { code: 'NATWEST', name: 'NatWest', description: 'Instant Saver, Digital Regular Saver' },
  { code: 'SANTANDER', name: 'Santander UK', description: 'Easy Access Saver, 123 Current Account' },
  { code: 'TSB', name: 'TSB Bank', description: 'Easy Access, Classic Plus' },
  { code: 'CHALLENGERS', name: 'App Challengers', description: 'Monzo, Starling Bank' },
];

export default function ExtractPage() {
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [dryRun, setDryRun] = useState(false);
  const [triggerCommentary, setTriggerCommentary] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: api.getSystemHealth,
    refetchInterval: 30000, // Check every 30 seconds
  });

  const extractMutation = useMutation({
    mutationFn: api.runExtraction,
    onSuccess: (data) => {
      toast.success(`Extraction started! Run ID: ${data.runId}`);
    },
    onError: (error: any) => {
      toast.error(`Extraction failed: ${error.message}`);
    },
  });

  const commentaryMutation = useMutation({
    mutationFn: api.getMarketCommentary,
    onSuccess: () => {
      toast.success('Market commentary generated successfully!');
      setTriggerCommentary(true);
    },
    onError: () => {
      toast.error('Failed to generate market commentary');
    },
  });

  const handleBankToggle = (bankCode: string) => {
    setSelectedBanks(prev => 
      prev.includes(bankCode)
        ? prev.filter(code => code !== bankCode)
        : [...prev, bankCode]
    );
  };

  const handleSelectAll = () => {
    setSelectedBanks(BANKS.map(bank => bank.code));
  };

  const handleDeselectAll = () => {
    setSelectedBanks([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedBanks.length === 0) {
      toast.error('Please select at least one bank');
      return;
    }

    extractMutation.mutate({
      banks: selectedBanks,
      dryRun,
      date: customDate || undefined,
    });
  };

  const isHealthy = systemHealth?.claude_api === 'healthy' && 
                   systemHealth?.prompts === 'healthy';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manual Extraction</h1>
          <p className="text-gray-600 mt-2">
            Extract savings rates from selected banks using Claude AI
          </p>
        </div>
        
        {/* System Health Indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-success-500' : 'bg-error-500'}`} />
          <span className={`text-sm font-medium ${isHealthy ? 'text-success-600' : 'text-error-600'}`}>
            {isHealthy ? 'System Healthy' : 'System Issues'}
          </span>
        </div>
      </div>

      {/* System Health Warning */}
      {!isHealthy && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 mt-0.5" />
            <div>
              <h3 className="text-warning-800 font-medium">System Health Issues</h3>
              <div className="text-warning-700 text-sm mt-1">
                <div>Claude API: {systemHealth?.claude_api || 'Unknown'}</div>
                <div>Prompts: {systemHealth?.prompts || 'Unknown'}</div>
                <div>Database: {systemHealth?.database || 'Unknown'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Extraction Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Select Banks ({selectedBanks.length}/{BANKS.length})
                </h2>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BANKS.map((bank) => (
                  <label
                    key={bank.code}
                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedBanks.includes(bank.code)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBanks.includes(bank.code)}
                      onChange={() => handleBankToggle(bank.code)}
                      className="sr-only"
                    />
                    <div className="flex items-start space-x-3 w-full">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                        selectedBanks.includes(bank.code)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedBanks.includes(bank.code) && (
                          <CheckIcon className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{bank.name}</div>
                        <div className="text-sm text-gray-600">{bank.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Options</h3>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="dryRun"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="dryRun" className="text-sm text-gray-700">
                  Dry run (don't save to database)
                </label>
              </div>

              <div>
                <label htmlFor="customDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Collection Date (optional)
                </label>
                <input
                  type="date"
                  id="customDate"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="input-field max-w-xs"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave blank to use today's date
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedBanks.length > 0 && (
                  <>Estimated time: {selectedBanks.length * 2} minutes</>
                )}
              </div>
              <button
                type="submit"
                disabled={selectedBanks.length === 0 || extractMutation.isPending || !isHealthy}
                className="btn-primary flex items-center space-x-2"
              >
                {extractMutation.isPending ? (
                  <ClockIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
                <span>
                  {extractMutation.isPending ? 'Starting...' : 'Start Extraction'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Progress Sidebar */}
        <div className="lg:col-span-1">
          <ExtractProgress />
        </div>
      </div>

      {/* Market Commentary Generation */}
      <div className="mt-8">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Market Commentary</h3>
              <p className="text-sm text-gray-600">Generate comprehensive market analysis with Claude 4</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Advanced Market Analysis</h4>
                <p className="text-sm text-gray-600">
                  Generate AI-powered commentary covering competitive positioning, behavioral risk insights, 
                  and strategic outlook for UK deposit rates using current market data.
                </p>
              </div>
              <button
                onClick={() => commentaryMutation.mutate()}
                disabled={commentaryMutation.isPending}
                className="btn-primary flex items-center space-x-2 ml-4 shrink-0"
              >
                {commentaryMutation.isPending ? (
                  <ClockIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SparklesIcon className="w-4 h-4" />
                )}
                <span>
                  {commentaryMutation.isPending ? 'Generating...' : 'Generate Commentary'}
                </span>
              </button>
            </div>
            
            {triggerCommentary && (
              <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                ✓ Market commentary generated! View it on the dashboard.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}