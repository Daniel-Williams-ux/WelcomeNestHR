"use client";

import { useState } from "react";
import type { BillingPlanId } from "@/lib/billingPlans";

export default function UpgradeButton({ planId = "growth" }: { planId?: BillingPlanId }) {
  const [loading, setLoading] = useState(false);

  const createCheckoutSession = async () => {
    setLoading(true);

    const idToken = await fetch("/api/user/token").then((res) => res.text());

    const res = await fetch("/api/create-stripe-checkout-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planId }),
    });

    const data = await res.json();

    if (data?.url) {
      window.location.href = data.url;
    } else {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={createCheckoutSession}
      disabled={loading}
      className="mt-4 px-6 py-2 bg-brand text-white rounded-lg hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Redirecting..." : "Choose plan"}
    </button>
  );
}