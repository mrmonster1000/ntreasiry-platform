'use client';

import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ClockIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import type { ExtractionRun } from '@/lib/api';

interface Props {
  extractions?: ExtractionRun[];
  isLoading: boolean;
}

export function RecentExtractions({ extractions, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Extractions
        </h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!extractions || extractions.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Extractions
        </h3>
        <div className="text-center py-8 text-gray-500">
          <ClockIcon className="w-8 h-8 mx-auto mb-2" />
          <p>No extractions found</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-success-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-5 h-5 text-error-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-warning-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-50';
      case 'failed':
        return 'text-error-600 bg-error-50';
      default:
        return 'text-warning-600 bg-warning-50';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Extractions
        </h3>
        <Link 
          href="/history" 
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
        >
          <span>View all</span>
          <ChevronRightIcon className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {extractions.slice(0, 5).map((extraction) => (
          <div key={extraction.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {getStatusIcon(extraction.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    Run #{extraction.id}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(extraction.status)}`}>
                    {extraction.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {format(new Date(extraction.run_timestamp), 'MMM d, yyyy HH:mm')} • {formatDistanceToNow(new Date(extraction.run_timestamp))} ago
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

      {extractions.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No recent extractions</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {extractions.filter(e => e.status === 'completed').length}
            </div>
            <div className="text-xs text-success-600">Successful</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {extractions.filter(e => e.status === 'failed').length}
            </div>
            <div className="text-xs text-error-600">Failed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {extractions.reduce((sum, e) => sum + e.total_products_found, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Products</div>
          </div>
        </div>
      </div>
    </div>
  );
}