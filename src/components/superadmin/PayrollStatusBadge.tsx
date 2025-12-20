// src/components/superadmin/PayrollStatusBadge.tsx
import React from 'react';

export default function PayrollStatusBadge({ status }: { status?: string }) {
  const s = (status || '').toLowerCase();
  if (!status || status === 'No Data') {
    return (
      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
        {status ?? '—'}
      </span>
    );
  }
  if (s.includes('complete') || s.includes('completed')) {
    return (
      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
        {status}
      </span>
    );
  }
  if (s.includes('pending') || s.includes('processing')) {
    return (
      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
        {status}
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
      {status}
    </span>
  );
}