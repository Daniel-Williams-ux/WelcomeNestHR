export interface MilestoneConfig {
  id: string;
  triggerPercent: number;
}

export type MilestoneStatus = 'completed' | 'current' | 'upcoming';

export function getMilestoneStatuses(
  percent: number,
  milestones: MilestoneConfig[],
) {
  const sorted = [...milestones].sort(
    (a, b) => a.triggerPercent - b.triggerPercent,
  );

  let currentIndex = -1;

  sorted.forEach((m, i) => {
    if (percent >= m.triggerPercent) {
      currentIndex = i;
    }
  });

  return sorted.map((m, i) => {
    let status: MilestoneStatus = 'upcoming';

    if (i < currentIndex) status = 'completed';
    else if (i === currentIndex) status = 'current';

    return {
      id: m.id,
      triggerPercent: m.triggerPercent,
      status,
    };
  });
}
