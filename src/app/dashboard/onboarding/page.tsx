"use client";

import { ChecklistProgress } from "@/components/ChecklistProgress";
import { ChecklistTasks } from "@/components/ChecklistTasks";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";

export default function SmartOnboardingPage() {
  const {
    steps,
    loading,
    toggleStepComplete: toggleStep,
  } = useOnboardingChecklist();

  if (loading) return <div>Loading...</div>;

  const total = steps.length;
  const completed = steps.filter((s) => s.completed).length;
  const completionPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculate phase index (0–4 for 5 phases)
  const currentPhaseIndex = Math.min(
    Math.floor((completionPercent / 100) * 5),
    4
  );

  return (
    <div className="space-y-6 p-6">
      {/* Progress Bar */}
      <ChecklistProgress
        completionPercent={completionPercent}
        currentPhaseIndex={currentPhaseIndex}
      />

      {/* Task List */}
      <ChecklistTasks steps={steps} onToggle={toggleStep} />
    </div>
  );
}