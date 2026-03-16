'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';

export function useEmployeeActiveFlow() {
  const { user } = useUserAccess();
  // const companyId = user?.companyId;
  const companyId = '744J9dEfPKRZObDwEkv2';

  const [flowId, setFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('USER DATA', user);

  useEffect(() => {
    if (!user?.employeeId || !companyId) {
      setLoading(false);
      return;
    }

    const ref = doc(db, 'companies', companyId, 'employees', user.employeeId);

    const unsubscribe = onSnapshot(ref, (snap) => {
      const data = snap.data();
      console.log('EMPLOYEE DOC DATA:', data);

      const primaryFlowId = data?.onboarding?.primaryFlowId ?? null;

      setFlowId(primaryFlowId);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.employeeId, companyId]);

  return { flowId, loading };
}