"use client";

type Props = {
  plan: "free" | "trial" | "platinum" | null;
};

export default function UpgradeToContinue({ plan }: Props) {
  return (
    <div className="p-6 text-center border border-dashed border-red-500 rounded-xl bg-red-50 dark:bg-red-900/10 dark:border-red-400">
      <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">
        Access Restricted
      </h2>
      <p className="mt-2 text-gray-800 dark:text-gray-200">
        Your current plan (<strong>{plan ?? "unknown"}</strong>) doesn’t grant
        access to this feature.
      </p>
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        Please upgrade to the{" "}
        <span className="font-semibold">Platinum Plan</span> to continue.
      </p>
    </div>
  );
}
