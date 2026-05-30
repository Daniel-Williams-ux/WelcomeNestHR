'use client';

import { Sidebar } from '@/components/dashboard/Sidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role, loading } = useUserAccess();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (!role) {
      router.replace('/route-router');
    } else if (role === 'hr') {
      router.replace('/hr');
    } else if (role === 'superadmin') {
      router.replace('/superadmin');
    }
  }, [loading, role, router, user]);

  if (loading || !user || role !== 'employee') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Checking employee access...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:hover:bg-slate-800"
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            aria-controls="employee-mobile-sidebar"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <span className="font-semibold">Employee Dashboard</span>
        </header>

        <DashboardTopbar />
        <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}