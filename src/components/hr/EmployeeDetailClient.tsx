'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  DocumentData,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from 'firebase/firestore';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Edit3,
  Trash2,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  Download,
  FileText,
  ChevronLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useOffboarding } from '@/hooks/useOffboarding';

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
  const { companyId, loading: loadingCompany } = useCurrentCompany();
  const { startOffboarding, offboarding } = useOffboarding(employeeId);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'job' | 'docs' | 'activity' | 'payroll'
  >('profile');

  // Fetch employee
  useEffect(() => {
    let mounted = true;
    async function fetchEmployee() {
      setLoading(true);
      setError(null);
      if (!companyId) {
        setError('No company assigned.');
        setLoading(false);
        return;
      }
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

  const formatDate = (v?: unknown) => {
    try {
      if (!v) return '—';
      if (typeof v === 'string') return new Date(v).toLocaleDateString();
      if (v && typeof v === 'object' && 'seconds' in (v as any)) {
        const t = v as any;
        return new Date(t.seconds * 1000).toLocaleDateString();
      }
      if (v instanceof Date) return v.toLocaleDateString();
      return String(v);
    } catch {
      return String(v);
    }
  };

  // START OFFBOARDING
  const onStartOffboarding = async () => {
    if (!companyId || !employee) return;

    // Prevent double offboarding
    if (employee.status === 'exiting' || offboarding) {
      alert('Offboarding is already in progress for this employee.');
      return;
    }

    if (
      !confirm(
        `Start offboarding for ${
          employee.name ?? 'this employee'
        }? This action cannot be undone.`
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      await startOffboarding(companyId);

      const ref = doc(db, 'companies', companyId, 'employees', employee.id);
      await updateDoc(ref, {
        status: 'exiting',
        updatedAt: serverTimestamp(),
      });

      // Audit log
      await addDoc(collection(db, 'companies', companyId, 'auditLogs'), {
        action: 'offboarding_started',
        entityType: 'employee',
        entityId: employee.id,
        employeeName: employee.name ?? null,
        performedBy: 'hr',
        timestamp: serverTimestamp(),
      });

      router.push(`/hr/offboarding/${employee.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to start offboarding.');
    } finally {
      setSaving(false);
    }
  };

  const onTerminate = async () => {
    if (!companyId || !employee) return;
    if (
      !confirm(
        `Are you sure you want to terminate ${
          employee.name ?? 'this employee'
        }?`
      )
    )
      return;

    setSaving(true);
    try {
      const ref = doc(db, 'companies', companyId, 'employees', employee.id);
      await updateDoc(ref, {
        status: 'Exited',
        endDate: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
      setEmployee((s) =>
        s ? { ...s, status: 'Exited', endDate: new Date().toISOString() } : s
      );
      alert('Employee terminated.');
    } catch (err) {
      console.error(err);
      alert('Failed to terminate employee.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!companyId || !employee) return;
    if (
      !confirm(
        `Permanently delete ${
          employee.name ?? 'this employee'
        }? This cannot be undone.`
      )
    )
      return;
    setSaving(true);
    try {
      const ref = doc(db, 'companies', companyId, 'employees', employee.id);
      await updateDoc(ref, { deletedAt: serverTimestamp() });
      alert('Employee removed (soft-deleted).');
      router.push('/hr/employees');
    } catch (err) {
      console.error(err);
      alert('Failed to delete employee.');
    } finally {
      setSaving(false);
    }
  };

  const back = () => router.push('/hr/employees');

  const avatarSrc = useMemo(
    () => employee?.avatarUrl ?? '/placeholder-employee.png',
    [employee]
  );

  return (
    <div className="space-y-6">
      <button
        onClick={back}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
      >
        <ChevronLeft size={18} /> Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 border">
            {employee && (
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
                    {employee.status === 'Exited' && (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        Exited
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border">
            <div className="text-xs text-gray-500">Quick Actions</div>

            <div className="mt-3 flex flex-col gap-2">
              {employee?.status === 'Active' && !offboarding && (
                <button
                  onClick={onStartOffboarding}
                  disabled={saving}
                  className="px-3 py-2 rounded bg-red-600 text-white"
                >
                  Start Offboarding
                </button>
              )}

              <button
                onClick={onTerminate}
                disabled={saving}
                className="px-3 py-2 rounded border text-yellow-700"
              >
                Terminate employee
              </button>
            </div>
          </div>
        </aside>
      </motion.div>
    </div>
  );
}