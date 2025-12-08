import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { AuthLayout } from '@/components/AuthLayout';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Neuro-XI | Data, Research, Intelligence',
  description: 'Neuro-XI delivers data-driven research and intelligence solutions.',
  keywords: ['data', 'research', 'intelligence', 'Neuro-XI'],
  authors: [{ name: 'Neuro-XI' }],
  openGraph: {
    title: 'Neuro-XI',
    description: 'Data, Research, Intelligence',
    url: 'https://neuro-xi.com',
    siteName: 'Neuro-XI',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Neuro-XI',
    description: 'Data, Research, Intelligence',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  metadataBase: new URL('https://neuro-xi.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <AuthLayout>
            {children}
          </AuthLayout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
