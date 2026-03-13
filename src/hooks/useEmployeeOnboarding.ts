'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  const companyId = user?.companyId;

  const [steps, setSteps] = useState<EmployeeOnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.employeeId || !companyId || !flowId) {
      setLoading(false);
      return;
    }

    async function load() {
      const flowRef = doc(
        db,
        'companies',
        companyId,
        'employees',
        user.employeeId,
        'onboardingFlows',
        flowId,
      );

      const flowSnap = await getDoc(flowRef);

      if (!flowSnap.exists()) {
        setSteps([]);
        setLoading(false);
        return;
      }

      const flowData = flowSnap.data() as any;
      const milestones = flowData.milestones ?? [];

      const tasks = milestones.flatMap((m: any) =>
        (m.tasks ?? []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description ?? undefined,
          order: m.order ?? 0,
          completed: t.completed === true,
        })),
      );

      setSteps(tasks);
      setLoading(false);
    }

    load();
  }, [user?.employeeId, companyId, flowId]);

  const toggleStepComplete = useCallback(
    async (stepId: string, completed: boolean) => {
      if (!user?.employeeId || !companyId || !flowId) return;

      const newCompleted = !completed;

      const flowRef = doc(
        db,
        'companies',
        companyId,
        'employees',
        user.employeeId,
        'onboardingFlows',
        flowId,
      );

      const flowSnap = await getDoc(flowRef);
      if (!flowSnap.exists()) return;

      const flowData = flowSnap.data() as any;
      const milestones = flowData.milestones ?? [];

      const updatedMilestones = milestones.map((m: any) => ({
        ...m,
        tasks: (m.tasks ?? []).map((t: any) =>
          t.id === stepId ? { ...t, completed: newCompleted } : t,
        ),
      }));

      await setDoc(
        flowRef,
        {
          milestones: updatedMilestones,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      const updatedSteps = steps.map((s) =>
        s.id === stepId ? { ...s, completed: newCompleted } : s,
      );

      setSteps(updatedSteps);
    },
    [steps, user?.employeeId, companyId, flowId],
  );

  return {
    steps,
    loading,
    toggleStepComplete,
  };
}