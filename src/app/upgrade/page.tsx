"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock } from "lucide-react";
import { DEFAULT_TRIAL_DAYS } from "@/lib/billingPlans";
import { useUserAccess } from "@/hooks/useUserAccess";

export default function UpgradePage() {
  const { trialDaysLeft } = useUserAccess();

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="max-w-xl">
        <div className="flex justify-center mb-4">
          <Lock className="w-12 h-12 text-[#FB8C00]" />
        </div>

        {trialDaysLeft !== null && trialDaysLeft > 0 ? (
          <h1 className="text-3xl font-bold text-[#004d59] mb-4">
            Trial – {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
          </h1>
        ) : (
          <h1 className="text-3xl font-bold text-[#004d59] mb-4">
            Your trial has ended.
          </h1>
        )}

        <p className="text-gray-700 mb-6">
          To continue enjoying smart onboarding, LifeSync, and everything
          WelcomeNestHR offers, choose a paid company subscription. New
          companies start with a <strong>{DEFAULT_TRIAL_DAYS}-day trial</strong>.
        </p>

        <div className="bg-gradient-to-r from-[#FFB300] to-[#FB8C00] p-6 rounded-2xl shadow-xl text-white">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Paid Plan Benefits:
          </h2>
          <ul className="text-left list-disc list-inside space-y-2 text-white/90">
            <li>Smart, AI-powered onboarding</li>
            <li>Emotional wellness (LifeSync)</li>
            <li>Collaborate module & buddy match</li>
            <li>Policy & compliance automation</li>
            <li>Primer (90-day success plans)</li>
            <li>Plan options for small, growing, and larger teams</li>
          </ul>
        </div>

        <div className="mt-8">
          <Link href="/hr/billing">
            <Button
              size="lg"
              className="bg-[#FB8C00] hover:bg-[#EF6C00] text-white px-8 text-lg"
            >
              Choose a plan
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Need help?{" "}
          <a href="mailto:support@welcomenest.com" className="underline">
            Contact support
          </a>
        </p>
      </div>
    </main>
  );
}
