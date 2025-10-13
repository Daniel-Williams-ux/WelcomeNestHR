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

  // Hide NavigationBar and Footer on dashboard and superadmin routes
  const hideLayout =
    pathname.startsWith('/dashboard') || pathname.startsWith('/superadmin');

  return (
    <>
      {!hideLayout && <NavigationBar />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}
