'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  const companyId = '744J9dEfPKRZObDwEkv2';

  const [steps, setSteps] = useState<EmployeeOnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const employeeId = user?.employeeId;
    if (!employeeId || !companyId || !flowId) {
      setLoading(false);
      return;
    }

    const flowRef = doc(
      db,
      'companies',
      companyId,
      'employees',
      employeeId,
      'onboardingFlows',
      flowId,
    );

    const unsubscribe = onSnapshot(flowRef, (snap) => {
      if (!snap.exists()) {
        setSteps([]);
        setLoading(false);
        return;
      }

      const flowData = snap.data() as any;

      const tasks = (flowData.milestones ?? [])
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .flatMap((m: any) =>
          (m.tasks ?? []).map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description ?? undefined,
            order: m.order ?? 0,
            completed: Boolean(t.completed), // 🔥 important
          })),
        );

      setSteps(tasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.employeeId, companyId, flowId]);

 const toggleStepComplete = useCallback(
   async (stepId: string, completed: boolean) => {
     if (!user?.uid || !companyId || !flowId) return;

     const newCompleted = !completed;

     const empQuery = query(
       collection(db, 'companies', companyId, 'employees'),
       where('uid', '==', user.uid),
     );

     const empSnap = await getDocs(empQuery);
     if (empSnap.empty) return;

     const employeeId = empSnap.docs[0].id;

     const flowRef = doc(
       db,
       'companies',
       companyId,
       'employees',
       employeeId,
       'onboardingFlows',
       flowId,
     );

     const flowSnap = await getDoc(flowRef);
     if (!flowSnap.exists()) return;

     const flowData = flowSnap.data() as any;

     const updatedMilestones = (flowData.milestones ?? []).map((m: any) => {
       const hasTask = (m.tasks ?? []).some((t: any) => t.id === stepId);

       if (!hasTask) return m; //  DO NOT TOUCH other milestones

       return {
         ...m,
         tasks: (m.tasks ?? []).map((t: any) =>
           t.id === stepId ? { ...t, completed: newCompleted } : t,
         ),
       };
     });

     await updateDoc(flowRef, {
       milestones: updatedMilestones,
       updatedAt: serverTimestamp(),
     });

     console.log('UPDATED IN FIRESTORE');

     // ✅ UI update
     const tasks = updatedMilestones.flatMap((m: any) =>
       (m.tasks ?? []).map((t: any) => ({
         id: t.id,
         title: t.title,
         description: t.description ?? undefined,
         order: m.order ?? 0,
         completed: t.completed === true,
       })),
     );

     setSteps(tasks);
   },
   [user?.uid, companyId, flowId],
 );

  return {
    steps,
    loading,
    toggleStepComplete,
  };
}