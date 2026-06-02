'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
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

type UseHROnboardingFlowsOptions = {
  pageSize?: number;
};

export function useHROnboardingFlows(options: UseHROnboardingFlowsOptions = {}) {
  const { companyId } = useHRSession();
  const { pageSize } = options;

  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const cursorsRef = useRef<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(
    new Map(),
  );

  const loadPage = useCallback(
    async (pageToLoad = 1) => {
      if (!companyId) {
        setFlows([]);
        setLoading(false);
        setPage(1);
        setHasNext(false);
        setHasPrev(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const baseQuery = query(
          collection(db, 'companies', companyId, 'onboardingFlows'),
          orderBy('createdAt', 'desc'),
        );

        const cursor =
          pageToLoad > 1 ? cursorsRef.current.get(pageToLoad - 1) : undefined;
        const paginatedQuery = pageSize
          ? cursor
            ? query(baseQuery, startAfter(cursor), limit(pageSize + 1))
            : query(baseQuery, limit(pageSize + 1))
          : baseQuery;

        const snap = await getDocs(paginatedQuery);
        const docs = pageSize ? snap.docs.slice(0, pageSize) : snap.docs;

        const data = docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<OnboardingFlow, 'id'>),
        }));

        setFlows(data);
        setPage(pageToLoad);
        setHasPrev(pageToLoad > 1);
        setHasNext(Boolean(pageSize && snap.docs.length > pageSize));
        cursorsRef.current.set(pageToLoad, docs[docs.length - 1] ?? null);
      } catch (err) {
        console.error('[useHROnboardingFlows] failed:', err);
        setFlows([]);
        setError('Unable to load onboarding flows.');
      } finally {
        setLoading(false);
      }
    },
    [companyId, pageSize],
  );

  useEffect(() => {
    cursorsRef.current = new Map();
    loadPage(1);
  }, [loadPage]);

  return {
    flows,
    loading,
    error,
    page,
    hasNext,
    hasPrev,
    nextPage: () => hasNext && loadPage(page + 1),
    prevPage: () => hasPrev && loadPage(page - 1),
    reload: () => loadPage(page),
  };
}