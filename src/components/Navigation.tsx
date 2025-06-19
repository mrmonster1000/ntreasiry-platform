'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Removed auth imports for simplified app
import { 
  HomeIcon, 
  PlayIcon, 
  ChartBarIcon, 
  ClockIcon, 
  Cog6ToothIcon,
  BanknotesIcon,
  CursorArrowRaysIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  CurrencyPoundIcon,
  BeakerIcon,
  ShieldCheckIcon,
  CalculatorIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ScaleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const primaryNavigation = [
  { name: 'Intelligence', href: '/dashboard', icon: HomeIcon },
  { 
    name: 'Calibrate', 
    icon: CursorArrowRaysIcon,
    submenu: [
      { name: 'Beta', href: '/calibrate/beta', icon: BeakerIcon },
      { name: 'Stability', href: '/calibrate/stability', icon: ScaleIcon },
      { name: 'Hedging', href: '/calibrate/hedging', icon: ShieldCheckIcon },
    ]
  },
  { name: 'Validate', href: '/validate', icon: ShieldCheckIcon },
  { name: 'Quantify', href: '/quantify', icon: CalculatorIcon },
  { name: 'Approve', href: '/approve', icon: CheckCircleIcon },
];

const secondaryNavigation = [
  { 
    name: 'Policy', 
    icon: DocumentTextIcon,
    submenu: [
      { name: 'Framework', href: '/policy/framework', icon: DocumentTextIcon },
      { name: 'Compliance', href: '/policy/compliance', icon: ScaleIcon },
    ]
  },
  { 
    name: 'Settings', 
    icon: Cog6ToothIcon,
    submenu: [
      { name: 'Extract', href: '/extract', icon: PlayIcon },
      { name: 'Preferences', href: '/settings', icon: Cog6ToothIcon },
    ]
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <nav className="bg-black shadow-2xl border-b border-gray-800 backdrop-blur-xl relative z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <BanknotesIcon className="w-7 h-7 text-black" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <span className="text-green-500">n</span>Treasury
              </div>
              <div className="text-xs text-gray-400 font-medium">
                UK Banking Market Intelligence
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {primaryNavigation.map((item) => (
              <div key={item.name} className="relative">
                {item.submenu ? (
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                      className={clsx(
                        'flex items-center space-x-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden',
                        'text-gray-300 hover:text-white hover:bg-gray-800/50 backdrop-blur-sm'
                      )}
                    >
                      <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                      <span className="relative z-10">{item.name}</span>
                      <ChevronDownIcon className={clsx(
                        "w-4 h-4 transition-transform duration-200",
                        openDropdown === item.name ? "rotate-180" : ""
                      )} />
                    </button>
                    
                    {openDropdown === item.name && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-lg z-[9999]">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setOpenDropdown(null)}
                            className={clsx(
                              'flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-gray-800 first:rounded-t-xl last:rounded-b-xl',
                              pathname === subItem.href
                                ? 'text-white bg-gray-800'
                                : 'text-gray-300 hover:text-white'
                            )}
                          >
                            <subItem.icon className="w-4 h-4" />
                            <span>{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={clsx(
                      'flex items-center space-x-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden',
                      pathname === item.href
                        ? 'bg-gray-800 text-white shadow-lg border border-gray-600'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50 backdrop-blur-sm'
                    )}
                  >
                    <item.icon className={clsx(
                      "w-5 h-5 transition-transform duration-300",
                      pathname === item.href ? "text-white" : "group-hover:scale-110"
                    )} />
                    <span className="relative z-10">{item.name}</span>
                    {pathname === item.href && (
                      <div className="absolute inset-0 bg-gray-700/30 rounded-2xl"></div>
                    )}
                  </Link>
                )}
              </div>
            ))}
            
            {/* Secondary Navigation */}
            <div className="flex items-center space-x-1 ml-4 pl-4 border-l border-gray-700">
              {secondaryNavigation.map((item) => (
                <div key={item.name} className="relative">
                  {item.submenu ? (
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                        className={clsx(
                          'flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 group',
                          'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                        <ChevronDownIcon className={clsx(
                          "w-3 h-3 transition-transform duration-200",
                          openDropdown === item.name ? "rotate-180" : ""
                        )} />
                      </button>
                      
                      {openDropdown === item.name && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-lg z-[9999]">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={() => setOpenDropdown(null)}
                              className={clsx(
                                'flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-gray-800 first:rounded-t-xl last:rounded-b-xl',
                                pathname === subItem.href
                                  ? 'text-white bg-gray-800'
                                  : 'text-gray-300 hover:text-white'
                              )}
                            >
                              <subItem.icon className="w-4 h-4" />
                              <span>{subItem.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 group',
                        pathname === item.href
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-700">
              <div className="flex items-center space-x-2 text-gray-300">
                <UserIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Rate Analyst</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                  Professional
                </span>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-slate-300 hover:text-white p-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
    </nav>
  );
}