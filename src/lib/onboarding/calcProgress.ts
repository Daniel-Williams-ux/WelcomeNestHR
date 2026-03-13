export interface MilestoneConfig {
  id: string;
  triggerPercent: number;
}

export interface MilestoneConfig {
  id: string;
  triggerPercent: number;
}

export function calcProgress(
  steps: { completed: boolean }[],
  milestones: MilestoneConfig[],
) {
  const total = steps.length;
  const completed = steps.filter((s) => s.completed).length;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  let milestone = 'preboarding';

  const sortedMilestones = [...milestones].sort(
    (a, b) => a.triggerPercent - b.triggerPercent,
  );

  for (const m of sortedMilestones) {
    if (percent >= m.triggerPercent) {
      milestone = m.id;
    }
  }

  return {
    percent,
    completed,
    total,
    milestone, // current milestone
  };
}