'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';

export type EmployeeOnboardingStep = {
  id: string;
  title: string;
  description?: string;
  order: number;
  completed: boolean;
};

export function useEmployeeOnboarding(flowId: string) {
  const { user } = useUserAccess();
  const companyId = user?.companyId; // ✅ FIX: employee source of truth

  const [steps, setSteps] = useState<EmployeeOnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !companyId || !flowId) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);

      // Load HR checklist
      const checklistQuery = query(
        collection(
          db,
          'companies',
          companyId,
          'onboardingFlows',
          flowId,
          'checklistItems',
        ),
        orderBy('order', 'asc'),
      );

      const checklistSnap = await getDocs(checklistQuery);

      // Load employee progress
      const progressSnap = await getDocs(
        collection(
          db,
          'users',
          user.uid,
          'onboardingProgress',
          flowId,
          'items',
        ),
      );

      const progressMap = new Map<string, boolean>();
      progressSnap.forEach((doc) => {
        progressMap.set(doc.id, doc.data().completed === true);
      });

      const merged = checklistSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description || undefined,
          order: data.order,
          completed: progressMap.get(doc.id) ?? false,
        };
      });

      setSteps(merged);
      setLoading(false);
    }

    load();
  }, [user?.uid, companyId, flowId]);

  const toggleStepComplete = useCallback(
    async (stepId: string, completed: boolean) => {
      if (!user?.uid || !flowId) return;

      await setDoc(
        doc(
          db,
          'users',
          user.uid,
          'onboardingProgress',
          flowId,
          'items',
          stepId,
        ),
        {
          completed: !completed,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setSteps((prev) =>
        prev.map((s) =>
          s.id === stepId ? { ...s, completed: !completed } : s,
        ),
      );
    },
    [user?.uid, flowId],
  );

  return {
    steps,
    loading,
    toggleStepComplete,
  };
}
