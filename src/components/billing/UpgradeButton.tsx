"use client";

import { useState } from "react";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const createCheckoutSession = async () => {
    setLoading(true);

    const idToken = await fetch("/api/user/token").then((res) => res.text());

    const res = await fetch("/api/create-stripe-checkout-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
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
      {loading ? "Redirecting..." : "Upgrade to Platinum"}
    </button>
  );
}