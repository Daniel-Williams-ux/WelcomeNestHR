import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // ✅ use this

export async function getOnboardingChecklist(userId: string) {
  const docRef = doc(db, "users", userId, "onboarding", "checklist");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return { completed: [] };
  }
}
