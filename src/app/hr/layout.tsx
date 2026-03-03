'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';

import { HRSidebar } from '@/components/dashboard/HRSidebar';
import HRTopbar from '@/components/hr/HRTopbar';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-[#004d59]
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <HRSidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex flex-col min-h-screen md:ml-64">
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 p-4 border-b bg-white">
          <button
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00ACC1]"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold">HR Dashboard</span>
        </header>

        <div className="hidden md:block">
          <HRTopbar />
        </div>

        <main className="flex-1 w-full p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}