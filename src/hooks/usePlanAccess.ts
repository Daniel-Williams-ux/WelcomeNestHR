import { useUserAccess } from "@/hooks/useUserAccess";

export function usePlanAccess() {
  const { plan, trialDaysLeft, isTrial, isPlatinum, isTrialExpired } =
    useUserAccess();

  const trialActive = isTrial && !isTrialExpired;

  const hasAccess = isPlatinum || trialActive;

  return {
    canUseCoreModules: hasAccess,
    canUseITAddon: isPlatinum, // Only Platinum users get IT Management
    isTrial,
    isPlatinum,
    isTrialExpired,
    trialDaysLeft: trialDaysLeft ?? null, // Optional: keep it normalized
    plan,
  };
}
