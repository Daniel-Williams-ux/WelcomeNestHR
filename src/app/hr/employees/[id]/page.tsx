// server component — safe with App Router
import React from 'react';
import EmployeeDetailClient from '@/components/hr/EmployeeDetailClient';

type Props = {
  params: { id: string };
};

export const metadata = {
  title: 'Employee — WelcomeNestHR',
};

export default function EmployeeDetailPage({ params }: Props) {
  return <EmployeeDetailClient employeeId={params.id} />;
}
