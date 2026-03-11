'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';

type EmployeeProgress = {
  employeeId: string;
  name: string;
  progressPercent?: number;
  currentMilestone?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
};

export default function HROnboardingProgressPage() {
  const { user } = useUserAccess();
  const companyId = user?.companyId;

  const [employees, setEmployees] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const unsubscribe = onSnapshot(
      collection(db, 'companies', companyId, 'employees'),
      async (snap) => {
        const list: EmployeeProgress[] = [];

        for (const docSnap of snap.docs) {
          const data = docSnap.data();

          let progressPercent = 0;
          let currentMilestone = 'preboarding';
          let tasksCompleted = 0;
          let tasksTotal = 0;

          const flowId = data?.onboarding?.primaryFlowId;

          if (flowId) {
            const progressRef = collection(
              db,
              'companies',
              companyId,
              'employees',
              docSnap.id,
              'onboardingFlows',
              flowId,
              'progress',
            );

            const progressSnap = await getDocs(progressRef);

            if (!progressSnap.empty) {
              const progress = progressSnap.docs[0].data();

              progressPercent = progress.progressPercent ?? 0;
              currentMilestone = progress.currentMilestone ?? 'preboarding';
              tasksCompleted = progress.tasksCompleted ?? 0;
              tasksTotal = progress.tasksTotal ?? 0;
            }
          }

          list.push({
            employeeId: docSnap.id,
            name: data.name ?? 'Unnamed',
            progressPercent,
            currentMilestone,
            tasksCompleted,
            tasksTotal,
          });
        }

        setEmployees(list);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [companyId]);

  if (loading) {
    return <div className="p-6">Loading onboarding progress...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Employee Onboarding Progress
      </h1>

      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Employee</th>
            <th className="p-3 text-left">Progress</th>
            <th className="p-3 text-left">Milestone</th>
            <th className="p-3 text-left">Tasks</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => (
            <tr key={emp.employeeId} className="border-t">
              <td className="p-3">{emp.name}</td>

              <td className="p-3">
                {emp.progressPercent !== undefined
                  ? `${emp.progressPercent}%`
                  : '—'}
              </td>

              <td className="p-3">{emp.currentMilestone ?? '—'}</td>

              <td className="p-3">
                {emp.tasksCompleted !== undefined
                  ? `${emp.tasksCompleted} / ${emp.tasksTotal}`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}