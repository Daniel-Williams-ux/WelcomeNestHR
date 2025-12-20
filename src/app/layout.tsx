import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ThemeClientWrapper from '@/components/ThemeClientWrapper';
import ClientLayout from '@/components/ClientLayout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'WelcomeNestHR',
  description: 'Where onboarding meets belonging',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeClientWrapper>
          <ClientLayout>
            <div className="w-full max-w-full overflow-x-hidden">
              {children}
            </div>
          </ClientLayout>
        </ThemeClientWrapper>
      </body>
    </html>
  );
}