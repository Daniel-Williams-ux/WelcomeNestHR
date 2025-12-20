'use client';

import Link from 'next/link';

export function HRSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-[#004d59] text-white p-6 transform 
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:translate-x-0 transition-transform duration-200`}
    >
      <h2 className="text-xl font-bold mb-6">HR Dashboard</h2>

      <nav className="space-y-4">
        <Link href="/hr" className="block hover:text-[#00ACC1]">
          Overview
        </Link>
        <Link href="/hr/employees" className="block hover:text-[#00ACC1]">
          Employees
        </Link>
        <Link href="/hr/onboarding" className="block hover:text-[#00ACC1]">
          Onboarding
        </Link>
        <Link href="/hr/compliance" className="block hover:text-[#00ACC1]">
          Compliance
        </Link>
        <Link href="/hr/payroll" className="block hover:text-[#00ACC1]">
          Payroll
        </Link>
      </nav>

      <button
        className="md:hidden mt-6 text-sm underline"
        onClick={() => setSidebarOpen(false)}
      >
        Close
      </button>
    </aside>
  );
}