import { useUserAccess } from "@/hooks/useUserAccess";

export function usePlanAccess() {
  const { plan, trialDaysLeft } = useUserAccess();

  const isTrial = plan === "trial";
  const isPlatinum = plan === "platinum";

  // Safely check if trial is still active
  const trialActive =
    isTrial && typeof trialDaysLeft === "number" && trialDaysLeft > 0;

  const hasAccess = isPlatinum || trialActive;

  return {
    canUseCoreModules: hasAccess,
    canUseITAddon: isPlatinum, // Only Platinum users get IT Management
    isTrial,
    isPlatinum,
    trialDaysLeft: trialDaysLeft ?? null, // Optional: keep it normalized
    plan,
  };
}
