// import { useEffect, useState } from "react";
// import { db } from "@/lib/firebase";
// import {
//   collection,
//   doc,
//   getDocs,
//   onSnapshot,
//   setDoc,
//   updateDoc,
// } from "firebase/firestore";
// import { useUserAccess } from "./useUserAccess";

// export interface OnboardingStep {
//   id: string;
//   title: string;
//   description: string;
//   completed: boolean;
// }

// // ✅ Define your default onboarding steps here
// const DEFAULT_TASKS: Omit<OnboardingStep, "id">[] = [
//   {
//     title: "Complete your profile",
//     description: "Add your name, role, and profile picture",
//     completed: false,
//   },
//   {
//     title: "Meet your onboarding buddy",
//     description: "Schedule a meeting with your assigned buddy",
//     completed: false,
//   },
//   {
//     title: "Read the company handbook",
//     description: "Review policies and guidelines",
//     completed: false,
//   },
//   {
//     title: "Set up work tools",
//     description: "Install and configure Slack, Jira, and email",
//     completed: false,
//   },
//   {
//     title: "Schedule your 30-day check-in",
//     description: "Meet with your manager to discuss progress",
//     completed: false,
//   },
// ];

// export function useOnboardingChecklist() {
//   const { user } = useUserAccess();
//   const [steps, setSteps] = useState<OnboardingStep[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!user) return;

//     const onboardingRef = collection(db, "users", user.uid, "onboarding");

//     // First, check if user has onboarding tasks — if not, seed them
//     (async () => {
//       const snapshot = await getDocs(onboardingRef);
//       if (snapshot.empty) {
//         console.log("🌱 Seeding default onboarding tasks...");
//         for (const task of DEFAULT_TASKS) {
//           const taskRef = doc(onboardingRef);
//           await setDoc(taskRef, task);
//         }
//       }
//     })();

//     // Then, listen for updates in real-time
//     const unsubscribe = onSnapshot(onboardingRef, (snapshot) => {
//       const list: OnboardingStep[] = snapshot.docs.map((docSnap) => {
//         const data = docSnap.data() as Omit<OnboardingStep, "id">;
//         return { id: docSnap.id, ...data };
//       });
//       setSteps(list);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [user]);

//   async function toggleStepComplete(stepId: string, currentState: boolean) {
//     if (!user) return;
//     const ref = doc(db, "users", user.uid, "onboarding", stepId);
//     await updateDoc(ref, { completed: !currentState });
//   }

//   return { steps, loading, toggleStepComplete };
// }
// src/hooks/useOnboardingChecklist.ts
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useUserAccess } from "./useUserAccess";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// ✅ Default onboarding steps
const DEFAULT_TASKS: Omit<OnboardingStep, "id">[] = [
  {
    title: "Complete your profile",
    description: "Add your name, role, and profile picture",
    completed: false,
  },
  {
    title: "Meet your onboarding buddy",
    description: "Schedule a meeting with your assigned buddy",
    completed: false,
  },
  {
    title: "Read the company handbook",
    description: "Review policies and guidelines",
    completed: false,
  },
  {
    title: "Set up work tools",
    description: "Install and configure Slack, Jira, and email",
    completed: false,
  },
  {
    title: "Schedule your 30-day check-in",
    description: "Meet with your manager to discuss progress",
    completed: false,
  },
];

export function useOnboardingChecklist() {
  const { user } = useUserAccess();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const onboardingRef = collection(db, "users", user.uid, "onboarding");

    // Seed defaults once if empty
    (async () => {
      const snapshot = await getDocs(onboardingRef);
      if (snapshot.empty) {
        for (const task of DEFAULT_TASKS) {
          const taskRef = doc(onboardingRef);
          await setDoc(taskRef, task);
        }
      }
    })();

    // Live updates
    const unsubscribe = onSnapshot(onboardingRef, (snapshot) => {
      const list: OnboardingStep[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<OnboardingStep, "id">;
        return { id: docSnap.id, ...data };
      });
      setSteps(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ Option B: derive current state from local `steps`
  async function toggleStepComplete(stepId: string) {
    if (!user) return;
    const current = steps.find((s) => s.id === stepId);
    if (!current) return;

    // Optional optimistic UI
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, completed: !s.completed } : s
      )
    );

    const ref = doc(db, "users", user.uid, "onboarding", stepId);
    await updateDoc(ref, { completed: !current.completed });
  }

  return { steps, loading, toggleStepComplete };
}