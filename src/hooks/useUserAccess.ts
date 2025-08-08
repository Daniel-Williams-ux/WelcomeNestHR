"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AccessState = {
  user: User | null;
  loading: boolean;
  plan: "free" | "trial" | "platinum" | null;
  isTrialExpired: boolean;
  canAccessPremium: boolean;
  trialDaysLeft: number | null;
  trialEndsAt: Date | null;
};

export function useUserAccess(): AccessState {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<"free" | "trial" | "platinum" | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
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

            // ✅ Convert Firestore trialEndsAt to JS Date
            let endsAt: Date | null = null;
            if (data.trialEndsAt instanceof Timestamp) {
              endsAt = data.trialEndsAt.toDate();
            } else if (data.trialEndsAt instanceof Date) {
              endsAt = data.trialEndsAt;
            } else if (typeof data.trialEndsAt === "string") {
              const parsed = new Date(data.trialEndsAt);
              if (!isNaN(parsed.getTime())) {
                endsAt = parsed;
              }
            }

            setPlan(userPlan);
            setTrialEndsAt(endsAt);

            if (endsAt instanceof Date && !isNaN(endsAt.getTime())) {
              const now = new Date();
              const expired = now > endsAt;
              setIsTrialExpired(expired);

              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )
              );
              setTrialDaysLeft(daysLeft);

              console.log("📆 Trial ends at:", endsAt.toISOString());
              console.log("📊 Trial expired?", expired);
              console.log("🧮 Trial days left:", daysLeft);
            } else {
              console.log("⛔ No valid trial end date found.");
              setIsTrialExpired(false);
              setTrialDaysLeft(null);
            }
          } else {
            console.warn("⚠️ No user document found in Firestore.");
            setPlan("free");
            setIsTrialExpired(false);
            setTrialDaysLeft(null);
            setTrialEndsAt(null);
          }
        } catch (error) {
          console.error("🔥 Error fetching user document:", error);
          setPlan(null);
          setIsTrialExpired(false);
          setTrialDaysLeft(null);
          setTrialEndsAt(null);
        }
      } else {
        console.warn("⚠️ No Firebase user detected.");
        setPlan(null);
        setIsTrialExpired(false);
        setTrialDaysLeft(null);
        setTrialEndsAt(null);
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

  console.log("👤 Access hook state:", {
    user,
    loading,
    plan,
    isTrialExpired,
    trialDaysLeft,
    trialEndsAt,
  });

  return {
    user,
    loading,
    plan,
    isTrialExpired,
    canAccessPremium,
    trialDaysLeft,
    trialEndsAt,
  };
}