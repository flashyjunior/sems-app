import type { Metadata } from 'next';
import './globals.css';
import { DatabaseLocationDisplay } from '@/components/DatabaseLocationDisplay';

export const metadata: Metadata = {
  title: 'SEMS - Smart Dispensing System',
  description: 'Offline-first pharmacy dispensing application',
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SEMS',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="SEMS" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <DatabaseLocationDisplay />
      </body>
    </html>
  );
}
