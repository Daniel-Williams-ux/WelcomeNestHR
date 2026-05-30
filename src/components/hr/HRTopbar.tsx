'use client';

import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function HRTopbar() {
  const { user } = useUserAccess();
  const { company, loading } = useCurrentCompany(user);
  const { theme, setTheme } = useTheme();

  const displayName = user?.fullName || user?.displayName || user?.email || 'HR user';
  const initial = displayName.charAt(0) || 'U';

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:px-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#008FA1]">
          HR workspace
        </p>

        <div className="mt-0.5 flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
            {loading ? 'Loading company...' : company?.name || 'Company not assigned'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun size={18} aria-hidden="true" />
          ) : (
            <Moon size={18} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="View notifications"
        >
          <Bell size={18} aria-hidden="true" />
        </button>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00ACC1] text-sm font-semibold text-white"
          title={user?.email}
          aria-label={`Signed in as ${displayName}`}
        >
          {initial.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
