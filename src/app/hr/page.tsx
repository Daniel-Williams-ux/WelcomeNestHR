'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  BookOpenCheck,
  ClipboardCheck,
  MessageSquare,
  Plus,
  Users,
  WalletCards,
} from 'lucide-react';
import { useHRSession } from '@/hooks/useHRSession';
import { useEmployeeCount } from '@/hooks/useEmployees';
import { useHROnboardingFlowCount } from '@/hooks/useHROnboardingFlows';

const quickActions = [
  {
    title: 'Add employee',
    description: 'Create an employee profile and invite them to join.',
    href: '/hr/employees',
    icon: Plus,
  },
  {
    title: 'Create onboarding flow',
    description: 'Build a structured journey for new hires.',
    href: '/hr/onboarding/new',
    icon: BookOpenCheck,
  },
  {
    title: 'Review compliance',
    description: 'Track assignments and required training.',
    href: '/hr/compliance',
    icon: ClipboardCheck,
  },
];

export default function HRPage() {
  const { companyId, hasCompany } = useHRSession();
  const { totalEmployees, loading: employeesLoading } = useEmployeeCount(companyId || '');
  const { totalFlows, loading: flowsLoading } = useHROnboardingFlowCount(companyId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[#004d59] to-[#00798a] p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
          HR command center
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Keep every employee journey on track.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50">
              Manage onboarding, employee records, payroll readiness, and culture
              workflows from one place.
            </p>
          </div>
          <Link
            href="/hr/employees"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#004d59] transition hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <Users size={16} aria-hidden="true" />
            Manage employees
          </Link>
        </div>
      </section>

      {!hasCompany && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your HR account is not linked to a company yet. Ask a superadmin to
          verify the invitation or company assignment.
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Employees"
          value={employeesLoading ? '...' : totalEmployees ?? 0}
          description="Active company records"
          icon={<Users size={20} aria-hidden="true" />}
        />
        <StatCard
          title="Onboarding flows"
          value={flowsLoading ? '...' : totalFlows ?? 0}
          description="Reusable HR journeys"
          icon={<BookOpenCheck size={20} aria-hidden="true" />}
        />
        <StatCard
          title="Payroll"
          value="Ready"
          description="Run and approve payroll"
          icon={<WalletCards size={20} aria-hidden="true" />}
        />
        <StatCard
          title="Messages"
          value="Open"
          description="Employee communication"
          icon={<MessageSquare size={20} aria-hidden="true" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-[#008FA1]">
                <Icon size={20} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                {action.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {action.description}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
        <div className="text-[#00ACC1]">{icon}</div>
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
