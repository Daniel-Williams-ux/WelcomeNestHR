'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
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
            const flowRef = doc(
              db,
              'companies',
              companyId,
              'employees',
              docSnap.id,
              'onboardingFlows',
              flowId,
            );

            const flowSnap = await getDoc(flowRef);

            if (flowSnap.exists()) {
              const flowData = flowSnap.data() as any;

              const milestones = flowData.milestones ?? [];
              const tasks = milestones.flatMap((m: any) => m.tasks ?? []);

              const total = tasks.length;
              const completed = tasks.filter(
                (t: any) => t.completed === true,
              ).length;

              const percent =
                total > 0 ? Math.round((completed / total) * 100) : 0;

              progressPercent = percent;
              tasksCompleted = completed;
              tasksTotal = total;

              if (percent >= 80) currentMilestone = 'beyond';
              else if (percent >= 60) currentMilestone = '30days';
              else if (percent >= 40) currentMilestone = 'week1';
              else if (percent >= 20) currentMilestone = 'day1';
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

              <td className="p-3">{emp.progressPercent}%</td>

              <td className="p-3">{emp.currentMilestone}</td>

              <td className="p-3">
                {emp.tasksCompleted} / {emp.tasksTotal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}