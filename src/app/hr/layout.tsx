'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { HRSidebar } from '@/components/dashboard/HRSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { role, loading: accessLoading } = useUserAccess();
  const { companyId, loading: companyLoading, error } = useCurrentCompany();

  // --- 1. Block employees or unassigned users ---
  useEffect(() => {
    if (!accessLoading && role && role !== 'hr') {
      router.replace('/dashboard');
    }
  }, [accessLoading, role, router]);

  if (accessLoading || companyLoading) {
    return <div className="p-6">Loading HR dashboard…</div>;
  }

  if (role !== 'hr') {
    return (
      <div className="p-6 text-red-600">Access denied. HR role required.</div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!companyId) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">No company assigned</h2>
        <p>Your HR account does not have a company yet.</p>
        <p>Please ask the Superadmin to assign your company.</p>
      </div>
    );
  }

  // --- 2. HR Dashboard Layout ---
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <HRSidebar />

      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        <DashboardTopbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}