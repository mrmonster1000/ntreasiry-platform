'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();

  // Don't show navigation on public pages
  const isPublicPage = pathname?.startsWith('/landing') || 
                      pathname?.startsWith('/auth') ||
                      pathname === '/';

  // For public pages, render without navigation
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For all pages, render with navigation (no auth required)
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}