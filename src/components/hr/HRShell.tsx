// src/components/hr/HRShell.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  Users,
  FileText,
  Clock,
  Settings,
  Bell,
  Search,
  Menu,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HRShell({
  children,
  companyId,
}: {
  children: React.ReactNode;
  companyId: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hide any header(s) rendered by parent (marketing) layout while HR Shell is mounted.
  // We only modify styles (non-destructive) and restore them on unmount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const headers = Array.from(document.querySelectorAll('header'));
    const toHide: { el: Element; oldDisplay: string | null }[] = [];

    for (const h of headers) {
      // if header is outside our container, hide it
      if (!container.contains(h)) {
        toHide.push({
          el: h,
          oldDisplay: (h as HTMLElement).style.display || null,
        });
        (h as HTMLElement).style.display = 'none';
      }
    }

    // also hide any top-level nav that may not be header (defensive)
    const navs = Array.from(document.querySelectorAll('nav'));
    for (const n of navs) {
      if (!container.contains(n)) {
        // only hide navs which look like marketing navs (heuristic: wide navs)
        const rect = (n as HTMLElement).getBoundingClientRect();
        if (rect.width > 200 && rect.top < 120) {
          toHide.push({
            el: n,
            oldDisplay: (n as HTMLElement).style.display || null,
          });
          (n as HTMLElement).style.display = 'none';
        }
      }
    }

    return () => {
      // restore
      for (const t of toHide) {
        (t.el as HTMLElement).style.display = t.oldDisplay ?? '';
      }
    };
  }, []);

  // close sidebar on Escape (mobile)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#F9FAFB] text-gray-800 flex"
    >
      {/* Mobile topbar for small screens */}
      <div className="lg:hidden fixed top-2 left-2 right-2 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#FFB300] to-[#FB8C00] flex items-center justify-center text-white font-semibold">
            WN
          </div>
          <div className="text-sm font-medium">WelcomeNestHR</div>
        </div>

        <button
          className="p-2 ml-2 rounded bg-white shadow"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setSidebarOpen((s) => !s)}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Sidebar (desktop) */}
      <aside
        className={`fixed z-20 top-0 left-0 bottom-0 w-72 bg-white border-r border-gray-100 shadow-sm transition-transform transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-hidden={
          !sidebarOpen &&
          typeof window !== 'undefined' &&
          window.innerWidth < 1024
        }
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFB300] to-[#FB8C00] flex items-center justify-center text-white font-semibold">
              WN
            </div>
            <div>
              <div className="text-lg font-semibold">WelcomeNestHR</div>
              <div className="text-xs text-gray-500">HR Admin</div>
            </div>
          </div>
        </div>

        <nav className="px-3 py-4">
          <SidebarLink icon={<Home size={16} />} label="Home" href="/hr" />
          <SidebarLink
            icon={<Users size={16} />}
            label="Employees"
            href="/hr/employees"
          />
          <SidebarLink
            icon={<FileText size={16} />}
            label="Payroll"
            href="/hr/payroll"
          />
          <SidebarLink
            icon={<Clock size={16} />}
            label="Onboarding"
            href="/hr/onboarding"
          />
          <SidebarLink
            icon={<FileText size={16} />}
            label="Compliance"
            href="/hr/compliance"
          />
          <SidebarLink
            icon={<Settings size={16} />}
            label="Company Settings"
            href="/hr/settings"
          />
        </nav>

        <div className="mt-auto px-4 py-6">
          <button className="w-full text-sm px-3 py-2 rounded-lg bg-[#00ACC1] text-white font-medium shadow-sm">
            Run Payroll
          </button>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar open */}
      {sidebarOpen && (
        <button
          aria-hidden
          className="fixed inset-0 bg-black/30 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 ml-0 lg:ml-72">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-[#F9FAFB] border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <label htmlFor="site-search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                  <Search size={16} />
                </span>
                <input
                  id="site-search"
                  className="pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-100 shadow-sm w-72 text-sm"
                  placeholder="Search employees, payrolls..."
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>

              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Acme Ltd.</div>
                <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center">
                  DW
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - animation kept within client boundary */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="w-full px-6 py-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

function SidebarLink({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <span className="opacity-80">{icon}</span>
      <span>{label}</span>
    </a>
  );
}