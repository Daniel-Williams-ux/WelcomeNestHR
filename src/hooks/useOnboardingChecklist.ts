import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useUserAccess } from "./useUserAccess";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function useOnboardingChecklist() {
  const { user } = useUserAccess();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      if (!user) return;

    const q = collection(db, "users", user.uid, "onboarding");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: OnboardingStep[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<OnboardingStep, "id">;
        return { id: docSnap.id, ...data };
      });
      setSteps(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  async function toggleStepComplete(stepId: string, currentState: boolean) {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "onboarding", stepId);
    await updateDoc(ref, { completed: !currentState });
  }

  return { steps, loading, toggleStepComplete };
}