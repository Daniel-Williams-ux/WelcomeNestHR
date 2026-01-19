import { useEffect, useState } from 'react';
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export type OffboardingStatus = 'initiated' | 'in_progress' | 'completed';

export interface Offboarding {
  userId: string;
  companyId: string;
  status: OffboardingStatus;
  initiatedBy: string;
  initiatedAt: Timestamp;
  completedAt?: Timestamp;
}

export interface OffboardingTask {
  id: string;
  title: string;
  description?: string;
  assignedTo: 'employee' | 'hr';
  completed: boolean;
  completedAt?: Timestamp;
  createdAt: Timestamp;
}

export function useOffboarding(targetUserId: string) {
  const { user } = useAuth();
  const [offboarding, setOffboarding] = useState<Offboarding | null>(null);
  const [tasks, setTasks] = useState<OffboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------
  // Load offboarding + tasks
  // ------------------------------------------------
  useEffect(() => {
    if (!user || !targetUserId) return;

    async function load() {
      try {
        setLoading(true);

        const offboardingRef = doc(db, 'users', targetUserId, 'offboarding');

        const offboardingSnap = await getDoc(offboardingRef);

        if (!offboardingSnap.exists()) {
          setOffboarding(null);
          setTasks([]);
          return;
        }

        const offboardingData = offboardingSnap.data() as Offboarding;
        setOffboarding(offboardingData);

        const tasksRef = collection(
          db,
          'users',
          targetUserId,
          'offboarding',
          'tasks'
        );

        const tasksSnap = await getDocs(tasksRef);

        const taskList: OffboardingTask[] = tasksSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<OffboardingTask, 'id'>),
        }));

        setTasks(taskList);
      } catch (err) {
        console.error(err);
        setError('Failed to load offboarding data.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, targetUserId]);

  // ------------------------------------------------
  // HR: Start Offboarding
  // ------------------------------------------------
  async function startOffboarding(companyId: string) {
    if (!user) throw new Error('Not authenticated');

    const offboardingRef = doc(db, 'users', targetUserId, 'offboarding');

    await setDoc(offboardingRef, {
      userId: targetUserId,
      companyId,
      status: 'initiated',
      initiatedBy: user.uid,
      initiatedAt: Timestamp.now(),
    });

    const defaultTasks = [
      { title: 'Return company assets', assignedTo: 'employee' },
      { title: 'Handover documentation', assignedTo: 'employee' },
      { title: 'Final payroll processed', assignedTo: 'hr' },
      { title: 'Disable system access', assignedTo: 'hr' },
    ];

    for (const task of defaultTasks) {
      const taskRef = doc(
        collection(db, 'users', targetUserId, 'offboarding', 'tasks')
      );

      await setDoc(taskRef, {
        title: task.title,
        assignedTo: task.assignedTo,
        completed: false,
        createdAt: Timestamp.now(),
      });
    }
  }

  // ------------------------------------------------
  // Employee / HR: Complete Task
  // ------------------------------------------------
  async function completeTask(taskId: string) {
    const taskRef = doc(
      db,
      'users',
      targetUserId,
      'offboarding',
      'tasks',
      taskId
    );

    await updateDoc(taskRef, {
      completed: true,
      completedAt: Timestamp.now(),
    });
  }

  // ------------------------------------------------
  // HR: Complete Offboarding (logic gate later)
  // ------------------------------------------------
  async function completeOffboarding() {
    if (!user) throw new Error('Not authenticated');

    const offboardingRef = doc(db, 'users', targetUserId, 'offboarding');

    await updateDoc(offboardingRef, {
      status: 'completed',
      completedAt: Timestamp.now(),
    });
  }

  return {
    offboarding,
    tasks,
    loading,
    error,

    // actions
    startOffboarding,
    completeTask,
    completeOffboarding,
  };
}