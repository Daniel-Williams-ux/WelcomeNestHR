'use client';

import Link from 'next/link';

export function HRSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="h-full bg-[#004d59] text-white p-6">
      <h2 className="text-xl font-bold mb-6">HR Dashboard</h2>

      <nav className="space-y-4">
        <Link
          href="/hr"
          onClick={onNavigate}
          className="block hover:text-[#00ACC1]"
        >
          Overview
        </Link>

        <Link
          href="/hr/employees"
          onClick={onNavigate}
          className="block hover:text-[#00ACC1]"
        >
          Employees
        </Link>

        <Link
          href="/hr/onboarding"
          onClick={onNavigate}
          className="block hover:text-[#00ACC1]"
        >
          Onboarding
        </Link>

        <Link
          href="/hr/lifesync"
          onClick={onNavigate}
          className="block hover:text-[#00ACC1]"
        >
          LifeSync
        </Link>

        <Link
          href="/hr/compliance"
          onClick={onNavigate}
          className="block hover:text-[#00ACC1]"
        >
          Compliance
        </Link>

        <Link
          href="/hr/payroll"
          onClick={onNavigate}
          className="block hover:text-[#00ACC1]"
        >
          Payroll
        </Link>
      </nav>
    </div>
  );
}