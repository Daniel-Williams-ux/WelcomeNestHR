'use client';

import { Sidebar } from '@/components/dashboard/Sidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import BellMenu from '@/components/dashboard/BellMenu';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const { user, role, loading } = useUserAccess();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

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

  useEffect(() => {
    if (!navigatingTo) return;

    if (pathname === navigatingTo || pathname.startsWith(`${navigatingTo}/`)) {
      setNavigatingTo(null);
    }
  }, [navigatingTo, pathname]);

  if (loading || !user || role !== 'employee') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Checking employee access...
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080f1a] dark:text-slate-100">
      {navigatingTo && (
        <div
          className="fixed inset-x-0 top-0 z-[70] h-1 overflow-hidden bg-cyan-100/70 dark:bg-cyan-950/60"
          role="status"
          aria-label="Loading page"
        >
          <div className="h-full w-1/2 animate-pulse rounded-r-full bg-[#00ACC1] shadow-[0_0_18px_rgba(0,172,193,0.65)]" />
        </div>
      )}

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNavigate={setNavigatingTo}
      />

      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:border-[#00ACC1]/40 hover:text-[#00ACC1] focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              aria-controls="employee-mobile-sidebar"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
            <span className="truncate font-semibold">Employee Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <BellMenu audience="employee" />
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:border-[#00ACC1]/40 hover:text-[#00ACC1] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun size={18} aria-hidden="true" />
              ) : (
                <Moon size={18} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-200 bg-white p-2 text-red-600 shadow-sm hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:hover:bg-red-950/40"
              aria-label="Log out"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <DashboardTopbar />
        <main
          id="main-content"
          className={`flex-1 p-4 md:p-6 lg:p-8 ${navigatingTo ? 'cursor-progress' : ''}`}
          aria-busy={Boolean(navigatingTo)}
        >
          {children}
        </main>
      </div>
    </div>
  );
}