'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getEmployeeBuddy,
  getAnnouncements,
  getEmployeesForOrg,
} from '@/lib/collaborate';

type CollaborateState = {
  buddy: any | null;
  announcements: any[];
  employees: any[];
  loading: boolean;
};

export function useCollaborate(companyId: string, employeeId: string) {
  const [state, setState] = useState<CollaborateState>({
    buddy: null,
    announcements: [],
    employees: [],
    loading: true,
  });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      //  Parallel fetch (important for performance)
      const [buddy, announcementRes, employees] = await Promise.all([
        getEmployeeBuddy(companyId, employeeId),
        getAnnouncements(companyId),
        getEmployeesForOrg(companyId),
      ]);

      setState({
        buddy,
        announcements: announcementRes.announcements,
        employees,
        loading: false,
      });
    } catch (error) {
      console.error('Collaborate load error:', error);

      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, [companyId, employeeId]);

  useEffect(() => {
    if (!companyId || !employeeId) return;

    loadData();
  }, [loadData, companyId, employeeId]);

  return {
    ...state,
    reload: loadData, //  future manual refresh
  };
}
