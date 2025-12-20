'use client';

import Image from 'next/image';
import { Employee } from '@/hooks/useEmployees';

export default function EmployeeHeader({ employee }: { employee: Employee }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6">
      <div className="w-20 h-20 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xl font-semibold">
        {employee.name.charAt(0)}
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-semibold">{employee.name}</h2>
        <p className="text-gray-600">
          {employee.title} · {employee.department}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Status: <span className="font-medium">{employee.status}</span>
        </p>
      </div>

      <button className="px-4 py-2 rounded-md border text-sm">Edit</button>
    </div>
  );
}