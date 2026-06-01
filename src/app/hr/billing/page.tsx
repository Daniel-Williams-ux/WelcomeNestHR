"use client";

import { useState } from "react";
import { getAuth } from "firebase/auth";
import { Check, CreditCard, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserAccess } from "@/hooks/useUserAccess";
import { redirectToBillingPortal } from "@/lib/createBillingPortalSession";
import {
  BILLING_PLANS,
  DEFAULT_TRIAL_DAYS,
  billingPlanIdFromAppPlan,
  type BillingPlanId,
} from "@/lib/billingPlans";
import "@/lib/firebase";

export default function HRBillingPage() {
  const { user, plan, trialEndsAt, trialDaysLeft, loading } = useUserAccess();
  const [redirecting, setRedirecting] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<BillingPlanId | null>(null);
  const [error, setError] = useState("");

  const getIdToken = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("You need to sign in again before managing billing.");
    }

    return currentUser.getIdToken(true);
  };

  const handleStartCheckout = async (planId: BillingPlanId) => {
    setError("");
    setCheckoutPlan(planId);

    try {
      const idToken = await getIdToken();
      const response = await fetch("/api/create-stripe-checkout-session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? "Failed to create checkout session.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start checkout.",
      );
      setCheckoutPlan(null);
    }
  };

  const handleManageBilling = async () => {
    setError("");
    setRedirecting(true);

    try {
      const idToken = await getIdToken();
      await redirectToBillingPortal(idToken);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to redirect to the billing portal.",
      );
      setRedirecting(false);
    }
  };

  const currentBillingPlanId = billingPlanIdFromAppPlan(plan);
  const isPaidPlan = Boolean(currentBillingPlanId);

  const formattedTrialEnd = trialEndsAt
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(trialEndsAt)
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[#004d59] to-[#00798a] p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
          Company billing
        </p>
        <h1 className="mt-2 text-3xl font-bold">Billing & Subscription</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50">
          Start with a {DEFAULT_TRIAL_DAYS}-day free trial, then choose a
          company plan that scales with active employees.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current plan
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                {loading ? "Loading..." : isPaidPlan ? plan : "Free Trial"}
              </h2>
              {plan === "Trial" && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {typeof trialDaysLeft === "number"
                    ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
                    : "Trial period active"}
                  {formattedTrialEnd ? ` · Ends ${formattedTrialEnd}` : ""}
                </p>
              )}
              {isPaidPlan && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Billing is active for your company. Use the portal for cards,
                  invoices, tax IDs, and cancellations.
                </p>
              )}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                isPaidPlan
                  ? "bg-cyan-50 text-[#008FA1]"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {isPaidPlan ? "Active" : "Trial"}
            </span>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button
            onClick={handleManageBilling}
            disabled={loading || redirecting || !isPaidPlan}
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white hover:opacity-90"
          >
            <CreditCard size={16} aria-hidden="true" />
            {redirecting ? "Opening billing portal..." : "Manage Billing Portal"}
          </Button>
          {!isPaidPlan && (
            <p className="mt-2 text-xs text-slate-500">
              Choose a plan below to create the company subscription first.
            </p>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
            HR-only access
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Billing is intentionally hidden from employee dashboards. Employees
            can view payslips, onboarding, and company resources without seeing
            subscription controls.
          </p>
          {user?.email && (
            <p className="mt-4 text-xs text-slate-500">Signed in as {user.email}</p>
          )}
        </aside>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#008FA1]">
            Plans
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
            Per active employee, built for global billing
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Stripe handles cards, invoices, tax IDs, receipts, and the customer
            portal. We track the plan at company level so future employees stay
            under the same subscription.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {BILLING_PLANS.map((billingPlan) => {
            const isCurrent = currentBillingPlanId === billingPlan.id;
            const isStartingCheckout = checkoutPlan === billingPlan.id;

            return (
              <article
                key={billingPlan.id}
                className={`relative rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 ${
                  billingPlan.highlight
                    ? "border-[#00ACC1] ring-2 ring-[#00ACC1]/20"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {billingPlan.highlight && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-[#008FA1]">
                    <Sparkles size={14} aria-hidden="true" />
                    Recommended
                  </span>
                )}

                <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                  {billingPlan.name}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {billingPlan.description}
                </p>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Users size={16} aria-hidden="true" />
                  Minimum {billingPlan.minimumSeats} active employee
                  {billingPlan.minimumSeats === 1 ? "" : "s"}
                </div>

                <ul className="mt-5 space-y-3">
                  {billingPlan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2 text-sm text-slate-700 dark:text-slate-200"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#00ACC1]"
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleStartCheckout(billingPlan.id)}
                  disabled={loading || checkoutPlan !== null || isCurrent}
                  className={`mt-6 w-full ${
                    billingPlan.highlight
                      ? "bg-[#00ACC1] text-white hover:bg-[#0097A7]"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  {isCurrent
                    ? "Current plan"
                    : isStartingCheckout
                      ? "Opening checkout..."
                      : `Choose ${billingPlan.name}`}
                </Button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
