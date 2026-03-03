import { useAuthContext } from '@/components/AuthProvider';

/**
 * Canonical HR context hook.
 * Safe for async auth + onboarding flows.
 */
export function useHRContext() {
  const { user, role, loading } = useAuthContext();

  const companyId = user?.companyId ?? null;

  return {
    user,
    role,
    companyId,
    loading,
    isReady: !loading && role === 'hr',
    hasCompany: !!companyId,
  };
}