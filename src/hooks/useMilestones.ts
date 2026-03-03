import { useEffect, useState } from 'react';
import { useUserAccess } from './useUserAccess';
import {
  getEmployeeOnboardingFlows,
  EmployeeMilestone,
} from '@/lib/onboarding/getEmployeeOnboarding';

export function useMilestones(employeeId?: string) {
  const { user } = useUserAccess();
  const [milestones, setMilestones] = useState<EmployeeMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !employeeId) {
      setMilestones([]);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const flows = await getEmployeeOnboardingFlows(employeeId);

        const merged = flows
          .flatMap((f) => f.milestones)
          .sort((a, b) => a.order - b.order);

        setMilestones(merged);
      } catch (err) {
        console.error('Failed to load milestones:', err);
        setMilestones([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, employeeId]);

  return { milestones, loading };
}
