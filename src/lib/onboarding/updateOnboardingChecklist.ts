import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function updateOnboardingChecklist(
  userId: string,
  completedSteps: string[]
) {
  try {
    const checklistRef = doc(db, "users", userId, "onboarding", "checklist");

    await setDoc(checklistRef, { completed: completedSteps }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error updating onboarding checklist:", error);
    return { success: false, error };
  }
}
