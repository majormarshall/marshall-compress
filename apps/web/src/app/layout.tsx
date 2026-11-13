import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'MARSHALL — AI Productivity Platform',
  description: 'Enterprise AI-powered productivity: cloud storage, media compression, meeting intelligence, notes, and AI workflows in one platform.',
  keywords: ['AI', 'cloud storage', 'compression', 'meetings', 'notes', 'productivity'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </QueryProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f1f5f9',
              backdropFilter: 'blur(12px)',
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
