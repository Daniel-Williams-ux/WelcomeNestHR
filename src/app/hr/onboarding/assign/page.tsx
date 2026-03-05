'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { assignOnboardingFlowToEmployee } from '@/lib/onboarding/assignOnboardingFlow';
import { useHRContext } from '@/hooks/useHRContext';

export default function AssignOnboardingFlowPage() {
  const { companyId } = useHRContext();
  const [employees, setEmployees] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [flowId, setFlowId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    async function load() {
      const empSnap = await getDocs(
        collection(db, 'companies', companyId, 'employees'),
      );

      const flowSnap = await getDocs(
        collection(db, 'companies', companyId, 'onboardingFlows'),
      );

      setEmployees(
        empSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })),
      );

      setFlows(
        flowSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })),
      );
    }

    load();
  }, [companyId]);

  async function assign() {
    if (!companyId || !employeeId || !flowId) return;

    setAssigning(true);
    await assignOnboardingFlowToEmployee(companyId, employeeId, flowId);
    setAssigning(false);

    alert('Onboarding flow assigned');
  }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">Assign Onboarding Flow</h1>

      <select
        className="w-full border px-3 py-2"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
      >
        <option value="">Select employee</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name || e.email}
          </option>
        ))}
      </select>

      <select
        className="w-full border px-3 py-2"
        value={flowId}
        onChange={(e) => setFlowId(e.target.value)}
      >
        <option value="">Select onboarding flow</option>
        {flows.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      <button
        onClick={assign}
        disabled={assigning}
        className="px-4 py-2 rounded bg-black text-white"
      >
        Assign Flow
      </button>
    </div>
  );
}