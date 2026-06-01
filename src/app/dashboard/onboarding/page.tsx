'use client';

import { ChecklistProgress } from '@/components/ChecklistProgress';
import { ChecklistTasks } from '@/components/ChecklistTasks';
import { MilestonesTimeline } from '@/components/MilestonesTimeline';
import { useEmployeeOnboarding } from '@/hooks/useEmployeeOnboarding';
import { useMilestones } from '@/hooks/useMilestones';
import { useEmployeeActiveFlow } from '@/hooks/useEmployeeActiveFlow';

export default function SmartOnboardingPage() {
  const { flowId, loading: flowLoading } = useEmployeeActiveFlow();

  const {
    steps,
    loading: checklistLoading,
    toggleStepComplete,
  } = useEmployeeOnboarding(flowId ?? '');

  // safe calculation (works even while loading)
  const total = steps?.length ?? 0;
  const completed = steps?.filter((s) => s.completed).length ?? 0;

  const completionPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const { milestones } = useMilestones(completionPercent);

  const currentPhaseIndex = Math.min(
    Math.floor((completionPercent / 100) * 5),
    4,
  );

  if (flowLoading || checklistLoading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!flowId) {
    return (
      <div className="p-6 text-gray-500">
        No onboarding flow has been assigned yet.
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="p-6">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h1 className="text-lg font-semibold">Onboarding flow assigned</h1>
          <p className="mt-2 text-sm leading-6">
            HR has assigned an onboarding flow, but no checklist tasks have been
            added to it yet. Once HR adds tasks and assigns the flow again, they
            will appear here.
          </p>
        </section>
      </div>
    );
  }

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
