'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { useUserAccess } from '@/hooks/useUserAccess';
import {
  complianceTypeLabel,
  formatDate,
  getComplianceStatus,
  statusLabel,
  type ComplianceAssignment,
  type ComplianceModule,
  type ComplianceType,
} from '@/lib/compliance';

type OnboardingProgress = {
  completed: number;
  total: number;
  percent: number;
  currentMilestone: string;
};

export default function HRCompliancePage() {
  const { companyId, loading: authLoading } = useUserAccess();
  
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ComplianceType | ''>('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [defaultDueDate, setDefaultDueDate] = useState('');
  const [defaultExpiresAt, setDefaultExpiresAt] = useState('');

  const [modules, setModules] = useState<ComplianceModule[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [onboardingProgress, setOnboardingProgress] = useState<
    Record<string, OnboardingProgress>
  >({});

  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');

  const [loading, setLoading] = useState(true);

  const [assignments, setAssignments] = useState<ComplianceAssignment[]>([]);

  const toTimestamp = (value: string) =>
    value ? Timestamp.fromDate(new Date(`${value}T12:00:00`)) : null;

  // =========================
  // FETCH DATA
  // =========================
  const fetchModules = async (companyId: string) => {
    const snapshot = await getDocs(
      collection(db, 'companies', companyId, 'complianceModules'),
    );

    setModules(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ComplianceModule, 'id'>),
      })),
    );
  };

  const fetchEmployees = async (companyId: string) => {
    const snapshot = await getDocs(
      collection(db, 'companies', companyId, 'employees'),
    );

    const employeeRows: any[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setEmployees(employeeRows);

    const progressEntries = await Promise.all(
      employeeRows.map(async (employee) => {
        const cachedProgress = employee.onboarding?.progress;
        if (
          cachedProgress &&
          typeof cachedProgress.completed === 'number' &&
          typeof cachedProgress.total === 'number'
        ) {
          return [
            employee.id,
            {
              completed: cachedProgress.completed,
              total: cachedProgress.total,
              percent:
                typeof cachedProgress.percent === 'number'
                  ? cachedProgress.percent
                  : cachedProgress.total === 0
                    ? 0
                    : Math.round(
                        (cachedProgress.completed / cachedProgress.total) * 100,
                      ),
              currentMilestone:
                cachedProgress.currentMilestone ?? 'Progress updated',
            },
          ] as const;
        }

        const flowsSnap = await getDocs(
          collection(
            db,
            'companies',
            companyId,
            'employees',
            employee.id,
            'onboardingFlows',
          ),
        );

        if (flowsSnap.empty) {
          return [
            employee.id,
            {
              completed: 0,
              total: 0,
              percent: 0,
              currentMilestone: 'Not assigned',
            },
          ] as const;
        }

        const primaryFlowId = employee.onboarding?.primaryFlowId;
        const flowDoc =
          flowsSnap.docs.find((doc) => doc.id === primaryFlowId) ??
          flowsSnap.docs[0];
        const flowData = flowDoc.data();
        const milestones = flowData.milestones ?? [];
        const tasks = milestones.flatMap((milestone: any) =>
          (milestone.tasks ?? []).map((task: any) => ({
            ...task,
            milestoneTitle: milestone.title,
          })),
        );

        const total = tasks.length;
        const completed = tasks.filter((task: any) => task.completed === true).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        const nextTask = tasks.find((task: any) => task.completed !== true);

        return [
          employee.id,
          {
            completed,
            total,
            percent,
            currentMilestone:
              total === 0
                ? 'No tasks'
                : nextTask?.milestoneTitle ?? 'Complete',
          },
        ] as const;
      }),
    );

    setOnboardingProgress(Object.fromEntries(progressEntries));
  };

  useEffect(() => {
    if (authLoading) return;

    if (!companyId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);

    Promise.all([fetchModules(companyId), fetchEmployees(companyId)])
      .catch((error) => {
        console.error('Error loading compliance data:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = onSnapshot(
      collection(db, 'companies', companyId, 'complianceAssignments'),
      (snapshot) => {
        setAssignments(
          snapshot.docs.map((doc) => {
            const data = doc.data();

            return {
              id: doc.id,
              moduleId: String(data.moduleId),
              employeeId: String(data.employeeId),
              status: data.status,
              dueDate: data.dueDate,
              expiresAt: data.expiresAt,
              completedAt: data.completedAt,
              acknowledgedAt: data.acknowledgedAt,
              licenseNumber: data.licenseNumber,
              completionNote: data.completionNote,
            };
          }),
        );
      },
      (error) => {
        console.error('Error listening to assignments:', error);
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [authLoading, companyId]);

  // =========================
  // SAVE MODULE
  // =========================
  const handleSave = async () => {
    if (!title || !type || !companyId) return;

    await addDoc(collection(db, 'companies', companyId, 'complianceModules'), {
      title: title.trim(),
      description: description.trim(),
      type,
      documentUrl: documentUrl.trim(),
      issuingAuthority: issuingAuthority.trim(),
      requiresAcknowledgment: type === 'policy',
      defaultDueDate: toTimestamp(defaultDueDate),
      defaultExpiresAt: type === 'certification' ? toTimestamp(defaultExpiresAt) : null,
      createdAt: serverTimestamp(),
    });

    setTitle('');
    setDescription('');
    setType('');
    setDocumentUrl('');
    setIssuingAuthority('');
    setDefaultDueDate('');
    setDefaultExpiresAt('');
    setShowForm(false);

    fetchModules(companyId);
  };

  // =========================
  // ASSIGN
  // =========================
  const handleAssign = async (moduleId: string) => {
    if (!employeeId || !companyId) {
      return;
    }

    try {
      const alreadyAssigned = assignments.some(
        (assignment) =>
          assignment.employeeId === employeeId && assignment.moduleId === moduleId,
      );

      if (alreadyAssigned) {
        setEmployeeId('');
        setAssigningId(null);
        return;
      }

      const moduleItem = modules.find((module) => module.id === moduleId);
      const payload = {
        moduleId,
        employeeId,
        status: 'pending',
        dueDate: moduleItem?.defaultDueDate ?? null,
        expiresAt: moduleItem?.defaultExpiresAt ?? null,
        createdAt: serverTimestamp(),
      };

      await addDoc(
        collection(db, 'companies', companyId, 'complianceAssignments'),
        payload,
      );

      setEmployeeId('');
      setAssigningId(null);

    } catch (error) {
      console.error('Assignment failed:', error);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const validAssignments = assignments.filter((a) =>
    modules.some((m) => m.id === a.moduleId),
  );
  const moduleMap = new Map(modules.map((module) => [module.id, module]));
  const assignmentsWithStatus = validAssignments.map((assignment) => ({
    ...assignment,
    status: getComplianceStatus(assignment),
    module: moduleMap.get(assignment.moduleId),
  }));
  const completedAssignments = assignmentsWithStatus.filter(
    (assignment) => assignment.status === 'completed',
  );
  const overdueAssignments = assignmentsWithStatus.filter(
    (assignment) => assignment.status === 'overdue',
  );
  const expiringAssignments = assignmentsWithStatus.filter(
    (assignment) => assignment.status === 'expiring_soon',
  );
  const riskScore =
    assignmentsWithStatus.length === 0
      ? 100
      : Math.max(
          0,
          Math.round(
            100 -
              ((overdueAssignments.length * 2 + expiringAssignments.length) /
                assignmentsWithStatus.length) *
                50,
          ),
        );
  
  const employeeCompliance = employees.map((emp) => {
    const empAssignments = assignments.filter((a) => a.employeeId === emp.id);

    const validAssignments = empAssignments.filter((a) =>
      modules.some((m) => m.id === a.moduleId),
    );

    const uniqueModules = Array.from(
      new Set(validAssignments.map((a) => a.moduleId)),
    );

    const completedModules = uniqueModules.filter((moduleId) => {
      const moduleAssignments = validAssignments.filter(
        (a) => a.moduleId === moduleId,
      );

      return moduleAssignments.some((a) => getComplianceStatus(a) === 'completed');
    });


    const percent =
      uniqueModules.length === 0
        ? 0
        : Math.round((completedModules.length / uniqueModules.length) * 100);

    return {
      employee: emp,
      percent,
      total: uniqueModules.length,
      completed: completedModules.length,
    };
  });
  const employeesWithCompliance = employeeCompliance.filter((ec) => ec.total > 0);
  const complianceRate =
    employeesWithCompliance.length === 0
      ? 0
      : Math.round(
          employeesWithCompliance.reduce((sum, ec) => sum + ec.percent, 0) /
            employeesWithCompliance.length,
        );

  const atRiskEmployees = employeeCompliance
    .map((ec) => {
      const onboarding = onboardingProgress[ec.employee.id] ?? {
        completed: 0,
        total: 0,
        percent: 0,
        currentMilestone: 'Not assigned',
      };

      return {
        ...ec,
        onboarding,
        hasComplianceRisk: ec.total > 0 && ec.percent < 100,
        hasOnboardingRisk: onboarding.total > 0 && onboarding.percent < 100,
      };
    })
    .filter((ec) => ec.hasComplianceRisk || ec.hasOnboardingRisk)
    .sort((a, b) => {
      const aLowest = Math.min(
        a.hasComplianceRisk ? a.percent : 100,
        a.hasOnboardingRisk ? a.onboarding.percent : 100,
      );
      const bLowest = Math.min(
        b.hasComplianceRisk ? b.percent : 100,
        b.hasOnboardingRisk ? b.onboarding.percent : 100,
      );

      return aLowest - bLowest;
    });

  return (
    <div className="p-6 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Compliance</h1>
          <p className="text-sm text-gray-600 mt-1 dark:text-slate-300">
            Manage policy acknowledgments, certifications, training, and audit readiness.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#00ACC1] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90"
        >
          {showForm ? 'Close' : 'Create Requirement'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Risk score
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {riskScore}%
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {riskScore >= 85 ? 'Green' : riskScore >= 60 ? 'Yellow' : 'Red'} readiness
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Completed
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {completedAssignments.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">documented records</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Overdue
          </p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {overdueAssignments.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">needs HR follow-up</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Expiring soon
          </p>
          <p className="mt-2 text-3xl font-bold text-orange-600">
            {expiringAssignments.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">within 60 days</p>
        </div>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="border rounded-2xl p-4 bg-white space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-medium text-gray-900 dark:text-white">
            New compliance requirement
          </h2>

          <input
            type="text"
            placeholder="Title, e.g. Employee Handbook Acknowledgment"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value as ComplianceType | '')}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">Select type</option>
            <option value="policy">Policy acknowledgment</option>
            <option value="certification">Certification/license</option>
            <option value="training">Mandatory training</option>
            <option value="task">Compliance task</option>
          </select>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="url"
              placeholder="Document or training URL (optional)"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />

            <input
              type="text"
              placeholder="Issuing authority (optional)"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />

            <label className="text-xs font-medium text-gray-600 dark:text-slate-300">
              Due date
              <input
                type="date"
                value={defaultDueDate}
                onChange={(e) => setDefaultDueDate(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>

            <label className="text-xs font-medium text-gray-600 dark:text-slate-300">
              Expiration date for certification/license
              <input
                type="date"
                value={defaultExpiresAt}
                onChange={(e) => setDefaultExpiresAt(e.target.value)}
                disabled={type !== 'certification'}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            className="bg-[#004d59] text-white px-4 py-2 rounded-lg text-sm"
          >
            Save requirement
          </button>
        </div>
      )}

      {/* ================= MODULES ================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Compliance Requirements</h2>

        {modules.length === 0 && (
          <div className="text-sm text-gray-500">
            No compliance requirements yet. Create your first policy,
            certification, training, or task to begin compliance tracking.
          </div>
        )}

        {modules.map((module) => (
          <div
            key={module.id}
            className="border rounded-xl p-4 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 dark:text-slate-300">
                  {module.description || 'No description added.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>Due: {formatDate(module.defaultDueDate)}</span>
                  {module.type === 'certification' && (
                    <span>Expires: {formatDate(module.defaultExpiresAt)}</span>
                  )}
                  {module.issuingAuthority && (
                    <span>Issuer: {module.issuingAuthority}</span>
                  )}
                  {module.documentUrl && (
                    <a
                      href={module.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#008FA1] underline"
                    >
                      Open document
                    </a>
                  )}
                </div>
              </div>

              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {complianceTypeLabel(module.type)}
              </span>
            </div>

            <div className="flex items-center justify-end mt-3">
              <button
                onClick={() => setAssigningId(module.id)}
                className="bg-[#00ACC1] text-white px-3 py-1 rounded text-xs"
              >
                Assign
              </button>
            </div>

            {assigningId === module.id && (
              <div className="mt-3 space-y-2">
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select employee</option>

                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.title}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleAssign(module.id)}
                  className="bg-[#00ACC1] text-white px-3 py-1 rounded text-xs"
                >
                  Confirm Assign
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Tracking</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Company compliance rate: {complianceRate}% across{' '}
          {employeesWithCompliance.length} employee
          {employeesWithCompliance.length === 1 ? '' : 's'} with assigned modules.
        </p>

        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Employee Onboarding Progress
          </h3>

          {employees.map((employee) => {
            const progress = onboardingProgress[employee.id] ?? {
              completed: 0,
              total: 0,
              percent: 0,
              currentMilestone: 'Not assigned',
            };

            return (
              <div
                key={employee.id}
                className="p-3 border rounded-lg bg-white flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium">{employee.name}</p>
                  <p className="text-xs text-gray-500">
                    {progress.completed}/{progress.total} onboarding tasks ·{' '}
                    {progress.currentMilestone}
                  </p>
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded ${
                    progress.total === 0
                      ? 'bg-gray-100 text-gray-500'
                      : progress.percent === 100
                        ? 'bg-green-100 text-green-700'
                        : progress.percent > 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                  }`}
                >
                  {progress.total === 0 ? 'N/A' : `${progress.percent}%`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Employee Compliance
          </h3>

          {employeeCompliance.map((ec) => (
            <div
              key={ec.employee.id}
              className="p-3 border rounded-lg bg-white flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium">{ec.employee.name}</p>
                <p className="text-xs text-gray-500">
                  {ec.completed}/{ec.total} modules
                </p>
              </div>

              <span
                className={`text-xs px-2 py-1 rounded ${
                  ec.total === 0
                    ? 'bg-gray-100 text-gray-500'
                    : ec.percent === 100
                      ? 'bg-green-100 text-green-700'
                      : ec.percent > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                }`}
              >
                {ec.total === 0 ? 'N/A' : `${ec.percent}%`}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium text-red-600">
            At Risk Employees
          </h3>

          {atRiskEmployees.length === 0 ? (
            <p className="text-xs text-gray-500">
              No employees are currently at risk.
            </p>
          ) : (
            atRiskEmployees.map((ec) => (
              <div
                key={ec.employee.id}
                className="p-3 border rounded-lg bg-red-50 flex justify-between gap-3 items-center"
              >
                <div>
                  <p className="text-sm font-medium">{ec.employee.name}</p>
                  <p className="text-xs text-gray-500">
                    {ec.hasOnboardingRisk &&
                      `${ec.onboarding.completed}/${ec.onboarding.total} onboarding tasks`}
                    {ec.hasOnboardingRisk && ec.hasComplianceRisk ? ' · ' : ''}
                    {ec.hasComplianceRisk &&
                      `${ec.completed}/${ec.total} compliance modules`}
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {ec.hasOnboardingRisk && (
                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                      Onboarding {ec.onboarding.percent}%
                    </span>
                  )}
                  {ec.hasComplianceRisk && (
                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                      Compliance {ec.percent}%
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ================= CORE CARDS ================= */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 p-4 bg-white">
          <h2 className="font-medium text-gray-900">Training</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage compliance modules.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 p-4 bg-white">
          <h2 className="font-medium text-gray-900">Assignments</h2>
          <p className="text-sm text-gray-500 mt-1">
            Assign training to employees or teams.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 p-4 bg-white">
          <h2 className="font-medium text-gray-900">Tracking</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor completion and compliance status.
          </p>
        </div>
      </div>
    </div>
  );
}