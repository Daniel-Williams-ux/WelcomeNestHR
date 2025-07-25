// app/upgrade/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock } from "lucide-react";

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="max-w-xl">
        <div className="flex justify-center mb-4">
          <Lock className="w-12 h-12 text-[#FB8C00]" />
        </div>
        <h1 className="text-3xl font-bold text-[#004d59] mb-4">
          Your trial has ended.
        </h1>
        <p className="text-gray-700 mb-6">
          To continue enjoying smart onboarding, LifeSync, and everything
          WelcomeNestHR offers, upgrade to the <strong>Platinum Plan</strong>.
        </p>

        <div className="bg-gradient-to-r from-[#FFB300] to-[#FB8C00] p-6 rounded-2xl shadow-xl text-white">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Platinum Benefits:
          </h2>
          <ul className="text-left list-disc list-inside space-y-2 text-white/90">
            <li>Smart, AI-powered onboarding</li>
            <li>Emotional wellness (LifeSync)</li>
            <li>Collaborate module & buddy match</li>
            <li>Policy & compliance automation</li>
            <li>Primer (90-day success plans)</li>
            <li>Priority support</li>
          </ul>
        </div>

        <div className="mt-8">
          <Link href="/billing">
            <Button
              size="lg"
              className="bg-[#FB8C00] hover:bg-[#EF6C00] text-white px-8 text-lg"
            >
              Upgrade to Platinum
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
