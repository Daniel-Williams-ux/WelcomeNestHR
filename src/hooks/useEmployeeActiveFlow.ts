'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUserAccess } from '@/hooks/useUserAccess';

export function useEmployeeActiveFlow() {
  const { user } = useUserAccess();
  const companyId = user?.companyId;
  const employeeId = user?.employeeId;

  const [flowId, setFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !companyId || !employeeId) {
      setLoading(false);
      return;
    }

    async function load() {
  console.log('ACTIVE FLOW DEBUG', {
    companyId,
    employeeId: user?.employeeId,
    uid: user?.uid,
  });
  const employeeRef = doc(db, 'companies', companyId, 'employees', employeeId);

  const employeeSnap = await getDoc(employeeRef);

  if (!employeeSnap.exists()) {
    setFlowId(null);
    setLoading(false);
    return;
  }

  const flowSnap = await getDocs(
    collection(
      db,
      'companies',
      companyId,
      'employees',
      user.employeeId,
      'onboardingFlows',
    ),
  );

  if (!flowSnap.empty) {
    setFlowId(flowSnap.docs[0].id);
  } else {
    setFlowId(null);
  }

  setLoading(false);
}
    load();
  }, [user?.uid, companyId]);

  return { flowId, loading };
}