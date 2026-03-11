// src/lib/onboarding/getHROnboardingOverview.ts
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export interface HROnboardingFlowOverview {
  flowId: string;
  name: string;
  type: 'primary' | 'secondary';
  assignedEmployees: number;
  averageCompletion: number; // 0–100
}

export async function getHROnboardingOverview(companyId: string) {
  // 1 Get onboarding flows for this company
  const flowsRef = collection(db, 'companies', companyId, 'onboardingFlows');
  const flowsSnap = await getDocs(flowsRef);

  // 22 Get employees for this company (CORRECT PATH)
  const employeesRef = collection(db, 'companies', companyId, 'employees');
  const employeesSnap = await getDocs(employeesRef);

  const results: HROnboardingFlowOverview[] = [];

  for (const flowDoc of flowsSnap.docs) {
    const flowId = flowDoc.id;
    const flowData = flowDoc.data() as {
      name: string;
      type: 'primary' | 'secondary';
    };

    let assigned = 0;
    let totalProgress = 0;

    await Promise.all(
      employeesSnap.docs.map(async (emp) => {
        // 3️⃣ Employee onboarding data MUST live under /users
        const userId = emp.id;

        const userFlowsRef = collection(db, 'users', userId, 'onboarding');

        const userFlowsSnap = await getDocs(userFlowsRef);

        const matchingFlow = userFlowsSnap.docs.find(
          (d) => d.data().flowId === flowId,
        );

        if (!matchingFlow) return;

        assigned++;

        const data = matchingFlow.data() as {
          milestones?: { tasks?: { completed: boolean }[] }[];
        };

        const tasks = data.milestones?.flatMap((m) => m.tasks ?? []) ?? [];

        const completed = tasks.filter((t) => t.completed).length;

        const percent =
          tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

        totalProgress += percent;
      }),
    );

    results.push({
      flowId,
      name: flowData.name,
      type: flowData.type,
      assignedEmployees: assigned,
      averageCompletion:
        assigned > 0 ? Math.round(totalProgress / assigned) : 0,
    });
  }

  return results;
}