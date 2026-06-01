export type BillingPlanId = "starter" | "growth" | "pro";

export type AppPlan =
  | "Trial"
  | "Starter"
  | "Growth"
  | "Pro"
  | "Enterprise"
  | "Platinum";

export type BillingPlan = {
  id: BillingPlanId;
  name: "Starter" | "Growth" | "Pro";
  description: string;
  envPriceKey: string;
  minimumSeats: number;
  highlight?: boolean;
  features: string[];
};

export const DEFAULT_TRIAL_DAYS = 7;

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For small teams launching structured onboarding.",
    envPriceKey: "STRIPE_STARTER_PRICE_ID",
    minimumSeats: 1,
    features: [
      "Employee onboarding",
      "Compliance checklist",
      "Collaborate announcements",
      "Employee payslip access",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing companies that need HR visibility and wellbeing.",
    envPriceKey: "STRIPE_GROWTH_PRICE_ID",
    minimumSeats: 5,
    highlight: true,
    features: [
      "Everything in Starter",
      "LifeSync Emotional Intelligence",
      "Primer 30-60-90 plans",
      "Messaging and buddy assignment",
      "HR insight dashboards",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For larger teams that need advanced support and scale.",
    envPriceKey: "STRIPE_PRO_PRICE_ID",
    minimumSeats: 15,
    features: [
      "Everything in Growth",
      "NestGuide AI support",
      "Priority support",
      "Advanced compliance readiness",
      "Enterprise rollout support",
    ],
  },
];

export function getBillingPlan(planId: string | null | undefined) {
  return BILLING_PLANS.find((plan) => plan.id === planId);
}

export function getPlanPriceEnvKey(planId: string | null | undefined) {
  return getBillingPlan(planId)?.envPriceKey ?? null;
}

export function normalizeAppPlan(value: unknown): AppPlan | null {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "trial") return "Trial";
  if (normalized === "starter") return "Starter";
  if (normalized === "growth") return "Growth";
  if (normalized === "pro") return "Pro";
  if (normalized === "enterprise") return "Enterprise";
  if (normalized === "platinum") return "Platinum";

  return null;
}

export function appPlanFromBillingPlanId(planId: BillingPlanId): AppPlan {
  if (planId === "starter") return "Starter";
  if (planId === "growth") return "Growth";
  return "Pro";
}

export function billingPlanIdFromAppPlan(plan: AppPlan | null | undefined) {
  if (plan === "Starter") return "starter";
  if (plan === "Growth") return "growth";
  if (plan === "Pro" || plan === "Platinum" || plan === "Enterprise") {
    return "pro";
  }

  return null;
}

export function isPaidAppPlan(plan: AppPlan | null | undefined) {
  return (
    plan === "Starter" ||
    plan === "Growth" ||
    plan === "Pro" ||
    plan === "Enterprise" ||
    plan === "Platinum"
  );
}
