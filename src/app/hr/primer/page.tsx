'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';


type Employee = {
  id: string; 
  uid: string;
  name: string;
  title?: string;
};

type Goal = {
  id: string;
  userId: string;
  status: string;
};

type EmployeeProgress = {
  userId: string;
  total: number;
  completed: number;
  progress: number;
};

export default function HRPrimerPage() {
    const { companyId } = useAuthContext();
    const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeesMap, setEmployeesMap] = useState<Record<string, Employee>>(
    {},
  );

  useEffect(() => {
    async function fetchData() {
      if (!companyId) return;

      try {
        const goalsRef = collection(db, `companies/${companyId}/primerGoals`);

        const snap = await getDocs(goalsRef);

        const goals: Goal[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Goal[];

        //  FETCH EMPLOYEES
        const empRef = collection(db, `companies/${companyId}/employees`);

        const empSnap = await getDocs(empRef);

        const empMap: Record<string, Employee> = {};

        empSnap.docs.forEach((doc) => {
          const data = doc.data();

          empMap[data.uid] = {
            id: doc.id, 
            uid: data.uid,
            name: data.name,
            title: data.title,
          };
        });

        setEmployeesMap(empMap);

        //  GROUP BY USER
        const map = new Map<string, Goal[]>();

        goals.forEach((goal) => {
          if (!map.has(goal.userId)) {
            map.set(goal.userId, []);
          }
          map.get(goal.userId)!.push(goal);
        });

        //  CALCULATE PROGRESS
        const result: EmployeeProgress[] = [];

        map.forEach((userGoals, userId) => {
          const total = userGoals.length;
          const completed = userGoals.filter(
            (g) => g.status === 'completed',
          ).length;

          const progress = total === 0 ? 0 : (completed / total) * 100;

          result.push({
            userId,
            total,
            completed,
            progress,
          });
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
            key={emp.userId}
            onClick={() =>
              router.push(`/hr/primer/${employeesMap[emp.userId]?.id}`)
            }
            className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium text-gray-900 dark:text-white">
                {employeesMap[emp.userId]?.name || 'Unknown User'}
              </p>

              <p className="text-xs text-gray-500">
                {employeesMap[emp.userId]?.title || 'No title'}
              </p>

              <p className="text-sm text-gray-500">
                {Math.round(emp.progress)}%
              </p>
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
