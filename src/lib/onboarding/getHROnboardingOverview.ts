// src/lib/onboarding/getHROnboardingOverview.ts
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { calcProgress } from './calcProgress';
import { getMilestoneStatuses } from './getMilestoneStatuses';

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

  // 2 Get employees for this company (CORRECT PATH)
  const employeesRef = collection(db, 'companies', companyId, 'employees');
  const employeesSnap = await getDocs(employeesRef);

  const results: HROnboardingFlowOverview[] = [];

  for (const flowDoc of flowsSnap.docs) {
    const flowId = flowDoc.id;
    const flowData = flowDoc.data() as {
      name: string;
      type: 'primary' | 'secondary';
      milestones?: { id: string; triggerPercent?: number }[];
    };

    let assigned = 0;
    let totalProgress = 0;

    await Promise.all(
      employeesSnap.docs.map(async (emp) => {
        // 3 Employee onboarding data MUST live under /users
        const userId = emp.id;

        const userFlowsRef = collection(
          db,
          'companies',
          companyId,
          'employees',
          userId,
          'onboardingFlows',
        );

        const userFlowsSnap = await getDocs(userFlowsRef);

        const matchingFlow = userFlowsSnap.docs.find((d) => d.id === flowId);

        if (!matchingFlow) return;

        assigned++;

        const data = matchingFlow.data() as {
          milestones?: { tasks?: { completed: boolean }[] }[];
        };

        const tasks = data.milestones?.flatMap((m) => m.tasks ?? []) ?? [];

        const milestones =
          flowData.milestones
            ?.filter((m) => m.triggerPercent !== undefined)
            .map((m) => ({
              id: m.id,
              triggerPercent: m.triggerPercent as number,
            })) ?? [];

        const { percent } = calcProgress(tasks, milestones);

        getMilestoneStatuses(percent, milestones);

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