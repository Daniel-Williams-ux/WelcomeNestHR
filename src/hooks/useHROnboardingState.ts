'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useHRSession } from '@/hooks/useHRSession';

export type HROnboardingState = 'NO_COMPANY' | 'NO_FLOWS' | 'HAS_FLOWS';

type Result = {
  state: HROnboardingState;
  loading: boolean;
};

export function useHROnboardingState(): Result {
  const { companyId, loading: sessionLoading } = useHRSession();

  const [state, setState] = useState<HROnboardingState>('NO_COMPANY');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;

    // 1️⃣ No company → onboarding impossible
    if (!companyId) {
      setState('NO_COMPANY');
      setLoading(false);
      return;
    }

    // 2️⃣ Company exists → check onboarding flows
    async function checkFlows() {
      try {
        const q = query(
          collection(db, 'companies', companyId, 'onboardingFlows'),
          limit(1),
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          setState('NO_FLOWS');
        } else {
          setState('HAS_FLOWS');
        }
      } catch (err) {
        console.error('[useHROnboardingState] failed:', err);
        setState('NO_FLOWS'); // safe fallback
      } finally {
        setLoading(false);
      }
    }

    checkFlows();
  }, [companyId, sessionLoading]);

  return { state, loading };
}