'use client';

import { 
  BanknotesIcon, 
  ArrowTrendingUpIcon, 
  ChartBarIcon,
  BuildingLibraryIcon 
} from '@heroicons/react/24/outline';
import type { DashboardStats as DashboardStatsType } from '@/lib/api';

interface Props {
  stats?: DashboardStatsType;
  isLoading: boolean;
}

export function DashboardStats({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card animate-pulse">
            <div className="h-4 bg-slate-200 rounded-lg w-3/4 mb-3"></div>
            <div className="h-10 bg-slate-200 rounded-lg w-1/2 mb-3"></div>
            <div className="h-3 bg-slate-200 rounded-lg w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: 'Total Banks',
      subtitle: 'Monitored Institutions',
      value: stats?.totalBanks || 0,
      icon: BuildingLibraryIcon,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-50 to-green-50',
      description: 'Banks monitored',
      pulse: true,
    },
    {
      title: 'Total Products',
      subtitle: 'Savings Products',
      value: stats?.totalProducts || 0,
      icon: BanknotesIcon,
      gradient: 'from-green-600 to-emerald-800',
      bgGradient: 'from-green-50 to-emerald-100',
      description: 'Active savings products',
      pulse: false,
    },
    {
      title: 'Highest Rate',
      subtitle: 'Market Leader',
      value: `${stats?.highestRate || 0}%`,
      icon: ArrowTrendingUpIcon,
      gradient: 'from-lime-500 to-green-600',
      bgGradient: 'from-lime-50 to-green-50',
      description: stats?.highestRateBank || 'N/A',
      pulse: true,
    },
    {
      title: 'Market Average',
      subtitle: 'Overall Performance',
      value: `${stats?.averageRate || 0}%`,
      icon: ChartBarIcon,
      gradient: 'from-gray-600 to-gray-800',
      bgGradient: 'from-gray-50 to-gray-100',
      description: 'Across all products',
      pulse: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <div 
          key={index} 
          className={`
            metric-card group hover:scale-110 transition-all duration-500
            bg-gradient-to-br ${item.bgGradient} border-2 border-white/50
          `}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.gradient} ${item.pulse ? 'animate-pulse' : ''}`}></div>
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">{item.title}</p>
                </div>
                <p className="text-xs text-slate-500 font-medium">{item.subtitle}</p>
              </div>
              <p className={`text-4xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                {item.value}
              </p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.description}</p>
            </div>
            <div className={`
              w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} 
              flex items-center justify-center shadow-lg group-hover:scale-110 
              transition-transform duration-300 relative overflow-hidden
            `}>
              <item.icon className="w-8 h-8 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
            </div>
          </div>
          
          {/* AI glow effect */}
          <div className={`
            absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 
            group-hover:opacity-5 rounded-2xl transition-opacity duration-500
          `}></div>
        </div>
      ))}
    </div>
  );
}