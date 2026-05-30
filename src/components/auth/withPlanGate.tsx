// src/components/auth/withPlanGate.tsx
"use client";

import { useUserPlan } from "@/hooks/useUserPlan";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Plan = "free" | "pro" | "enterprise";

export function withPlanGate<T extends object>(
  Component: React.ComponentType<T>,
  allowedPlans: Plan[]
) {
  return function WrappedComponent(props: T) {
    const { plan, loading } = useUserPlan();
    const router = useRouter();

    useEffect(() => {
      if (!loading && plan && !allowedPlans.includes(plan)) {
        router.push("/upgrade");
      }
    }, [plan, loading, router]);

    if (loading) {
      return (
        <div className="h-screen flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Checking access...
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
