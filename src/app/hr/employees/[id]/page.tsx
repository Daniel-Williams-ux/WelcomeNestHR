// server component — App Router compliant
import React from 'react';
import EmployeeDetailClient from '@/components/hr/EmployeeDetailClient';

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: 'Employee — WelcomeNestHR',
};

export default async function EmployeeDetailPage({ params }: Props) {
  const { id } = await params;
  return <EmployeeDetailClient employeeId={id} />;
}
