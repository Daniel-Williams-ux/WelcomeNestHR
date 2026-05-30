'use client';

import { useEffect, useState } from 'react';
import {
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';

export function useEmployeeActiveFlow() {
  const { user, companyId } = useUserAccess();
  const employeeId = user?.employeeId ?? null;

  const [flowId, setFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    if (!user?.uid || !companyId || !employeeId) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        const ref = doc(db, 'companies', companyId, 'employees', employeeId);

        unsubscribe = onSnapshot(ref, (snap) => {
          const data = snap.data();

          const primaryFlowId = data?.onboarding?.primaryFlowId ?? null;

          if (!cancelled) {
            setFlowId(primaryFlowId);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Active flow error:', err);
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user?.uid, companyId, employeeId]);

  return { flowId, loading };
}