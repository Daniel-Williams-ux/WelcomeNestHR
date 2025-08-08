import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Fetches the user's onboarding checklist from Firestore.
 */
export async function getUserChecklist(uid: string): Promise<string[]> {
  const ref = doc(db, "users", uid, "onboarding", "checklist"); // ✅ correct path
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
  const ref = doc(db, "users", uid, "onboarding", "checklist"); // ✅ correct path
  await setDoc(ref, { completed }, { merge: true });
}