import { useUserAccess } from "@/hooks/useUserAccess";
import { isPaidAppPlan } from "@/lib/billingPlans";

export function usePlanAccess() {
  const { plan, trialDaysLeft, isTrial, isPlatinum, isTrialExpired } =
    useUserAccess();

  const trialActive = isTrial && !isTrialExpired;

  const hasAccess = isPaidAppPlan(plan) || trialActive;

  return {
    canUseCoreModules: hasAccess,
    canUseITAddon: plan === "Pro" || plan === "Enterprise" || plan === "Platinum",
    isTrial,
    isPlatinum,
    isTrialExpired,
    trialDaysLeft: trialDaysLeft ?? null, // Optional: keep it normalized
    plan,
  };
}
