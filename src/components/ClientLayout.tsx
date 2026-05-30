'use client';

import { usePathname } from 'next/navigation';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide NavigationBar and Footer on ALL dashboard routes:
  const hideLayout =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/superadmin') ||
    pathname.startsWith('/hr'); // 👈 NEW

  return (
    <>
      {!hideLayout && (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[#00ACC1] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
      )}
      {!hideLayout && <NavigationBar />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}
