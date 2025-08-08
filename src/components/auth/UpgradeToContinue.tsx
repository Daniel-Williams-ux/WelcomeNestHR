"use client";

type Props = {
  plan: "free" | "trial" | "platinum" | null;
  trialEndsAt?: Date | null;
  isTrialExpired?: boolean;
  trialDaysLeft?: number | null;
};

export default function UpgradeToContinue({
  plan,
  trialEndsAt,
  isTrialExpired,
  trialDaysLeft,
}: Props) {
  const renderPlanLabel = () => {
    if (plan === "trial") {
      if (isTrialExpired) return "Trial expired";
      if (typeof trialDaysLeft === "number") {
        return `Trial – ${trialDaysLeft} day${
          trialDaysLeft === 1 ? "" : "s"
        } left`;
      }
    }
    return plan ?? "unknown";
  };

  return (
    <div className="p-6 text-center border border-dashed border-red-500 rounded-xl bg-red-50 dark:bg-red-900/10 dark:border-red-400">
      <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">
        Access Restricted
      </h2>
      <p className="mt-2 text-gray-800 dark:text-gray-200">
        Your current plan (<strong>{renderPlanLabel()}</strong>) doesn’t grant
        access to this feature.
      </p>
      {plan === "trial" && trialEndsAt && !isTrialExpired && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Trial ends on{" "}
          <span className="font-medium">
            {trialEndsAt.toLocaleDateString()}
          </span>
        </p>
      )}
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        Please upgrade to the{" "}
        <span className="font-semibold">Platinum Plan</span> to continue.
      </p>
    </div>
  );
}