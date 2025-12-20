'use client';

import Link from 'next/link';

export function SuperSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-black text-white p-6 transform
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 transition-transform duration-200`}
      aria-label="Superadmin sidebar"
    >
      <h2 className="text-xl font-bold mb-6">Superadmin</h2>

      <nav className="space-y-4" aria-label="Primary navigation">
        <Link href="/superadmin" className="block hover:text-[#00ACC1]">
          Overview
        </Link>
        <Link
          href="/superadmin/companies"
          className="block hover:text-[#00ACC1]"
        >
          Companies
        </Link>
        <Link href="/superadmin/users" className="block hover:text-[#00ACC1]">
          Users
        </Link>
        <Link
          href="/superadmin/audit-logs"
          className="block hover:text-[#00ACC1]"
        >
          Audit Logs
        </Link>
        <Link href="/superadmin/payroll" className="block hover:text-[#00ACC1]">
          Payroll
        </Link>
        <Link
          href="/superadmin/settings"
          className="block hover:text-[#00ACC1]"
        >
          Settings
        </Link>
      </nav>

      <button
        className="md:hidden mt-6 text-sm underline"
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
      >
        Close
      </button>
    </aside>
  );
}
