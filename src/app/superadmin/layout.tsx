'use client';

import { useState } from 'react';
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar';
import ProtectedRouteSuperAdmin from '@/components/auth/ProtectedRouteSuperAdmin';
import { Menu } from 'lucide-react';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRouteSuperAdmin>
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-800 dark:text-gray-200">
        <div className="flex w-full">
          {/* Sidebar (fixed only on desktop) */}
          <div className="hidden lg:block w-64 shrink-0">
            <SuperAdminSidebar
              sidebarOpen={true}
              setSidebarOpen={setSidebarOpen}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col w-full">
            {/* Mobile & Tablet Header */}
            <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md bg-[#FFB300] text-white shadow hover:bg-[#FB8C00]"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
            </div>

            {/* Page content */}
            <main className="flex-1 p-6 overflow-y-auto w-full">
              {children}
            </main>
          </div>
        </div>

        {/* Sidebar overlay (mobile + tablet) */}
        <SuperAdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>
    </ProtectedRouteSuperAdmin>
  );
}