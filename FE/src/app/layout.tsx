import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, MobileSidebarTrigger } from '@/widgets/sidebar';
import { MSWProvider } from '@/shared/mocks';

if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'production') {
  await import('@/shared/mocks/server').then(({ server }) => server.listen());
}

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'FLIP',
  description: 'AMR 관제 시스템',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <MSWProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className='w-full'>
              <MobileSidebarTrigger />
              {children}
            </main>
          </SidebarProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
