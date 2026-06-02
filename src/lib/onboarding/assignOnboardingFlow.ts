import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

export async function assignOnboardingFlowToEmployee(
  companyId: string,
  employeeId: string,
  flowId: string,
) {
  const flowRef = doc(db, 'companies', companyId, 'onboardingFlows', flowId);

  const checklistRef = collection(
    db,
    'companies',
    companyId,
    'onboardingFlows',
    flowId,
    'checklistItems',
  );

  const employeeFlowRef = doc(
    db,
    'companies',
    companyId,
    'employees',
    employeeId,
    'onboardingFlows',
    flowId,
  );

  const employeeRootRef = doc(
    db,
    'companies',
    companyId,
    'employees',
    employeeId,
  );

  const flowSnap = await getDoc(flowRef);
  if (!flowSnap.exists()) {
    throw new Error('Onboarding flow template not found');
  }

  const flowData = flowSnap.data();
  const checklistSnap = await getDocs(checklistRef);

  const milestones =
    checklistSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          order: data.order,
          status: 'upcoming',
          tasks: [
            {
              id: doc.id,
              title: data.title,
              description: data.description || null,
              required: true,
              completed: false,
            },
          ],
        };
      })
      .sort((a, b) => a.order - b.order);
  const totalTasks = milestones.reduce(
    (sum, milestone) => sum + milestone.tasks.length,
    0,
  );

  const batch = writeBatch(db);

  batch.set(
    employeeFlowRef,
    {
      flowId,
      templateFlowId: flowId,
      employeeId,
      name: flowData.name,
      type: 'primary',
      milestones,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );

  batch.set(
    employeeRootRef,
    {
      onboarding: {
        activeFlowIds: [flowId],
        primaryFlowId: flowId,
        progress: {
          completed: 0,
          total: totalTasks,
          percent: 0,
          currentMilestone:
            totalTasks === 0 ? 'No tasks' : milestones[0]?.title ?? 'Not started',
          updatedAt: serverTimestamp(),
        },
      },
    },
    { merge: true },
  );

  await batch.commit();
}