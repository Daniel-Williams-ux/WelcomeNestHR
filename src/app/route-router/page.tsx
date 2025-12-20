'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function RoleRouter() {
  const { role, loading } = useUserAccess();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (role === 'superadmin') {
      router.replace('/superadmin');
    } else if (role === 'hr') {
      router.replace('/hr');
    } else {
      router.replace('/dashboard'); // employee default
    }
  }, [role, loading, router]);

  return <p className="p-6">Redirecting…</p>;
}