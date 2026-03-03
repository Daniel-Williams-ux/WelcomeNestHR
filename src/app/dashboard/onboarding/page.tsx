'use client';

import { ChecklistProgress } from '@/components/ChecklistProgress';
import { ChecklistTasks } from '@/components/ChecklistTasks';
import { MilestonesTimeline } from '@/components/MilestonesTimeline';
import { useEmployeeOnboarding } from '@/hooks/useEmployeeOnboarding';
import { useMilestones } from '@/hooks/useMilestones';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function SmartOnboardingPage() {
  const { user } = useUserAccess();

  const {
    steps,
    loading: checklistLoading,
    toggleStepComplete,
  } = useEmployeeOnboarding();

  const { milestones, loading: milestonesLoading } = useMilestones(user?.uid);

  if (checklistLoading || milestonesLoading) {
    return <div className="p-6">Loading…</div>;
  }

  const total = steps.length;
  const completed = steps.filter((s) => s.completed).length;

  const completionPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const currentPhaseIndex = Math.min(
    Math.floor((completionPercent / 100) * 5),
    4,
  );

  return (
    <div className="space-y-10 p-6">
      <MilestonesTimeline milestones={milestones} />

      <ChecklistProgress
        completionPercent={completionPercent}
        currentPhaseIndex={currentPhaseIndex}
      />

      <ChecklistTasks steps={steps} onToggle={toggleStepComplete} />
    </div>
  );
}