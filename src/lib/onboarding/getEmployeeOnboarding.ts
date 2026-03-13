import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { calcProgress } from './calcProgress';
import { getMilestoneStatuses } from './getMilestoneStatuses';

export interface EmployeeTask {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  completed: boolean;
  completedAt?: any;
}

export interface EmployeeMilestone {
  id: string;
  title: string;
  order: number;
  status: 'upcoming' | 'in_progress' | 'complete';
  tasks: EmployeeTask[];
}

export interface EmployeeOnboardingFlow {
  flowId: string;
  name: string;
  type: 'primary' | 'secondary';
  milestones: EmployeeMilestone[];
}

export async function getEmployeeOnboardingFlows(
  companyId: string,
  employeeId: string,
) {
  const flowsRef = collection(
    db,
    'companies',
    companyId,
    'employees',
    employeeId,
    'onboardingFlows',
  );

  const snapshot = await getDocs(flowsRef);

  return snapshot.docs.map((doc) => {
    const flow = doc.data() as Omit<EmployeeOnboardingFlow, 'flowId'>;

    const tasks = flow.milestones.flatMap((m) => m.tasks);

    const milestones = flow.milestones.map((m) => ({
      id: m.id,
      triggerPercent: m.order * 25,
    }));

    const { percent } = calcProgress(tasks, milestones);

    const statuses = getMilestoneStatuses(percent, milestones);

    const updatedMilestones = flow.milestones.map((m) => {
      const status = statuses.find((s) => s.id === m.id)?.status;

      let mappedStatus: 'upcoming' | 'in_progress' | 'complete' = 'upcoming';

      if (status === 'completed') mappedStatus = 'complete';
      if (status === 'current') mappedStatus = 'in_progress';

      return {
        ...m,
        status: mappedStatus,
      };
    });

    return {
      flowId: doc.id,
      ...flow,
      milestones: updatedMilestones,
    };
  });
}