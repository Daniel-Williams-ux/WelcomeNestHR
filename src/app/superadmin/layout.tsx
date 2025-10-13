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
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-800 dark:text-gray-200">
        <SuperAdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 flex flex-col transition-all duration-300 md:ml-64">
          {/* Mobile menu button (visible only when sidebar closed) */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md bg-[#FFB300] text-white shadow hover:bg-[#FB8C00]"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
          </div>

          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ProtectedRouteSuperAdmin>
  );
}