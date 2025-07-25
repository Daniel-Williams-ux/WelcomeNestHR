import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function getUserOnboardingStatus(uid: string) {
  const docRef = doc(db, "users", uid, "onboarding", "status");
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data().milestones : null;
}

export async function setUserOnboardingStatus(
  uid: string,
  milestones: Record<string, string>
) {
  const docRef = doc(db, "users", uid, "onboarding", "status");
  await setDoc(docRef, { milestones }, { merge: true });
}
