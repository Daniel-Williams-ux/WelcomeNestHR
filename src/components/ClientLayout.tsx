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
      {!hideLayout && <NavigationBar />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}