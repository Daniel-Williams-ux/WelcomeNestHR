import {
  doc,
  collection,
  setDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
  runTransaction,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { OFFBOARDING_CHECKLIST_V1 } from '@/constants/offboardingChecklist';

/**
 * ------------------------------------------------------
 * START OFFBOARDING
 * ------------------------------------------------------
 */
export async function startOffboarding(
  companyId: string,
  employeeId: string,
  startedBy: string,
) {
  const employeeRef = doc(db, 'companies', companyId, 'employees', employeeId);
  const offboardingRef = doc(
    db,
    'companies',
    companyId,
    'employees',
    employeeId,
    'offboarding',
    'record',
  );

  const tasksCol = collection(
    db,
    'companies',
    companyId,
    'employees',
    employeeId,
    'offboardingTasks',
  );

  // 1Create offboarding record + update employee
  await runTransaction(db, async (tx) => {
    tx.update(employeeRef, {
      status: 'exiting',
      updatedAt: serverTimestamp(),
    });

    tx.set(offboardingRef, {
      status: 'in_progress',
      checklistVersion: 1,
      startedAt: serverTimestamp(),
      startedBy,
    });
  });

  //  Seed checklist tasks (OUTSIDE transaction)
  for (const task of OFFBOARDING_CHECKLIST_V1) {
    await setDoc(doc(tasksCol), {
      ...task,
      completed: false,
      createdAt: serverTimestamp(),
    });
  }
}


/**
 * ------------------------------------------------------
 * COMPLETE SINGLE OFFBOARDING TASK
 * ------------------------------------------------------
 */
export async function completeOffboardingTask(
  companyId: string,
  employeeId: string,
  taskId: string,
  completedBy: string,
) {
  const taskRef = doc(
    db,
    'companies',
    companyId,
    'employees',
    employeeId,
    'offboardingTasks',
    taskId,
  );

  await updateDoc(taskRef, {
    completed: true,
    completedAt: serverTimestamp(),
    completedBy,
  });

  // GLOBAL AUDIT LOG
  await addDoc(collection(db, 'auditLogs'), {
    action: 'offboarding_task_completed',
    entityType: 'employee',
    entityId: employeeId,
    companyId,
    taskId,
    performedBy: completedBy,
    timestamp: serverTimestamp(),
  });

  await maybeFinalizeOffboarding(companyId, employeeId, completedBy);
}

/**
 * ------------------------------------------------------
 * FINALIZE OFFBOARDING (ONLY WHEN ALL TASKS COMPLETE)
 * ------------------------------------------------------
 */
async function maybeFinalizeOffboarding(
  companyId: string,
  employeeId: string,
  completedBy: string,
) {
  const tasksSnap = await getDocs(
    collection(
      db,
      'companies',
      companyId,
      'employees',
      employeeId,
      'offboardingTasks',
    ),
  );

  const allCompleted = tasksSnap.docs.every((d) => d.data().completed === true);

  if (!allCompleted) return;

  const offboardingRef = doc(
    db,
    'companies',
    companyId,
    'employees',
    employeeId,
    'offboarding',
    'record',
  );

  const employeeRef = doc(db, 'companies', companyId, 'employees', employeeId);

  await runTransaction(db, async (tx) => {
    tx.update(offboardingRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
    });

    tx.update(employeeRef, {
      status: 'Exited',
      exitedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  // GLOBAL AUDIT LOG — OFFBOARDING COMPLETED
  await addDoc(collection(db, 'auditLogs'), {
    action: 'offboarding_completed',
    entityType: 'employee',
    entityId: employeeId,
    companyId,
    performedBy: completedBy,
    timestamp: serverTimestamp(),
  });
}