'use client';

import SuperAdminTopbar from '@/components/superadmin/SuperAdminTopbar';
import StatCard from '@/components/superadmin/StatCard';
import { Building2, Users, CreditCard, BarChart3 } from 'lucide-react';

export default function SuperAdminOverview() {
  return (
    <div className="flex flex-col gap-6 w-full overflow-x-hidden">
      {/* ---------- Topbar ---------- */}
      <SuperAdminTopbar />

      {/* ---------- Stats ---------- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Companies"
          value={125}
          delta="+8%"
          icon={<Building2 size={20} />}
        />
        <StatCard
          title="Users"
          value="3,452"
          delta="+1.5%"
          icon={<Users size={20} />}
        />
        <StatCard
          title="Billing Volume"
          value="$24,800"
          delta="+12%"
          icon={<CreditCard size={20} />}
        />
        <StatCard
          title="System Uptime"
          value="99.9%"
          delta="+0.1%"
          icon={<BarChart3 size={20} />}
        />
      </section>

      {/* ---------- Analytics Placeholder ---------- */}
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 overflow-hidden">
        <p className="text-center px-4">
          Analytics chart placeholder (coming soon)
        </p>
      </div>

      {/* ---------- Payroll + Recent Activity ---------- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-x-hidden">
        {/* Payroll Overview */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
              Payroll Overview
            </h2>
          </div>

          <div className="w-full">
            <table className="min-w-full text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-left">
                <tr>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Employees</th>
                  <th className="px-5 py-3">Last Payroll</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    company: 'TechNova Ltd',
                    employees: 42,
                    lastPayroll: 'Oct 5, 2025',
                    status: 'Completed',
                  },
                  {
                    company: 'HealthSync Inc',
                    employees: 28,
                    lastPayroll: 'Oct 8, 2025',
                    status: 'Pending',
                  },
                  {
                    company: 'EcoBuilders Co',
                    employees: 15,
                    lastPayroll: 'Oct 6, 2025',
                    status: 'Completed',
                  },
                  {
                    company: 'BrightWave AI',
                    employees: 63,
                    lastPayroll: 'Oct 9, 2025',
                    status: 'Processing',
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="px-5 py-3 font-medium">{row.company}</td>
                    <td className="px-5 py-3">{row.employees}</td>
                    <td className="px-5 py-3">{row.lastPayroll}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.status === 'Completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : row.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
              Recent Activity
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[
              {
                user: 'Jane Doe (Admin)',
                action: 'added new company “BrightWave AI”',
                time: '2 hours ago',
              },
              {
                user: 'John Smith',
                action: 'approved payroll for TechNova Ltd',
                time: '5 hours ago',
              },
              {
                user: 'Sarah Lee',
                action: 'updated company info for HealthSync Inc',
                time: '1 day ago',
              },
              {
                user: 'Admin Bot',
                action: 'system backup completed',
                time: '2 days ago',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
              >
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium">{item.user}</span> {item.action}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {item.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}