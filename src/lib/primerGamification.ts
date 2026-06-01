export type PrimerPhase = '30' | '60' | '90';

export type PrimerGoalLike = {
  phase?: PrimerPhase;
  status?: string;
  title?: string;
};

export type PrimerBadge = {
  id: string;
  label: string;
  description: string;
};

export type PrimerGamification = {
  xp: number;
  level: number;
  levelName: string;
  nextLevelXp: number | null;
  progressToNextLevel: number;
  badges: PrimerBadge[];
  completedGoals: number;
  totalGoals: number;
  phaseProgress: Record<PrimerPhase, number>;
};

const LEVELS = [
  { level: 1, name: 'New Starter', minXp: 0 },
  { level: 2, name: 'Team Explorer', minXp: 40 },
  { level: 3, name: 'Role Builder', minXp: 100 },
  { level: 4, name: 'Impact Maker', minXp: 180 },
  { level: 5, name: 'Culture Contributor', minXp: 280 },
];

const PHASE_BONUS: Record<PrimerPhase, number> = {
  '30': 50,
  '60': 75,
  '90': 100,
};

function phaseGoals(goals: PrimerGoalLike[], phase: PrimerPhase) {
  return goals.filter((goal) => goal.phase === phase);
}

function completed(goals: PrimerGoalLike[]) {
  return goals.filter((goal) => goal.status === 'completed');
}

function progress(goals: PrimerGoalLike[]) {
  if (goals.length === 0) return 0;
  return Math.round((completed(goals).length / goals.length) * 100);
}

export function calculatePrimerGamification(
  goals: PrimerGoalLike[],
): PrimerGamification {
  const completedGoals = completed(goals).length;
  const phaseProgress = {
    '30': progress(phaseGoals(goals, '30')),
    '60': progress(phaseGoals(goals, '60')),
    '90': progress(phaseGoals(goals, '90')),
  };

  const completedGoalXp = completedGoals * 25;
  const phaseXp = (Object.keys(PHASE_BONUS) as PrimerPhase[]).reduce(
    (sum, phase) => sum + (phaseProgress[phase] === 100 ? PHASE_BONUS[phase] : 0),
    0,
  );
  const xp = completedGoalXp + phaseXp;
  const currentLevel = [...LEVELS].reverse().find((level) => xp >= level.minXp) ?? LEVELS[0];
  const nextLevel = LEVELS.find((level) => level.minXp > xp) ?? null;
  const previousXp = currentLevel.minXp;
  const progressToNextLevel = nextLevel
    ? Math.round(((xp - previousXp) / (nextLevel.minXp - previousXp)) * 100)
    : 100;

  const badges: PrimerBadge[] = [];

  if (completedGoals >= 1) {
    badges.push({
      id: 'first-goal',
      label: 'First Goal Completed',
      description: 'Completed the first Primer goal.',
    });
  }

  if (phaseProgress['30'] === 100) {
    badges.push({
      id: 'thirty-day-starter',
      label: '30-Day Starter',
      description: 'Finished the first 30-day foundation phase.',
    });
  }

  if (phaseProgress['60'] === 100) {
    badges.push({
      id: 'role-builder',
      label: 'Role Builder',
      description: 'Completed the 60-day growth phase.',
    });
  }

  if (phaseProgress['90'] === 100) {
    badges.push({
      id: 'ninety-day-finisher',
      label: '90-Day Finisher',
      description: 'Completed the full 90-day Primer journey.',
    });
  }

  if (completedGoals >= 3) {
    badges.push({
      id: 'consistency-streak',
      label: 'Consistency Streak',
      description: 'Completed at least three growth goals.',
    });
  }

  if (goals.some((goal) => goal.title?.toLowerCase().includes('relationship'))) {
    badges.push({
      id: 'culture-champion',
      label: 'Culture Champion',
      description: 'Engaged with team and culture-building goals.',
    });
  }

  return {
    xp,
    level: currentLevel.level,
    levelName: currentLevel.name,
    nextLevelXp: nextLevel?.minXp ?? null,
    progressToNextLevel,
    badges,
    completedGoals,
    totalGoals: goals.length,
    phaseProgress,
  };
}

export function getPrimerPhaseCelebrations(
  phaseProgress: Record<PrimerPhase, number>,
) {
  return (Object.keys(phaseProgress) as PrimerPhase[])
    .filter((phase) => phaseProgress[phase] === 100)
    .map((phase) => ({
      phase,
      title:
        phase === '30'
          ? '30-day foundation complete'
          : phase === '60'
            ? '60-day growth phase complete'
            : '90-day Primer journey complete',
      message:
        phase === '30'
          ? 'Great work. You have completed your first foundation phase.'
          : phase === '60'
            ? 'You are building strong role ownership and momentum.'
            : 'You completed the full Primer journey and are ready for the next growth chapter.',
    }));
}
