'use client';

import { useAuthContext } from '@/components/AuthProvider';

export function useHRSession() {
  const { user, role, loading } = useAuthContext();

  const companyId = user?.companyId ?? null;

  return {
    user,
    role,
    companyId,
    hasCompany: Boolean(companyId),
    loading,
    isHR: role === 'hr',
  };
}
