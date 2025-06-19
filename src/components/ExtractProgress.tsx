'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  PlayIcon 
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export function ExtractProgress() {
  const { data: activeExtractions, isLoading } = useQuery({
    queryKey: ['active-extractions'],
    queryFn: api.getActiveExtractions,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const { data: recentExtractions } = useQuery({
    queryKey: ['recent-extractions-sidebar'],
    queryFn: () => api.getRecentExtractions(5),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Extraction Progress
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Extractions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active Extractions
        </h3>
        
        {activeExtractions && activeExtractions.length > 0 ? (
          <div className="space-y-4">
            {activeExtractions.map((extraction) => (
              <div key={extraction.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PlayIcon className="w-4 h-4 text-primary-600 animate-pulse" />
                    <span className="text-sm font-medium text-gray-900">
                      Running Extraction
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {extraction.progress}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${extraction.progress}%` }}
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  <div>Banks: {extraction.completedBanks}/{extraction.totalBanks}</div>
                  {extraction.currentBank && (
                    <div>Current: {extraction.currentBank}</div>
                  )}
                  <div>
                    Started: {formatDistanceToNow(new Date(extraction.startTime))} ago
                  </div>
                </div>
                
                {extraction.results.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-700">Progress:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {extraction.results.map((result, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs">
                          {result.success ? (
                            <CheckCircleIcon className="w-3 h-3 text-success-500" />
                          ) : (
                            <ExclamationCircleIcon className="w-3 h-3 text-error-500" />
                          )}
                          <span className={result.success ? 'text-success-700' : 'text-error-700'}>
                            {result.bank}: {result.success ? (
                              <span>
                                {result.products} products
                              </span>
                            ) : result.error}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="w-8 h-8 mx-auto mb-2" />
            <p>No active extractions</p>
          </div>
        )}
      </div>

      {/* Recent Extractions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Extractions
        </h3>
        
        {recentExtractions && recentExtractions.length > 0 ? (
          <div className="space-y-3">
            {recentExtractions.map((extraction) => (
              <div 
                key={extraction.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {extraction.status === 'completed' ? (
                    <CheckCircleIcon className="w-5 h-5 text-success-500" />
                  ) : extraction.status === 'failed' ? (
                    <ExclamationCircleIcon className="w-5 h-5 text-error-500" />
                  ) : (
                    <ClockIcon className="w-5 h-5 text-warning-500" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Run #{extraction.id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(extraction.run_timestamp))} ago
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {extraction.successful_banks}/{extraction.total_banks}
                  </div>
                  <div className="text-xs text-gray-500">
                    {extraction.total_products_found} products
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No recent extractions</p>
          </div>
        )}
      </div>
    </div>
  );
}