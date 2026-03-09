'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';

export function useEmployeeActiveFlow() {
  const { user } = useUserAccess();

  const [flowId, setFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    async function load() {
      const flowSnap = await getDocs(
        collection(db, 'users', user.uid, 'onboardingFlows'),
      );

      console.log('FLOW SNAP SIZE:', flowSnap.size);

      if (!flowSnap.empty) {
        const data = flowSnap.docs[0].data();
        setFlowId(data.flowId);
      } else {
        setFlowId(null);
      }

      setLoading(false);
    }

    load();
  }, [user?.uid]);

  return { flowId, loading };
}