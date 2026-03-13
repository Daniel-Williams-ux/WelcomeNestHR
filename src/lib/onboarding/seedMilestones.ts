import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { defaultMilestones } from './defaultMilestones';

export async function seedMilestones(companyId: string, flowId: string) {
  const batch = writeBatch(db);

  const milestonesRef = collection(
    db,
    'companies',
    companyId,
    'onboardingFlows',
    flowId,
    'milestones',
  );

  defaultMilestones.forEach((milestone) => {
    const milestoneRef = doc(milestonesRef, milestone.id);

    batch.set(milestoneRef, {
      name: milestone.name,
      triggerPercent: milestone.triggerPercent,
      order: milestone.order,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}