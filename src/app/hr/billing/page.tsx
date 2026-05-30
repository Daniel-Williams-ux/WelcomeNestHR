"use client";

import { useState } from "react";
import { getAuth } from "firebase/auth";
import { CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserAccess } from "@/hooks/useUserAccess";
import { redirectToBillingPortal } from "@/lib/createBillingPortalSession";
import "@/lib/firebase";

export default function HRBillingPage() {
  const { user, plan, trialEndsAt, trialDaysLeft, loading } = useUserAccess();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  const handleManageBilling = async () => {
    setError("");
    setRedirecting(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You need to sign in again before managing billing.");
      }

      const idToken = await currentUser.getIdToken(true);
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

  const formattedTrialEnd = trialEndsAt
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(trialEndsAt)
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[#004d59] to-[#00798a] p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
          Company billing
        </p>
        <h1 className="mt-2 text-3xl font-bold">Billing & Subscription</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50">
          Manage the company plan, subscription status, and billing portal access
          from the HR workspace.
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
                {loading ? "Loading..." : plan === "Platinum" ? "Platinum" : "Free Trial"}
              </h2>
              {plan === "Trial" && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {typeof trialDaysLeft === "number"
                    ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
                    : "Trial period active"}
                  {formattedTrialEnd ? ` · Ends ${formattedTrialEnd}` : ""}
                </p>
              )}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                plan === "Platinum"
                  ? "bg-cyan-50 text-[#008FA1]"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {plan === "Platinum" ? "Active" : "Trial"}
            </span>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button
            onClick={handleManageBilling}
            disabled={loading || redirecting}
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white hover:opacity-90"
          >
            <CreditCard size={16} aria-hidden="true" />
            {redirecting ? "Opening billing portal..." : "Manage Billing"}
          </Button>
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
    </div>
  );
}
