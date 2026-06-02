'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useHRSession } from './useHRSession';

export type OnboardingFlow = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export function useHROnboardingFlowCount(companyId?: string | null) {
  const [totalFlows, setTotalFlows] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!companyId) {
      setTotalFlows(null);
      setLoading(false);
      setError(null);
      return;
    }

    async function loadCount() {
      setLoading(true);
      setError(null);

      try {
        const q = query(collection(db, 'companies', companyId!, 'onboardingFlows'));
        const snap = await getCountFromServer(q);

        if (!cancelled) {
          setTotalFlows(snap.data().count ?? 0);
        }
      } catch (err) {
        console.error('[useHROnboardingFlowCount] failed:', err);
        if (!cancelled) {
          setTotalFlows(null);
          setError('Unable to load onboarding flow count.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCount();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { totalFlows, loading, error };
}

export function useHROnboardingFlows() {
  const { companyId } = useHRSession();

  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!companyId) {
      setFlows([]);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const q = query(
          collection(db, 'companies', companyId!, 'onboardingFlows'),
          orderBy('createdAt', 'desc'),
        );

        const snap = await getDocs(q);

        if (cancelled) return;

        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<OnboardingFlow, 'id'>),
        }));

        setFlows(data);
      } catch (err) {
        if (!cancelled) {
          console.error('[useHROnboardingFlows] failed:', err);
          setFlows([]);
          setError('Unable to load onboarding flows.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { flows, loading, error };
}