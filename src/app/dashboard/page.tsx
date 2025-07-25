"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAccess } from "@/hooks/useUserAccess";

export default function DashboardHome() {
  const { user, loading, canAccessPremium, plan, isTrialExpired } =
    useUserAccess();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !canAccessPremium) {
      router.push("/upgrade");
    }
  }, [loading, user, canAccessPremium, router]);

  if (loading) return <p className="p-6">Loading...</p>;

  if (!user) {
    return <p className="p-6 text-red-600">Please sign in to continue.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[#004d59] dark:text-white">
        Welcome to your dashboard!
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Your plan: <strong>{plan}</strong>
      </p>
      {isTrialExpired && plan === "trial" && (
        <p className="mt-2 text-red-500">⚠️ Your 30-day trial has ended.</p>
      )}
    </div>
  );
}
