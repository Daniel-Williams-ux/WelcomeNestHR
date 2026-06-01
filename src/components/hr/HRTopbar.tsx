'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useUserAccess } from '@/hooks/useUserAccess';
import BellMenu from '@/components/dashboard/BellMenu';
import { auth } from '@/lib/firebase';

export default function HRTopbar() {
  const { user } = useUserAccess();
  const { company, loading } = useCurrentCompany(user);
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.fullName || user?.displayName || user?.email || 'HR user';
  const initials = displayName
    .trim()
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'H';

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/hr');
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[#00ACC1]/40 hover:text-[#00ACC1] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <Link href="/hr" className="min-w-0 group">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#008FA1]">
            HR workspace
          </p>
          <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
            <LayoutDashboard className="mr-1.5 inline h-4 w-4 text-slate-400 group-hover:text-[#00ACC1]" aria-hidden="true" />
            {loading ? 'Loading company...' : company?.name || 'Company not assigned'}
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[#00ACC1]/40 hover:text-[#00ACC1] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={18} aria-hidden="true" />
          ) : (
            <Moon size={18} aria-hidden="true" />
          )}
        </button>

        <BellMenu audience="hr" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-10 items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 py-1 pl-1 pr-3 text-sm font-semibold text-[#006e7f] shadow-sm transition hover:bg-cyan-100 dark:border-cyan-900/70 dark:bg-cyan-950/50 dark:text-cyan-100"
            title={user?.email}
            aria-label={`Open account menu for ${displayName}`}
            aria-expanded={menuOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00ACC1] text-white">
              {initials}
            </span>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {displayName}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email}
                </p>
              </div>
              <Link
                href="/hr/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Settings
              </Link>
              <Link
                href="/hr/billing"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Billing
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-slate-800 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
