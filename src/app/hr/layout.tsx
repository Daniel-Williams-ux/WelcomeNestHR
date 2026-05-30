'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

import { HRSidebar } from '@/components/dashboard/HRSidebar';
import HRTopbar from '@/components/hr/HRTopbar';
import { useAuthContext } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function HRLayout({ children }: { children: ReactNode }) {

  const { user, role, isTrialExpired, loading } = useAuthContext();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (!role) {
      router.replace('/route-router');
    } else if (role === 'superadmin') {
      router.replace('/superadmin');
    } else if (role === 'employee') {
      router.replace('/dashboard');
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (loading) return;

    if (isTrialExpired) {
      router.replace('/upgrade');
    }
  }, [isTrialExpired, loading, router]);

  if (loading || !user || role !== 'hr') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Checking HR access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        id="hr-mobile-sidebar"
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        aria-label="HR sidebar"
      >
        <HRSidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex min-h-screen flex-col md:ml-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <button
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            aria-controls="hr-mobile-sidebar"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:hover:bg-slate-800"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <span className="font-semibold">HR Dashboard</span>
        </header>

        <div className="hidden md:block">
          <HRTopbar />
        </div>

        <main id="main-content" className="w-full flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}