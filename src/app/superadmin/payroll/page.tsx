'use client';

import { motion } from 'framer-motion';
import {
  Wallet,
  Users,
  Building2,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SuperAdminPayrollPage() {
  return (
    <motion.main
      className="p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payroll Overview</h1>
        <p className="text-sm text-gray-500">
          System-wide payroll readiness, adoption, and compliance visibility
          (Superadmin only)
        </p>
      </header>

      {/* METRICS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Companies with Payroll"
          value="0"
          description="Payroll fully configured"
          icon={Building2}
        />
        <MetricCard
          title="Employees on Payroll"
          value="0"
          description="Across all companies"
          icon={Users}
        />
        <MetricCard
          title="Payroll Status"
          value="Not Live"
          description="Execution disabled"
          icon={Clock}
        />
        <MetricCard
          title="Compliance"
          value="Protected"
          description="Audit & approvals enforced"
          icon={ShieldCheck}
        />
      </section>

      {/* LOWER GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PAYROLL READINESS */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Payroll Readiness
            </h2>

            <div className="space-y-3 text-sm">
              <Row label="Payroll Enabled Companies" value="0" />
              <Row label="Pending Setup" value="All companies" />
              <Row label="Supported Regions" value="Not configured" />
              <Row label="Next Payroll Cycle" value="—" />
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Payroll setup is performed at the company level. Superadmins
              monitor readiness and adoption but do not execute payroll actions.
            </p>
          </CardContent>
        </Card>

        {/* SAFETY & GOVERNANCE */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <AlertTriangle size={16} />
              Governance & Safety
            </div>

            <div className="space-y-3 text-sm">
              <StatusRow
                label="Payroll Execution"
                value="Disabled"
                tone="warning"
              />
              <StatusRow
                label="Approval Flow Enforcement"
                value="Enabled"
                tone="success"
              />
              <StatusRow label="Audit Logging" value="Enabled" tone="success" />
              <StatusRow
                label="Direct Payout Access"
                value="Restricted"
                tone="neutral"
              />
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Payroll execution, payouts, and employee compensation management
              are intentionally restricted to prevent accidental or unauthorized
              system-wide impact.
            </p>
          </CardContent>
        </Card>
      </section>
    </motion.main>
  );
}

/* -------------------------
   REUSABLE COMPONENTS
-------------------------- */

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <Icon size={22} className="text-gray-400" />
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'neutral';
}) {
  const toneMap = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${toneMap[tone]}`}>{value}</span>
    </div>
  );
}