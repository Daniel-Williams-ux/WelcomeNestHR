'use client';

import { useState } from 'react';
import { Employee } from '@/hooks/useEmployees';

const tabs = [
  'Overview',
  'Payroll',
  'Onboarding',
  'Compliance',
  'Documents',
  'Notes',
];

export default function EmployeeTabs({
  employee,
  companyId,
}: {
  employee: Employee;
  companyId: string;
}) {
  const [active, setActive] = useState('Overview');

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`pb-3 text-sm ${
              active === t
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6">
        {active === 'Overview' && (
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-semibold">Overview</h3>
            <p className="text-gray-600 mt-2">
              More detailed employee information will appear here.
            </p>
          </div>
        )}

        {active !== 'Overview' && (
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p>{active} content coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}