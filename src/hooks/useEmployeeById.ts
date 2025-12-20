'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Employee } from '@/hooks/useEmployees';

export function useEmployeeById(companyId: string | null, employeeId: string) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !employeeId) return;

    const load = async () => {
      try {
        const ref = doc(db, 'companies', companyId, 'employees', employeeId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError('Employee not found');
          setLoading(false);
          return;
        }

        setEmployee({ id: snap.id, ...(snap.data() as any) });
      } catch (err) {
        setError('Failed to load employee');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [companyId, employeeId]);

  return { employee, loading, error };
}