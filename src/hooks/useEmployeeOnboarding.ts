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
import { calcProgress } from '@/lib/onboarding/calcProgress';

export type EmployeeOnboardingStep = {
  id: string;
  title: string;
  description?: string;
  order: number;
  completed: boolean;
};

export function useEmployeeOnboarding(flowId: string) {
  const { user } = useUserAccess();
  const companyId = user?.companyId; //  FIX: employee source of truth

  const [steps, setSteps] = useState<EmployeeOnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.employeeId || !companyId || !flowId) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);

      // Load HR checklist
      const checklistQuery = collection(
        db,
        'companies',
        companyId,
        'onboardingFlows',
        flowId,
        'checklistItems',
      );
      const checklistSnap = await getDocs(checklistQuery);

      // Load employee progress
      const progressSnap = await getDocs(
        collection(
          db,
          'companies',
          companyId,
          'employees',
          user.employeeId,
          'onboardingFlows',
          flowId,
          'progress',
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
  }, [user?.employeeId, companyId, flowId]);

  const toggleStepComplete = useCallback(
    async (stepId: string, completed: boolean) => {
      if (!user?.employeeId || !companyId || !flowId) return;

      const newCompleted = !completed;

      // 1 Update Firestore task progress
      await setDoc(
        doc(
          db,
          'companies',
          companyId,
          'employees',
          user.employeeId,
          'onboardingFlows',
          flowId,
          'progress',
          stepId,
        ),
        {
          completed: newCompleted,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // 2 Build updated steps locally
      const updatedSteps = steps.map((s) =>
        s.id === stepId ? { ...s, completed: newCompleted } : s,
      );

      // 3 Update UI
      setSteps(updatedSteps);

      // 4 Calculate progress summary
      const progress = calcProgress(updatedSteps);

      // 5 Persist progress summary
      await setDoc(
        doc(
          db,
          'companies',
          companyId,
          'employees',
          user.employeeId,
          'onboardingFlows',
          flowId,
        ),
        {
          progressPercent: progress.percent,
          tasksCompleted: progress.completed,
          tasksTotal: progress.total,
          currentMilestone: progress.milestone,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      await setDoc(
        doc(db, 'companies', companyId, 'employees', user.employeeId),
        {
          onboardingProgress: {
            progressPercent: progress.percent,
            tasksCompleted: progress.completed,
            tasksTotal: progress.total,
            currentMilestone: progress.milestone,
          },
        },
        { merge: true },
      );
    },
    [steps, user?.employeeId, companyId, flowId],
  );

  return {
    steps,
    loading,
    toggleStepComplete,
  };
}
