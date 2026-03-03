'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useHRSession } from './useHRSession';

export type OnboardingFlow = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export function useHROnboardingFlows() {
  const { companyId } = useHRSession();

  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    async function load() {
      const q = query(
        collection(db, 'companies', companyId, 'onboardingFlows'),
        orderBy('createdAt', 'desc'),
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<OnboardingFlow, 'id'>),
      }));

      setFlows(data);
      setLoading(false);
    }

    load();
  }, [companyId]);

  return { flows, loading };
}