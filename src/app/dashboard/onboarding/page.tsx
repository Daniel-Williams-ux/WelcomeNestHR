"use client";

import { useUserAccess } from "@/hooks/useUserAccess";
import UpgradeToContinue from "@/components/auth/UpgradeToContinue";
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist";

export default function OnboardingPage() {
  const { user, loading, canAccessPremium, plan } = useUserAccess();

  const milestones = [
    {
      id: 1,
      title: "Profile Setup",
      description: "Complete your employee profile",
      status: "complete",
    },
    {
      id: 2,
      title: "Buddy Matched",
      description: "You've been paired with a buddy",
      status: "in_progress",
    },
    {
      id: 3,
      title: "Compliance Training",
      description: "Watch and complete training modules",
      status: "upcoming",
    },
    {
      id: 4,
      title: "90-Day Goals",
      description: "Review your first 90-day goals",
      status: "upcoming",
    },
  ];

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6">Please sign in</p>;
  if (!canAccessPremium) return <UpgradeToContinue plan={plan} />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Smart Onboarding</h1>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        Welcome to your personalized onboarding journey 🚀
      </p>

      <div className="mt-6">
        <OnboardingChecklist />
          </div>
          
      {/* Milestone Timeline */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">
          Your Onboarding Milestones
        </h2>
        <ol className="relative border-l border-gray-300 dark:border-gray-700">
          {milestones.map((milestone, index) => {
            const isComplete = milestone.status === "complete";
            const isInProgress = milestone.status === "in_progress";

            return (
              <li key={milestone.id} className="mb-10 ml-6">
                <span
                  className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border-2 text-sm font-medium
                    ${
                      isComplete
                        ? "bg-green-500 border-green-500 text-white"
                        : isInProgress
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "bg-gray-200 border-gray-400 dark:bg-gray-700 dark:border-gray-500"
                    }`}
                >
                  {index + 1}
                </span>
                <h3 className="font-medium text-lg text-gray-800 dark:text-gray-100">
                  {milestone.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {milestone.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
