// lib/onboarding/onboardingMilestones.ts
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: Timestamp;
}

export async function getUserMilestones(userId: string): Promise<Milestone[]> {
  const milestoneRef = collection(db, "users", userId, "onboardingMilestones");
  const snapshot = await getDocs(milestoneRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Milestone, "id">),
  }));
}

export async function completeMilestone(userId: string, milestoneId: string) {
  const docRef = doc(db, "users", userId, "onboardingMilestones", milestoneId);
  await setDoc(
    docRef,
    {
      completed: true,
      completedAt: Timestamp.now(),
    },
    { merge: true }
  );
}