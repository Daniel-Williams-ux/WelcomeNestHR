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

type PrimerGoalTemplate = {
  phase: '30' | '60' | '90';
  title: string;
  description: string;
  successCriteria: string;
};

const DEFAULT_PRIMER_GOALS: PrimerGoalTemplate[] = [
  {
    phase: '30',
    title: 'Understand your role and expectations',
    description:
      'Review your responsibilities, team structure, success measures, and immediate priorities.',
    successCriteria:
      'Employee can clearly explain their role, reporting line, and first-month priorities.',
  },
  {
    phase: '30',
    title: 'Build working relationships',
    description:
      'Meet key teammates, HR contacts, and collaborators needed for day-to-day work.',
    successCriteria:
      'Employee has completed introductory meetings and knows who to contact for support.',
  },
  {
    phase: '60',
    title: 'Own core responsibilities',
    description:
      'Begin handling regular tasks with manager guidance and document any blockers.',
    successCriteria:
      'Employee is completing core responsibilities with reduced supervision.',
  },
  {
    phase: '60',
    title: 'Identify improvement opportunities',
    description:
      'Share observations about process, tools, customer experience, or team workflows.',
    successCriteria:
      'Employee has submitted at least one useful improvement idea or learning reflection.',
  },
  {
    phase: '90',
    title: 'Deliver a 90-day success review',
    description:
      'Review progress, strengths, gaps, and next-quarter development goals with HR or manager.',
    successCriteria:
      'Employee has completed a 90-day review and agreed next goals.',
  },
  {
    phase: '90',
    title: 'Set next growth goals',
    description:
      'Define measurable growth goals for the next quarter based on role expectations.',
    successCriteria:
      'Employee has documented clear, measurable goals for the next performance period.',
  },
];

function buildGoalPayload(
  goal: PrimerGoalTemplate,
  planId: string,
  userId: string,
  companyId: string,
) {
  return {
    planId,
    userId,
    companyId,
    phase: goal.phase,
    title: goal.title,
    description: goal.description,
    successCriteria: goal.successCriteria,
    ownerId: userId,
    reviewerId: null,
    status: 'pending',
    progress: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

async function ensureGoalsForPlan(
  planId: string,
  userId: string,
  companyId: string,
  goals: PrimerGoalTemplate[],
) {
  const goalsRef = collection(db, `companies/${companyId}/primerGoals`);
  const existingGoalsQuery = query(goalsRef, where('userId', '==', userId));
  const existingGoalsSnap = await getDocs(existingGoalsQuery);
  const existingKeys = new Set(
    existingGoalsSnap.docs.map((goalDoc) => {
      const goal = goalDoc.data();
      return `${goal.phase}:${goal.title}`;
    }),
  );
  const missingGoals = goals.filter(
    (goal) => !existingKeys.has(`${goal.phase}:${goal.title}`),
  );

  if (missingGoals.length === 0) return;

  const batch = writeBatch(db);

  missingGoals.forEach((goal) => {
    const goalRef = doc(goalsRef);
    batch.set(goalRef, buildGoalPayload(goal, planId, userId, companyId));
  });

  await batch.commit();
}

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

    await ensureGoalsForPlan(
      existingPlan.id,
      userId,
      companyId,
      DEFAULT_PRIMER_GOALS,
    );

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
  const goals =
    templateSnap.empty
      ? DEFAULT_PRIMER_GOALS
      : templateSnap.docs.map((docSnap) => {
          const t = docSnap.data();

          return {
            phase: t.phase,
            title: t.title,
            description: t.description,
            successCriteria: t.successCriteria,
          } as PrimerGoalTemplate;
        });

  // =========================================================
  // 5. CREATE GOALS FROM TEMPLATES
  // =========================================================

  const goalsRef = collection(db, `companies/${companyId}/primerGoals`);

  goals.forEach((goal) => {
    const goalRef = doc(goalsRef);
    batch.set(goalRef, buildGoalPayload(goal, planRef.id, userId, companyId));
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
