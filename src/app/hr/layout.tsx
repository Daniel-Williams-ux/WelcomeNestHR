'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut } from 'firebase/auth';

import { HRSidebar } from '@/components/dashboard/HRSidebar';
import HRTopbar from '@/components/hr/HRTopbar';
import { useAuthContext } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import BellMenu from '@/components/dashboard/BellMenu';
import { auth } from '@/lib/firebase';

export default function HRLayout({ children }: { children: ReactNode }) {

  const { user, role, isTrialExpired, loading } = useAuthContext();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

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

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080f1a] dark:text-slate-100">
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
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              aria-controls="hr-mobile-sidebar"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:border-[#00ACC1]/40 hover:text-[#00ACC1] focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
            <span className="truncate font-semibold">HR Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <BellMenu audience="hr" />
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