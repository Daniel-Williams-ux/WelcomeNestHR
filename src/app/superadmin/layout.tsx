'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar';
import ProtectedRouteSuperAdmin from '@/components/auth/ProtectedRouteSuperAdmin';
import { Menu } from 'lucide-react';

export default function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRouteSuperAdmin>
      <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-[#121212] dark:text-gray-200">
        <SuperAdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex min-h-screen flex-col lg:pl-64">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:hidden">
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md bg-[#FFB300] p-2 text-white shadow transition hover:bg-[#FB8C00] focus:outline-none focus:ring-2 focus:ring-[#FB8C00] focus:ring-offset-2"
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
              aria-controls="superadmin-mobile-sidebar"
            >
              <Menu size={20} />
            </button>
          </header>

          <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRouteSuperAdmin>
  );
}