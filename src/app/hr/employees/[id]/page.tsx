// server component — safe to use with app router params and avoids client hooks on server
import React from 'react';
import HRShell from '@/components/hr/HRShell';
import EmployeeDetailClient from '@/components/hr/EmployeeDetailClient';

type Props = {
  params: { id: string };
};

export const metadata = {
  title: 'Employee — WelcomeNestHR',
};

export default function EmployeeDetailPage({ params }: Props) {
  const { id } = params;
  return (
    <HRShell>
      {/* EmployeeDetailClient is a client component that accepts employeeId */}
      <EmployeeDetailClient employeeId={id} />
    </HRShell>
  );
}