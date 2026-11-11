import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'MARSHALL — Enterprise AI Productivity Platform', template: '%s | MARSHALL' },
  description:
    'Unified Cloud Storage, Ultra-Fast Media Compression, Automated Meeting Intelligence, Collaborative Notes, and Provider-Agnostic AI Workflows.',
  keywords: ['productivity', 'AI', 'cloud storage', 'compression', 'meetings', 'notes'],
  authors: [{ name: 'MARSHALL' }],
  robots: 'noindex, nofollow',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#070a13] text-slate-100 min-h-screen overflow-x-hidden">
        <QueryProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9',
                backdropFilter: 'blur(16px)',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
