import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ---- TYPES ----

export type CreatePrimerPlanInput = {
  userId: string;
  companyId: string;
  role: string;
  seniority?: 'junior' | 'mid' | 'senior';
  startDate?: Date;
};

// ---- MAIN FUNCTION ----

export async function createPrimerPlan(input: CreatePrimerPlanInput) {
  const { userId, companyId, role, seniority, startDate = new Date() } = input;

  // =========================================================
  // 1. DUPLICATE PLAN PREVENTION (DETERMINISTIC)
  // =========================================================

  const existingPlansRef = collection(db, `companies/${companyId}/primerPlans`);

  const existingQuery = query(
    existingPlansRef,
    where('userId', '==', userId),
    where('status', 'in', ['draft', 'active']),
  );

  const existingSnapshot = await getDocs(existingQuery);

  if (!existingSnapshot.empty) {
    const existingPlan = existingSnapshot.docs[0];

    return {
      planId: existingPlan.id,
      reused: true,
    };
  }

  // =========================================================
  // 2. DETERMINISTIC PHASE GENERATION
  // =========================================================

  const planRef = doc(collection(db, `companies/${companyId}/primerPlans`));

  const start = Timestamp.fromDate(startDate);

  const day = 24 * 60 * 60 * 1000;

  const phases = [
    {
      key: '30',
      title: '30 Days',
      startDate: start,
      endDate: Timestamp.fromDate(new Date(startDate.getTime() + 30 * day)),
    },
    {
      key: '60',
      title: '60 Days',
      startDate: Timestamp.fromDate(new Date(startDate.getTime() + 31 * day)),
      endDate: Timestamp.fromDate(new Date(startDate.getTime() + 60 * day)),
    },
    {
      key: '90',
      title: '90 Days',
      startDate: Timestamp.fromDate(new Date(startDate.getTime() + 61 * day)),
      endDate: Timestamp.fromDate(new Date(startDate.getTime() + 90 * day)),
    },
  ];

  // =========================================================
  // 3. ATOMIC WRITE (SCALABLE)
  // =========================================================

  const batch = writeBatch(db);

  batch.set(planRef, {
    userId,
    companyId,

    status: 'draft',

    phaseKeys: ['30', '60', '90'],

    startDate: start,

    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // =========================================================
  // 4. FETCH TEMPLATES (INTELLIGENCE LAYER)
  // =========================================================

  const templatesRef = collection(db, 'primerTemplates');

  const templateQuery = query(
    templatesRef,
    where('role', '==', role),
    where('isActive', '==', true),
  );

  const templateSnap = await getDocs(templateQuery);

  console.log('Templates found:', templateSnap.size);

  // =========================================================
  // 5. CREATE GOALS FROM TEMPLATES
  // =========================================================

  const goalsRef = collection(db, `companies/${companyId}/primerGoals`);

  templateSnap.docs.forEach((docSnap) => {
    const t = docSnap.data();

    const goalRef = doc(goalsRef);

    batch.set(goalRef, {
      planId: planRef.id,
      userId,
      companyId,

      phase: t.phase,

      title: t.title,
      description: t.description,
      successCriteria: t.successCriteria,

      ownerId: userId,
      reviewerId: null,

      status: 'pending',
      progress: 0,

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  // =========================================================
  // 6. COMMIT EVERYTHING (PLAN + GOALS)
  // =========================================================

  await batch.commit();

  // =========================================================
  // 4. RESPONSE (DETERMINISTIC)
  // =========================================================

  return {
    planId: planRef.id,
    reused: false,
    phases,
  };
}
