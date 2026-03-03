'use client';

import { Sidebar } from '@/components/dashboard/Sidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import { useState } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isTrialExpired, role, loading } = useUserAccess();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking access...
      </div>
    );
  }

  // HARD BLOCK (Only for HR / owners, NOT employees)
  if (role !== 'employee' && isTrialExpired && role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white shadow rounded-xl p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Trial Expired</h2>
          <p className="text-gray-600 mb-4">
            Your trial has ended. Please upgrade your plan to continue using the
            platform.
          </p>
          <a
            href="/dashboard/billing"
            className="inline-block bg-[#00ACC1] text-white px-4 py-2 rounded-lg"
          >
            Go to Billing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
  );
}