'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';

type EmployeeProgress = {
  employeeId: string;
  name: string;
  progressPercent: number;
  currentMilestone: string;
  tasksCompleted: number;
  tasksTotal: number;
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

        for (const empDoc of snap.docs) {
          const empData = empDoc.data();
          const employeeId = empDoc.id;

          let percent = 0;
          let completed = 0;
          let total = 0;
          let milestone = 'Preboarding';

          const flowsRef = collection(
            db,
            'companies',
            companyId,
            'employees',
            employeeId,
            'onboardingFlows',
          );

          const flowsSnap = await getDocs(flowsRef);

          if (!flowsSnap.empty) {
            const flowData = flowsSnap.docs[0].data() as any;

            const milestones = flowData.milestones ?? [];
            const tasks = milestones.flatMap((m: any) => m.tasks ?? []);

            total = tasks.length;

            completed = tasks.filter((t: any) => t.completed === true).length;

            percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            const activeMilestone = milestones.find((m: any) =>
              (m.tasks ?? []).some((t: any) => !t.completed),
            );

            const labels = [
              'Preboarding',
              'Day 1',
              'Week 1',
              '30 Days',
              'Beyond',
            ];

            milestone = labels[activeMilestone?.order ?? 4] ?? 'Beyond';
          }

          list.push({
            employeeId,
            name: empData.name ?? 'Employee',
            progressPercent: percent,
            currentMilestone: milestone,
            tasksCompleted: completed,
            tasksTotal: total,
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
