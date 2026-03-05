import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

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
  employeeId: string
) {
  const flowsRef = collection(
    db,
    'companies',
    companyId,
    'employees',
    employeeId,
    'onboardingFlows'
  );

  const snapshot = await getDocs(flowsRef);

  return snapshot.docs.map((doc) => ({
    flowId: doc.id,
    ...(doc.data() as Omit<EmployeeOnboardingFlow, 'flowId'>),
  }));
}