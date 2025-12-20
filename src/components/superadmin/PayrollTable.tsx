// src/components/superadmin/PayrollTable.tsx
'use client';
import React from 'react';
import { PayrollRun } from '@/hooks/usePayrolls';
import PayrollStatusBadge from './PayrollStatusBadge';
import { motion } from 'framer-motion';

export default function PayrollTable({ runs }: { runs: PayrollRun[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-x-auto"
    >
      <table className="min-w-full text-sm text-gray-600">
        <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
          <tr>
            <th className="px-4 py-2 text-left">Company</th>
            <th className="px-4 py-2 text-left">Period</th>
            <th className="px-4 py-2 text-left">Last Run</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Employees</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr
              key={`${r.companyId}-${r.id}`}
              className="border-t hover:bg-gray-50 transition"
            >
              <td className="px-4 py-3 font-medium">
                {r.companyName ?? r.companyId}
              </td>
              <td className="px-4 py-3">{r.period ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {r.lastRun
                  ? new Date(r.lastRun).toLocaleString()
                  : r.createdAt?.toDate
                  ? r.createdAt.toDate().toLocaleString()
                  : '—'}
              </td>
              <td className="px-4 py-3">
                <PayrollStatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3">{r.employeesCount ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}