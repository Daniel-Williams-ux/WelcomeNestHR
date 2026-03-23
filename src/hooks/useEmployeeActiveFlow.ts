'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';

export function useEmployeeActiveFlow() {
  const { user } = useUserAccess();

  const [flowId, setFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        //  1. Get fresh user doc (source of truth)
        const userSnap = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', user.uid)),
        );

        if (userSnap.empty) {
          setLoading(false);
          return;
        }

        const userData = userSnap.docs[0].data();
        const companyId = userData.companyId;

        if (!companyId) {
          setLoading(false);
          return;
        }

        //  2. Resolve employee via uid (CONSISTENT ARCHITECTURE)
        const empQuery = query(
          collection(db, 'companies', companyId, 'employees'),
          where('uid', '==', user.uid),
        );

        const empSnap = await getDocs(empQuery);

        if (empSnap.empty) {
          console.log('❌ Employee not found');
          setLoading(false);
          return;
        }

        const employeeDoc = empSnap.docs[0];
        const employeeId = employeeDoc.id;

        //  3. Subscribe to employee doc
        const ref = doc(db, 'companies', companyId, 'employees', employeeId);

        const unsubscribe = onSnapshot(ref, (snap) => {
          const data = snap.data();

          console.log(' Employee onboarding:', data?.onboarding);

          const primaryFlowId = data?.onboarding?.primaryFlowId ?? null;

          setFlowId(primaryFlowId);
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error('Active flow error:', err);
        setLoading(false);
      }
    };

    const unsubPromise = init();

    return () => {
      if (typeof unsubPromise === 'function') {
        unsubPromise();
      }
    };
  }, [user?.uid]);

  return { flowId, loading };
}