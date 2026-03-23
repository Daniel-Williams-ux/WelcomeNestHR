'use client';

import { motion } from 'framer-motion';
import { useCollaborate } from '@/hooks/useCollaborate';

export default function OrgChart({
  companyId,
  employeeId,
}: {
  companyId: string;
  employeeId: string;
}) {
  const { employees, loading } = useCollaborate(companyId, employeeId);

  return (
    <motion.section className="rounded-2xl shadow-sm bg-white dark:bg-gray-900 border p-6">
      <h2 className="text-lg font-semibold mb-4">Org Chart 🏢</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading team...</p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-gray-500">No organization data yet.</p>
      ) : (
        <ul className="space-y-3">
          {employees.map((emp: any) => (
            <li key={emp.id} className="p-3 rounded bg-gray-100">
              <p className="text-sm font-medium">{emp.name}</p>
              <p className="text-xs text-gray-500">{emp.role}</p>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}