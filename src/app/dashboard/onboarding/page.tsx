"use client";

import { ChecklistProgress } from "@/components/ChecklistProgress";
import { ChecklistTasks } from "@/components/ChecklistTasks";
import { MilestonesTimeline } from "@/components/MilestonesTimeline";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { useMilestones } from "@/hooks/useMilestones";

export default function SmartOnboardingPage() {
  const {
    steps,
    loading: checklistLoading,
    toggleStepComplete: toggleStep,
  } = useOnboardingChecklist();

  const { milestones, loading: milestonesLoading } = useMilestones();

  if (checklistLoading || milestonesLoading) return <div>Loading...</div>;

  const total = steps.length;
  const completed = steps.filter((s) => s.completed).length;
  const completionPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const currentPhaseIndex = Math.min(
    Math.floor((completionPercent / 100) * 5),
    4
  );

  return (
    <div className="space-y-10 p-6">
      {/* Firestore Milestones Timeline */}
      <MilestonesTimeline milestones={milestones} />

      {/* Progress Bar */}
      <ChecklistProgress
        completionPercent={completionPercent}
        currentPhaseIndex={currentPhaseIndex}
      />

      {/* Checklist Tasks */}
      <ChecklistTasks steps={steps} onToggle={toggleStep} />
    </div>
  );
}