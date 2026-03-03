'use client';

import { useAuthContext } from '@/components/AuthProvider';

export function useUserAccess() {
  return useAuthContext();
}
