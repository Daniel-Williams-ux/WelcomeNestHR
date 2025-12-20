'use client';

import { useEmployeeById } from '@/hooks/useEmployeeById';
import EmployeeHeader from './EmployeeHeader';
import EmployeeTabs from './EmployeeTabs';

export default function EmployeeDetail({
  companyId,
  employeeId,
}: {
  companyId: string;
  employeeId: string;
}) {
  const { employee, loading, error } = useEmployeeById(companyId, employeeId);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!employee) return <div className="p-6">Employee not found.</div>;

  return (
    <div className="space-y-8">
      <EmployeeHeader employee={employee} />
      <EmployeeTabs employee={employee} companyId={companyId} />
    </div>
  );
}