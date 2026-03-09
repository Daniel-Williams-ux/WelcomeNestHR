import { useMemo } from 'react';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'complete';
}

export function useMilestones(completionPercent: number) {
  const milestones = useMemo(() => {
    const phases = [
      {
        id: 'preboarding',
        title: 'Preboarding',
        description: 'Initial setup and preparation.',
        threshold: 0,
      },
      {
        id: 'day1',
        title: 'Day 1',
        description: 'First day orientation.',
        threshold: 20,
      },
      {
        id: 'week1',
        title: 'Week 1',
        description: 'Learning the basics of your role.',
        threshold: 40,
      },
      {
        id: '30days',
        title: '30 Days',
        description: 'Becoming productive in your role.',
        threshold: 60,
      },
      {
        id: 'beyond',
        title: 'Beyond',
        description: 'Full integration into the team.',
        threshold: 80,
      },
    ];

    return phases.map((phase, index) => {
      let status: 'pending' | 'in_progress' | 'complete' = 'pending';

      if (completionPercent >= phase.threshold + 20) {
        status = 'complete';
      } else if (completionPercent >= phase.threshold) {
        status = 'in_progress';
      }

      return {
        id: phase.id,
        title: phase.title,
        description: phase.description,
        order: index,
        status,
      };
    });
  }, [completionPercent]);

  return { milestones, loading: false };
}