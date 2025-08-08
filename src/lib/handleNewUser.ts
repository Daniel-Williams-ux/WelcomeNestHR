import {
  collection,
  doc,
  setDoc,
  writeBatch,
  getFirestore,
  Timestamp,
} from "firebase/firestore";
import { addDays } from "date-fns";
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

// ✅ Prevent duplicate Firebase initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: "complete" | "in_progress" | "upcoming";
  order: number;
  startDate: string;
  endDate: string;
}

export async function handleNewUser(uid: string) {
  const userRef = doc(db, "users", uid);

  // ✅ Create user base profile with trial and seeded flag
  await setDoc(userRef, {
    createdAt: Timestamp.now(),
    plan: "trial",
    trialEndsAt: Timestamp.fromDate(addDays(new Date(), 30)), // 30-day trial
    milestonesSeeded: true, // <-- mark as seeded immediately
  });

  // Define default milestones
  const milestones: Milestone[] = [
    {
      id: "milestone_1",
      title: "Start your journey",
      description: "Complete your profile and get started",
      status: "in_progress",
      order: 1,
      startDate: addDays(new Date(), 0).toISOString(),
      endDate: addDays(new Date(), 7).toISOString(),
    },
    {
      id: "milestone_2",
      title: "Meet your team",
      description: "Get to know your colleagues and role",
      status: "upcoming",
      order: 2,
      startDate: addDays(new Date(), 8).toISOString(),
      endDate: addDays(new Date(), 15).toISOString(),
    },
    {
      id: "milestone_3",
      title: "Finish compliance training",
      description: "Complete all required onboarding courses",
      status: "upcoming",
      order: 3,
      startDate: addDays(new Date(), 16).toISOString(),
      endDate: addDays(new Date(), 23).toISOString(),
    },
    {
      id: "milestone_4",
      title: "Review your 90-day goals",
      description: "Discuss objectives with your manager",
      status: "upcoming",
      order: 4,
      startDate: addDays(new Date(), 24).toISOString(),
      endDate: addDays(new Date(), 31).toISOString(),
    },
  ];

  // Batch write milestones
  const batch = writeBatch(db);
  milestones.forEach((milestone) => {
    const milestoneRef = doc(
      collection(db, "users", uid, "milestones"),
      milestone.id
    );
    batch.set(milestoneRef, milestone);
  });

  await batch.commit();
  console.log(
    `✅ Created user ${uid} with default milestones and trial period`
  );
}