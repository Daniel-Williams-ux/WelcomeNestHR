import { useEffect, useState } from "react";
import { auth, firestore } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type Plan = "free" | "pro" | "enterprise" | null;

export function useUserPlan() {
  const [plan, setPlan] = useState<Plan>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setPlan((data.plan as Plan) ?? "free");
        } else {
          setPlan("free"); // fallback if user doc not found
        }
      } else {
        setPlan(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { plan, loading };
}