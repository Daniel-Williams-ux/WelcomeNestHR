'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';

import { useUserAccess } from '@/hooks/useUserAccess';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { HRSidebar } from '@/components/dashboard/HRSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { role, loading: accessLoading } = useUserAccess();
  const { companyId, loading: companyLoading, error } = useCurrentCompany();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Access guard
  useEffect(() => {
    if (!accessLoading && role && role !== 'hr') {
      router.replace('/dashboard');
    }
  }, [accessLoading, role, router]);

  if (accessLoading || companyLoading) {
    return <div className="p-6">Loading HR dashboard…</div>;
  }

  if (role !== 'hr') {
    return <div className="p-6 text-red-600">Access denied.</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!companyId) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">No company assigned</h2>
        <p>Please ask the Superadmin to assign your company.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR (DO NOT WRAP OR STYLE IT) */}
      <div
        className={`
          fixed z-50 md:static
          ${sidebarOpen ? 'block' : 'hidden'}
          md:block
        `}
      >
        <HRSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* MOBILE TOP BAR */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b sticky top-0 bg-white z-30">
          <button
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>

          <span className="font-semibold">HR Dashboard</span>
        </div>

        {/* DESKTOP TOP BAR */}
        <div className="hidden md:block">
          <DashboardTopbar />
        </div>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
