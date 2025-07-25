import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Fetches the user's onboarding checklist from Firestore.
 * Ensures it always returns a valid array.
 */
export async function getUserChecklist(uid: string): Promise<string[]> {
  const ref = doc(db, "onboardingChecklists", uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.data();
  return Array.isArray(data.completed) ? data.completed : [];
}

/**
 * Saves the user's updated checklist to Firestore.
 */
export async function saveUserChecklist(uid: string, completed: string[]) {
  const ref = doc(db, "onboardingChecklists", uid);
  await setDoc(ref, { completed }, { merge: true });
}