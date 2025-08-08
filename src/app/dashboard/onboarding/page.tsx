"use client";

import { useUserAccess } from "@/hooks/useUserAccess";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import UpgradeToContinue from "@/components/auth/UpgradeToContinue";
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist";
import { useMilestones } from "@/hooks/useMilestones";
import { format } from "date-fns";

export default function OnboardingPage() {
  const { user, loading, plan, trialEndsAt, isTrialExpired, trialDaysLeft } =
    useUserAccess();

  const { canUseCoreModules } = usePlanAccess();
  const { milestones, loading: milestonesLoading } = useMilestones();

  if (loading || milestonesLoading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6">Please sign in</p>;

  // 🚫 If the user’s plan doesn’t have access, show upgrade screen
  if (!canUseCoreModules) {
    return (
      <UpgradeToContinue
        plan={plan}
        trialEndsAt={trialEndsAt}
        isTrialExpired={isTrialExpired}
        trialDaysLeft={trialDaysLeft}
      />
    );
  }

  const formatDateRange = (start?: Date, end?: Date) => {
    if (!start || !end) return null;
    const sameMonth = start.getMonth() === end.getMonth();
    return sameMonth
      ? `${format(start, "MMM d")}–${format(end, "d")}`
      : `${format(start, "MMM d")}–${format(end, "MMM d")}`;
  };

  const toDateObject = (
    value: string | { seconds: number; nanoseconds?: number } | undefined | null
  ): Date | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") return new Date(value);
    if (typeof value === "object" && "seconds" in value)
      return new Date(value.seconds * 1000);
    return undefined;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Smart Onboarding</h1>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        Welcome to your personalized onboarding journey 🚀
      </p>

      <div className="mt-6">
        <OnboardingChecklist />
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">
          Your Onboarding Milestones
        </h2>
        {milestones.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No milestones yet. Your journey starts soon.
          </p>
        ) : (
          <ol className="relative border-l border-gray-300 dark:border-gray-700">
            {milestones.map((milestone, index) => {
              const isComplete = milestone.status === "complete";
              const isInProgress = milestone.status === "in_progress";

              const start = toDateObject(milestone.startDate);
              const end = toDateObject(milestone.endDate);
              const dateRange = formatDateRange(start, end);

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
                  {dateRange && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      {dateRange}
                    </p>
                  )}
                  {milestone.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {milestone.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}