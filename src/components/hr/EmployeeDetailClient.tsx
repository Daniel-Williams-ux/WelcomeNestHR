'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  DocumentData,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Edit3,
  Trash2,
  User,
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

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'job' | 'docs' | 'activity' | 'payroll'
  >('profile');

  // fetch employee
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
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={back}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          aria-label="Back to employees"
        >
          <ChevronLeft size={18} /> Back
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setActiveTab('profile')}
            className="px-3 py-1 rounded bg-white border text-sm"
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('job')}
            className="px-3 py-1 rounded bg-white border text-sm"
          >
            Job
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className="px-3 py-1 rounded bg-white border text-sm"
          >
            Payroll
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className="px-3 py-1 rounded bg-white border text-sm"
          >
            Docs
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className="px-3 py-1 rounded bg-white border text-sm"
          >
            Activity
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* left column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {loading ? (
              <div className="text-sm text-gray-500">Loading employee…</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : !employee ? (
              <div className="text-sm text-gray-500">No employee data.</div>
            ) : (
              <div className="md:flex md:items-center md:gap-6">
                <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                  <Image
                    src={avatarSrc}
                    alt={employee.name ?? 'Employee avatar'}
                    width={112}
                    height={112}
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>

                <div className="mt-3 md:mt-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {employee.name ?? '—'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex gap-3 items-center">
                        <Briefcase size={14} /> {employee.title ?? '—'} •{' '}
                        {employee.department ?? '—'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert('Open edit drawer (TBD)')}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#FFB300] text-white text-sm shadow-sm"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={onDelete}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border text-sm text-red-600"
                        aria-label="Delete employee"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} /> <span>{employee.email ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} /> <span>{employee.phone ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />{' '}
                      <span>Start: {formatDate(employee.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />{' '}
                      <span>End: {formatDate(employee.endDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">About</h3>
            <p className="text-sm text-gray-600">
              This page shows the employee's profile, job & compensation
              details, payroll history and documents.
            </p>

            {/* TAB CONTENT */}
            <div className="mt-4">
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">
                      Employment status
                    </div>
                    <div className="mt-1">{employee?.status ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Employee since</div>
                    <div className="mt-1">
                      {formatDate(employee?.createdAt)}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs text-gray-500">Notes</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {(employee &&
                        (employee.notes ?? 'No notes available.')) ||
                        'No notes available.'}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'job' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Job title</div>
                    <div className="mt-1">{employee?.title ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Department</div>
                    <div className="mt-1">{employee?.department ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Compensation</div>
                    <div className="mt-1">
                      {employee?.salary
                        ? `$${Number(employee.salary).toLocaleString()}`
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Manager</div>
                    <div className="mt-1">{employee?.managerName ?? '—'}</div>
                  </div>
                </div>
              )}

              {activeTab === 'payroll' && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Payroll history (latest runs)
                  </div>
                  <ul className="mt-3 divide-y">
                    {/* Placeholder — wire to collection companies/{companyId}/payrolls filtered by employeeId */}
                    <li className="py-3 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">Nov 15, 2025</div>
                        <div className="text-xs text-gray-500">
                          Semi-monthly run
                        </div>
                      </div>
                      <div>
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                          Pending
                        </span>
                      </div>
                    </li>
                    <li className="py-3 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">Oct 31, 2025</div>
                        <div className="text-xs text-gray-500">
                          Semi-monthly run
                        </div>
                      </div>
                      <div>
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          Completed
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Employee documents
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      className="bg-gray-50 p-3 rounded border flex items-center justify-between"
                      href="#"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={18} />
                        <div>
                          <div className="text-sm font-medium">
                            Offer Letter
                          </div>
                          <div className="text-xs text-gray-500">
                            PDF • 32KB
                          </div>
                        </div>
                      </div>
                      <Download size={16} />
                    </a>

                    <a
                      className="bg-gray-50 p-3 rounded border flex items-center justify-between"
                      href="#"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={18} />
                        <div>
                          <div className="text-sm font-medium">ID Card</div>
                          <div className="text-xs text-gray-500">
                            PNG • 120KB
                          </div>
                        </div>
                      </div>
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="text-sm text-gray-600">
                  Recent activity is captured here. (Activity logging
                  integration TBD.)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* right column */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Quick Actions</div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={() => alert('Open Edit modal (TBD)')}
                className="px-3 py-2 rounded border text-sm"
              >
                Edit profile
              </button>
              <button
                onClick={onTerminate}
                disabled={saving}
                className="px-3 py-2 rounded border text-sm bg-white text-yellow-700"
              >
                Terminate employee
              </button>
              <button
                onClick={() => alert('Export profile CSV (TBD)')}
                className="px-3 py-2 rounded bg-[#00ACC1] text-white text-sm"
              >
                Export profile
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500">Meta</div>
            <div className="mt-2 text-sm text-gray-700">
              <div>
                <strong>ID</strong>{' '}
                <div className="text-xs text-gray-500">
                  {employee?.id ?? '—'}
                </div>
              </div>
              <div className="mt-2">
                <strong>Created</strong>{' '}
                <div className="text-xs text-gray-500">
                  {formatDate(employee?.createdAt)}
                </div>
              </div>
              <div className="mt-2">
                <strong>Status</strong>{' '}
                <div className="text-xs text-gray-500">
                  {employee?.status ?? '—'}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </motion.div>
    </div>
  );
}