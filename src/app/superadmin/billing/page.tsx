'use client';

import { motion } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  Building2,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SuperAdminBillingPage() {
  return (
    <motion.main
      className="p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Platform Billing</h1>
        <p className="text-sm text-gray-500">
          System-wide billing visibility and subscription health (Superadmin
          only)
        </p>
      </header>

      {/* METRICS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Revenue"
          value="$0.00"
          icon={DollarSign}
          description="Lifetime revenue"
        />
        <MetricCard
          title="Monthly Recurring Revenue"
          value="$0.00"
          icon={Activity}
          description="Current MRR"
        />
        <MetricCard
          title="Active Subscriptions"
          value="0"
          icon={CreditCard}
          description="Paying companies"
        />
        <MetricCard
          title="Trial Companies"
          value="2"
          icon={Building2}
          description="Currently on trial"
        />
      </section>

      {/* LOWER GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PLAN DISTRIBUTION */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Plan Distribution
            </h2>

            <div className="space-y-3 text-sm">
              <Row label="Trial Plan" value="2 companies" />
              <Row label="Platinum Plan" value="0 companies" />
              <Row label="Canceled" value="0 companies" />
            </div>
          </CardContent>
        </Card>

        {/* BILLING PROVIDER */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ShieldCheck size={16} />
              Billing Provider
            </div>

            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Primary Provider</span>
                <span className="font-medium text-gray-800">Stripe</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mode</span>
                <span className="text-green-600 font-medium">Live</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currency</span>
                <span className="font-medium text-gray-800">USD</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Billing actions such as refunds, cancellations, and plan changes
              are intentionally managed outside the application to prevent
              accidental system-wide impact.
            </p>
          </CardContent>
        </Card>
      </section>
    </motion.main>
  );
}

/* -------------------------
   SMALL REUSABLE COMPONENTS
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
