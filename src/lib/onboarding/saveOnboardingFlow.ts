import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface OnboardingTaskTemplate {
  id: string;
  title: string;
  description?: string;
  required: boolean;
}

export interface OnboardingMilestoneTemplate {
  id: string;
  title: string;
  order: number;
  tasks: OnboardingTaskTemplate[];
}

export interface OnboardingFlowTemplate {
  name: string;
  type: 'primary' | 'secondary';
  milestones: OnboardingMilestoneTemplate[];
  active: boolean;
}

export async function saveOnboardingFlow(
  companyId: string,
  flowId: string,
  flow: OnboardingFlowTemplate,
) {
  const ref = doc(db, 'companies', companyId, 'onboardingFlows', flowId);

  await setDoc(
    ref,
    {
      ...flow,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}