'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Briefcase, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { assignOnboardingFlowToEmployee } from '@/lib/onboarding/assignOnboardingFlow';
import { useHRSession } from '@/hooks/useHRSession';
import { useOffboarding } from '@/hooks/useOffboarding';
import { useHROnboardingFlows } from '@/hooks/useHROnboardingFlows';

type Employee = {
  id: string;
  name?: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  status?: string;
  salary?: number;
  startDate?: string;
  endDate?: string | null;
  avatarUrl?: string;
  createdAt?: unknown;
  [k: string]: any;
};

export default function EmployeeDetailClient({
  employeeId,
}: {
  employeeId: string;
}) {
  const router = useRouter();
  const { companyId, loading: loadingCompany } = useHRSession();
  const { startOffboarding, offboarding } = useOffboarding(employeeId);

  const { flows, loading: flowsLoading } = useHROnboardingFlows();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlowId, setSelectedFlowId] = useState('');

  // Fetch employee
  useEffect(() => {
    let mounted = true;

    async function fetchEmployee() {
      if (!companyId) return;

      setLoading(true);
      setError(null);

      try {
        const ref = doc(db, 'companies', companyId, 'employees', employeeId);
        const snap = await getDoc(ref);

        if (!mounted) return;

        if (!snap.exists()) {
          setError('Employee not found.');
          setEmployee(null);
        } else {
          setEmployee({
            id: snap.id,
            ...(snap.data() as DocumentData),
          } as Employee);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load employee.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!loadingCompany) fetchEmployee();

    return () => {
      mounted = false;
    };
  }, [companyId, employeeId, loadingCompany]);

  // Start Offboarding
  const onStartOffboarding = async () => {
    if (!companyId || !employee) return;

    if (employee.status === 'exited') {
      alert('This employee has already been exited.');
      return;
    }

    if (employee.status === 'exiting' || offboarding) {
      router.push(`/hr/offboarding/${employee.id}`);
      return;
    }

    if (!confirm(`Start offboarding for ${employee.name}?`)) return;

    setSaving(true);
    try {
      await startOffboarding(companyId, employee.id, 'hr');
      router.push(`/hr/offboarding/${employee.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to start offboarding.');
    } finally {
      setSaving(false);
    }
  };

  // Assign Onboarding Flow
  const onAssignOnboarding = async () => {
    if (!companyId || !employee || !selectedFlowId) return;

    try {
      await assignOnboardingFlowToEmployee(
        companyId,
        employee.id,
        selectedFlowId,
      );

      alert('Onboarding flow assigned successfully');
      setSelectedFlowId('');
    } catch (err) {
      console.error(err);
      alert('Failed to assign onboarding flow');
    }
  };

  const back = () => router.push('/hr/employees');

  const avatarSrc = useMemo(
    () => employee?.avatarUrl ?? '/placeholder-employee.png',
    [employee],
  );

  if (loading) {
    return <div className="p-6">Loading employee…</div>;
  }

  if (error || !employee) {
    return <div className="p-6 text-sm text-gray-600">{error}</div>;
  }

  const isExited = employee.status === 'Exited' || employee.status === 'exited';

  return (
    <div className="space-y-6">
      <button
        onClick={back}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
      >
        <ChevronLeft size={18} /> Back
      </button>

      {isExited && (
        <div className="p-4 rounded-lg bg-gray-50 border text-sm text-gray-700">
          This employee has been exited. Their record is now read-only.
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 border">
            <div className="flex gap-6">
              <Image
                src={avatarSrc}
                alt={employee.name ?? 'Employee'}
                width={112}
                height={112}
              />
              <div className="flex-1">
                <div className="text-2xl font-semibold">{employee.name}</div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Briefcase size={14} />
                  {employee.title} • {employee.department}
                </div>

                <div className="mt-3 flex gap-2">
                  {employee.status === 'Active' && (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                  {employee.status === 'exiting' && (
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                      Exiting
                    </span>
                  )}
                  {isExited && (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                      Exited
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border">
            <div className="text-xs text-gray-500">Quick Actions</div>

            <div className="mt-3 flex flex-col gap-2">
              {!isExited && (
                <button
                  onClick={onStartOffboarding}
                  disabled={saving}
                  className="px-3 py-2 rounded bg-red-600 text-white"
                >
                  {employee.status === 'exiting'
                    ? 'View Offboarding'
                    : 'Start Offboarding'}
                </button>
              )}

              {/* Assign Onboarding */}
              {employee.status === 'Active' && (
                <>
                  <select
                    value={selectedFlowId}
                    onChange={(e) => setSelectedFlowId(e.target.value)}
                    className="border rounded px-2 py-2 text-sm"
                    disabled={flowsLoading}
                  >
                    <option value="">Select onboarding flow…</option>
                    {flows
                      .filter((f) => f.isActive)
                      .map((flow) => (
                        <option key={flow.id} value={flow.id}>
                          {flow.name}
                        </option>
                      ))}
                  </select>

                  <button
                    onClick={onAssignOnboarding}
                    disabled={!selectedFlowId}
                    className="px-3 py-2 rounded bg-[#00ACC1] text-white disabled:opacity-50"
                  >
                    Assign Onboarding
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>
      </motion.div>
    </div>
  );
}