import { useEffect, useState } from 'react';
import {
  doc,
  collection,
  getDoc,
  getDocs,
  updateDoc,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';
import {
  startOffboarding as startOffboardingAction,
  completeOffboardingTask,
} from '@/lib/offboarding';
import { OFFBOARDING_CHECKLIST_V1 } from '@/constants/offboardingChecklist';

export interface OffboardingRecord {
  status: 'in_progress' | 'completed';
  startedAt: unknown;
  completedAt?: unknown;
  checklistVersion: number;
}

export interface OffboardingTask {
  id: string;
  key: string;
  title: string;
  description?: string;
  order: number;
  completed: boolean;
  completedAt?: unknown;
}

export function useOffboarding(employeeId: string) {
  const { user } = useUserAccess();

  const [offboarding, setOffboarding] = useState<OffboardingRecord | null>(
    null,
  );
  const [tasks, setTasks] = useState<OffboardingTask[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * ------------------------------------------------------
   * LOAD DATA (SINGLE SOURCE OF TRUTH)
   * ------------------------------------------------------
   */
  useEffect(() => {
    if (!user || !user.companyId || !employeeId) return;

    async function load() {
      setLoading(true);

      const companyId = user.companyId;

      const offboardingRef = doc(
        db,
        'companies',
        companyId,
        'employees',
        employeeId,
        'offboarding',
        'record',
      );

      const offboardingSnap = await getDoc(offboardingRef);

      if (!offboardingSnap.exists()) {
        setOffboarding(null);
        setTasks([]);
        setLoading(false);
        return;
      }

      const offboardingData = offboardingSnap.data() as OffboardingRecord;
      setOffboarding(offboardingData);

      const tasksCol = collection(
        db,
        'companies',
        companyId,
        'employees',
        employeeId,
        'offboardingTasks',
      );

      let tasksSnap = await getDocs(tasksCol);

      /**
       * 🔐 GUARANTEE TASKS EXIST
       * If offboarding exists but tasks are missing,
       * automatically seed checklist (idempotent).
       */
      if (tasksSnap.empty) {
        for (const task of OFFBOARDING_CHECKLIST_V1) {
          await setDoc(doc(tasksCol), {
            ...task,
            completed: false,
            createdAt: Timestamp.now(),
          });
        }

        // Re-fetch after seeding
        tasksSnap = await getDocs(tasksCol);
      }

      const list: OffboardingTask[] = tasksSnap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<OffboardingTask, 'id'>),
        }))
        .sort((a, b) => a.order - b.order);

      setTasks(list);
      setLoading(false);
    }

    load();
  }, [user, employeeId]);

  /**
   * ------------------------------------------------------
   * ACTIONS
   * ------------------------------------------------------
   */
  async function startOffboarding(companyId: string) {
    if (!user) throw new Error('Not authenticated');
    await startOffboardingAction(companyId, employeeId, user.uid);
  }

  /**
   * ------------------------------------------------------
   * COMPLETE SINGLE TASK (OPTIMISTIC)
   * ------------------------------------------------------
   */
  async function completeTask(taskId: string) {
    if (!user || !user.companyId) {
      throw new Error('Not authenticated');
    }

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: true,
              completedAt: Timestamp.now(),
            }
          : task,
      ),
    );

    await completeOffboardingTask(user.companyId, employeeId, taskId, user.uid);
  }

  /**
   * ------------------------------------------------------
   * FINALIZE OFFBOARDING
   * ------------------------------------------------------
   */
  async function finalizeOffboarding() {
    if (!user || !user.companyId) {
      throw new Error('Not authenticated');
    }

    if (tasks.some((t) => !t.completed)) {
      throw new Error(
        'All tasks must be completed before finalizing offboarding.',
      );
    }

    const companyId = user.companyId;

    await updateDoc(
      doc(
        db,
        'companies',
        companyId,
        'employees',
        employeeId,
        'offboarding',
        'record',
      ),
      {
        status: 'completed',
        completedAt: Timestamp.now(),
      },
    );

    await updateDoc(doc(db, 'companies', companyId, 'employees', employeeId), {
      status: 'Exited',
      exitedAt: Timestamp.now(),
    });

    setOffboarding((prev) => (prev ? { ...prev, status: 'completed' } : prev));
  }

  return {
    offboarding,
    tasks,
    loading,
    startOffboarding,
    completeTask,
    finalizeOffboarding,
  };
}
