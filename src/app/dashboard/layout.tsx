'use client';

import { Sidebar } from '@/components/dashboard/Sidebar';
import { HRSidebar } from '@/components/dashboard/HRSidebar';
import { SuperSidebar } from '@/components/dashboard/SuperSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useState, useEffect } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const { role, loading, isSuspended } = useUserAccess();

  // 🔒 BLOCK SUSPENDED USERS (GLOBAL DASHBOARD GUARD)
  useEffect(() => {
    if (!loading && isSuspended) {
      router.replace('/suspended');
    }
  }, [loading, isSuspended, router]);

  function getSidebar() {
    if (role === 'superadmin')
      return (
        <SuperSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      );

    if (role === 'hr')
      return (
        <HRSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      );

    return (
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    );
  }

  // ⏳ Prevent rendering while auth is resolving
  if (loading) {
    return null; // or a loader if you prefer
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        {getSidebar()}

        <div className="flex-1 flex flex-col md:ml-64 bg-white dark:bg-gray-900 min-h-screen">
          <div className="md:hidden p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="bg-[#00ACC1] text-white px-4 py-2 rounded-lg"
              aria-label="Open menu"
            >
              Open Menu
            </button>
          </div>

          <DashboardTopbar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}