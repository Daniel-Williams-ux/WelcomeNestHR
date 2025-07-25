"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AccessState = {
  user: User | null;
  loading: boolean;
  plan: "free" | "trial" | "platinum" | null;
  isTrialExpired: boolean;
  canAccessPremium: boolean;
  trialDaysLeft: number | null;
};

export function useUserAccess(): AccessState {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<"free" | "trial" | "platinum" | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn("⏳ Auth timeout: fallback to unauthenticated state.");
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const userPlan = data.plan || "free";
            const trialEndsAt = data.trialEndsAt?.toDate?.();

            setPlan(userPlan);

            if (
              userPlan === "trial" &&
              trialEndsAt instanceof Date &&
              !isNaN(trialEndsAt.getTime())
            ) {
              const now = new Date();
              const expired = now > trialEndsAt;
              setIsTrialExpired(expired);

              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (trialEndsAt.getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              );

              setTrialDaysLeft(daysLeft);

              console.log("📆 Trial ends at:", trialEndsAt.toISOString());
              console.log("📊 Trial expired?", expired);
              console.log("🧮 Trial days left:", daysLeft);
            } else {
              console.log("⛔ trialEndsAt not set or invalid");
              setIsTrialExpired(false);
              setTrialDaysLeft(null);
            }
          } else {
            console.warn("⚠️ No user document found in Firestore.");
            setPlan("free");
            setIsTrialExpired(false);
            setTrialDaysLeft(null);
          }
        } catch (error) {
          console.error("🔥 Error fetching user document:", error);
          setPlan(null);
          setIsTrialExpired(false);
          setTrialDaysLeft(null);
        }
      } else {
        console.warn("⚠️ No Firebase user detected.");
        setPlan(null);
        setIsTrialExpired(false);
        setTrialDaysLeft(null);
      }

      clearTimeout(timeout);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const canAccessPremium =
    plan === "platinum" || (plan === "trial" && !isTrialExpired);

  return {
    user,
    loading,
    plan,
    isTrialExpired,
    canAccessPremium,
    trialDaysLeft,
  };
}
