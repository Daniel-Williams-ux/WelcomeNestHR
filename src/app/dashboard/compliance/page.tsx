'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpenCheck, ClipboardCheck, FileCheck2, ShieldCheck } from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';
import { query, where } from 'firebase/firestore';
import {
  complianceTypeLabel,
  formatDate,
  getComplianceStatus,
  statusLabel,
  type ComplianceAssignment,
  type ComplianceModule,
  type ComplianceType,
} from '@/lib/compliance';

type AssignedComplianceModule = ComplianceModule & {
  assignmentId: string;
  assignment: ComplianceAssignment;
};

const typeIcons: Record<ComplianceType, typeof FileCheck2> = {
  policy: FileCheck2,
  certification: Award,
  training: BookOpenCheck,
  task: ClipboardCheck,
};

export default function CompliancePage() {
  const { user, companyId } = useUserAccess();
  const employeeId = user?.employeeId ?? null;

  const [modules, setModules] = useState<AssignedComplianceModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [licenseNumber, setLicenseNumber] = useState<Record<string, string>>({});
  const [completionNote, setCompletionNote] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    if (!user?.uid || !companyId || !employeeId) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        const assignSnap = await getDocs(
          query(
            collection(db, 'companies', companyId, 'complianceAssignments'),
            where('employeeId', '==', employeeId),
          ),
        );

        const myAssignments: ComplianceAssignment[] = assignSnap.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            employeeId: String(data.employeeId),
            moduleId: String(data.moduleId),
            status: data.status,
            dueDate: data.dueDate,
            expiresAt: data.expiresAt,
            completedAt: data.completedAt,
            acknowledgedAt: data.acknowledgedAt,
            licenseNumber: data.licenseNumber,
            completionNote: data.completionNote,
          };
        });

        if (myAssignments.length === 0) {
          if (!cancelled) {
            setModules([]);
            setLoading(false);
          }
          return;
        }

        const moduleSnap = await getDocs(
          collection(db, 'companies', companyId, 'complianceModules'),
        );

        const moduleMap: Record<string, ComplianceModule> = {};

        moduleSnap.docs.forEach((doc) => {
          moduleMap[doc.id] = {
            id: doc.id,
            ...(doc.data() as Omit<ComplianceModule, 'id'>),
          };
        });

        const assignedModules = myAssignments
          .map((assignment) => {
            const moduleItem = moduleMap[assignment.moduleId];

            if (!moduleItem) return null;

            return {
              ...moduleItem,
              assignmentId: assignment.id,
              assignment,
            };
          })
          .filter(Boolean) as AssignedComplianceModule[];

        if (!cancelled) {
          setModules(assignedModules);
          setLicenseNumber(
            Object.fromEntries(
              assignedModules.map((item) => [
                item.assignmentId,
                item.assignment.licenseNumber ?? '',
              ]),
            ),
          );
          setCompletionNote(
            Object.fromEntries(
              assignedModules.map((item) => [
                item.assignmentId,
                item.assignment.completionNote ?? '',
              ]),
            ),
          );
        }
      } catch (err) {
        console.error('Compliance load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, companyId, employeeId]);
  
  const markAsCompleted = async (moduleItem: AssignedComplianceModule) => {
    if (!companyId) return;

    try {
      const payload: Record<string, any> = {
        status: 'completed',
        completedAt: serverTimestamp(),
      };

      if (moduleItem.type === 'policy') {
        payload.acknowledgedAt = serverTimestamp();
      }

      if (moduleItem.type === 'certification') {
        payload.licenseNumber = licenseNumber[moduleItem.assignmentId]?.trim() ?? '';
      }

      if (completionNote[moduleItem.assignmentId]?.trim()) {
        payload.completionNote = completionNote[moduleItem.assignmentId].trim();
      }

      await updateDoc(
        doc(db, 'companies', companyId, 'complianceAssignments', moduleItem.assignmentId),
        payload,
      );

      setModules((prev) =>
        prev.map((m) =>
          m.assignmentId === moduleItem.assignmentId
            ? {
                ...m,
                assignment: {
                  ...m.assignment,
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                  acknowledgedAt:
                    m.type === 'policy'
                      ? new Date().toISOString()
                      : m.assignment.acknowledgedAt,
                  licenseNumber:
                    m.type === 'certification'
                      ? licenseNumber[m.assignmentId]?.trim()
                      : m.assignment.licenseNumber,
                  completionNote:
                    completionNote[m.assignmentId]?.trim() ||
                    m.assignment.completionNote,
                },
              }
            : m,
        ),
      );
    } catch (err) {
      console.error('Mark complete error:', err);
    }
  };
  
  
  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading compliance modules...
      </div>
    );
  }

  return (
    <motion.section
      className="rounded-2xl shadow-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-labelledby="compliance-title"
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="compliance-title"
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            <ShieldCheck className="h-5 w-5 text-[#FB8C00]" /> Compliance Center
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Complete required policies, trainings, certifications, and compliance tasks.
          </p>
        </div>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No compliance modules assigned to you yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {modules.map((m) => {
            const status = getComplianceStatus(m.assignment);
            const Icon = typeIcons[m.type] ?? ClipboardCheck;

            return (
              <li
                key={`${m.id}-${m.assignment.status}`}
                className="p-4 rounded-lg bg-[#F9FAFB] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Icon className="h-4 w-4 text-[#00ACC1]" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {m.title}
                      </p>
                      <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">
                        {complianceTypeLabel(m.type)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {m.description || 'No description provided.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Due: {formatDate(m.assignment.dueDate)}</span>
                      {m.type === 'certification' && (
                        <span>Expires: {formatDate(m.assignment.expiresAt)}</span>
                      )}
                      {m.documentUrl && (
                        <a
                          href={m.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#008FA1] underline"
                        >
                          Open document
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : status === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : status === 'expiring_soon'
                              ? 'bg-orange-100 text-orange-700'
                              : status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusLabel(status)}
                    </span>
                    {status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => markAsCompleted(m)}
                        className="text-xs px-2 py-1 rounded bg-[#00ACC1] text-white hover:opacity-90"
                      >
                        {m.type === 'policy' ? 'Acknowledge' : 'Mark complete'}
                      </button>
                    )}
                  </div>
                </div>

                {status !== 'completed' && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {m.type === 'certification' && (
                      <input
                        value={licenseNumber[m.assignmentId] ?? ''}
                        onChange={(event) =>
                          setLicenseNumber((current) => ({
                            ...current,
                            [m.assignmentId]: event.target.value,
                          }))
                        }
                        placeholder="License or certification number"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                      />
                    )}
                    <input
                      value={completionNote[m.assignmentId] ?? ''}
                      onChange={(event) =>
                        setCompletionNote((current) => ({
                          ...current,
                          [m.assignmentId]: event.target.value,
                        }))
                      }
                      placeholder="Optional completion note"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}