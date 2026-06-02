'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { calculatePrimerGamification } from '@/lib/primerGamification';


type Employee = {
  id: string; 
  uid?: string;
  name: string;
  title?: string;
  primerProgress?: {
    completed?: number;
    total?: number;
    percent?: number;
    xp?: number;
    level?: number;
    levelName?: string;
    badgeCount?: number;
  };
};

type Goal = {
  id: string;
  userId: string;
  status: string;
  phase?: '30' | '60' | '90';
  title?: string;
};

type EmployeeProgress = {
  employeeId: string;
  userId: string;
  name: string;
  title?: string;
  total: number;
  completed: number;
  progress: number;
  xp: number;
  level: number;
  levelName: string;
  badgeCount: number;
};

export default function HRPrimerPage() {
    const { companyId } = useAuthContext();
    const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!companyId) {
        setLoading(false);
        return;
      }

      try {
        const goalsRef = collection(db, `companies/${companyId}/primerGoals`);
        const empRef = collection(db, `companies/${companyId}/employees`);

        const [snap, empSnap] = await Promise.all([
          getDocs(goalsRef),
          getDocs(empRef),
        ]);

        const rawGoals: Goal[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Goal[];
        const goals = Array.from(
          new Map(
            rawGoals.map((goal: any) => [
              `${goal.userId}:${goal.phase}:${goal.title}`,
              goal,
            ]),
          ).values(),
        ) as Goal[];

        const employeeRows: Employee[] = empSnap.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id, 
            uid: data.uid || undefined,
            name: data.name || data.fullName || data.email || 'Unnamed employee',
            title: data.title,
            primerProgress: data.primer?.progress,
          };
        });

        const goalsByIdentity = new Map<string, Goal[]>();

        goals.forEach((goal) => {
          if (!goal.userId) return;
          const list = goalsByIdentity.get(goal.userId) ?? [];
          list.push(goal);
          goalsByIdentity.set(goal.userId, list);
        });

        const result: EmployeeProgress[] = employeeRows.map((employee) => {
          const identityKeys = Array.from(
            new Set([employee.uid, employee.id].filter(Boolean) as string[]),
          );
          const userGoals = Array.from(
            new Map(
              identityKeys
                .flatMap((key) => goalsByIdentity.get(key) ?? [])
                .map((goal) => [goal.id, goal]),
            ).values(),
          );
          const total = userGoals.length;
          const completed = userGoals.filter(
            (g) => g.status === 'completed',
          ).length;
          const cachedProgress = employee.primerProgress;

          const progress =
            total === 0
              ? cachedProgress?.percent ?? 0
              : (completed / total) * 100;
          const gamification = calculatePrimerGamification(userGoals);

          return {
            employeeId: employee.id,
            userId: employee.uid || employee.id,
            name: employee.name,
            title: employee.title,
            total: total || cachedProgress?.total || 0,
            completed: total ? completed : cachedProgress?.completed || 0,
            progress,
            xp: total ? gamification.xp : cachedProgress?.xp || 0,
            level: total ? gamification.level : cachedProgress?.level || 1,
            levelName:
              total ? gamification.levelName : cachedProgress?.levelName || 'New Starter',
            badgeCount:
              total ? gamification.badges.length : cachedProgress?.badgeCount || 0,
          };
        });

        setEmployees(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [companyId]);

  // ---------------- UI ----------------

  if (loading) {
    return <div className="p-6">Loading Primer Dashboard...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#FB8C00] mb-6">
        Primer Management
      </h1>

      {employees.length === 0 && (
        <p className="text-gray-500">No onboarding data yet</p>
      )}

      <div className="space-y-4">
        {employees.map((emp) => (
          <div
            key={emp.employeeId}
            onClick={() =>
              router.push(`/hr/primer/${emp.employeeId}`)
            }
            className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {emp.name}
                </p>
                <p className="text-xs text-gray-500">
                  {emp.title || 'No title'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-[#FB8C00]">
                  Level {emp.level} · {emp.xp} XP
                </p>
                <p className="text-xs text-gray-500">
                  {emp.levelName} · {emp.badgeCount} badges ·{' '}
                  {Math.round(emp.progress)}%
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#FB8C00] h-2 rounded-full"
                style={{ width: `${emp.progress}%` }}
              />
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {emp.completed} of {emp.total} goals completed
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
