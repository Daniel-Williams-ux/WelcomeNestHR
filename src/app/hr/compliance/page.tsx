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
    employee: employees.find((employee) => employee.id === assignment.employeeId),
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

  const complianceRiskEmployees = employeeCompliance
    .filter((ec) => ec.total > 0 && ec.percent < 100)
    .sort((a, b) => a.percent - b.percent);

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

      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assignment Register
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Track every policy, certification, training, and task assigned to employees.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {assignmentsWithStatus.length} active record
            {assignmentsWithStatus.length === 1 ? '' : 's'}
          </span>
        </div>

        {assignmentsWithStatus.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            No compliance assignments yet. Assign a requirement to an employee to
            start building audit-ready records.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {assignmentsWithStatus.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {assignment.module?.title || 'Missing requirement'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Assigned to{' '}
                      <span className="font-medium text-gray-700">
                        {assignment.employee?.name || 'Unknown employee'}
                      </span>
                      {assignment.employee?.department
                        ? ` · ${assignment.employee.department}`
                        : ''}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${
                      assignment.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : assignment.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : assignment.status === 'expiring_soon'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {statusLabel(assignment.status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-xs text-gray-600 sm:grid-cols-3">
                  <div>
                    <p className="font-medium uppercase tracking-wide text-gray-400">
                      Type
                    </p>
                    <p className="mt-1">
                      {assignment.module
                        ? complianceTypeLabel(assignment.module.type)
                        : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium uppercase tracking-wide text-gray-400">
                      Due
                    </p>
                    <p className="mt-1">{formatDate(assignment.dueDate)}</p>
                  </div>
                  <div>
                    <p className="font-medium uppercase tracking-wide text-gray-400">
                      Expires
                    </p>
                    <p className="mt-1">
                      {assignment.module?.type === 'certification'
                        ? formatDate(assignment.expiresAt)
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {assignment.completionNote && (
                  <p className="mt-3 rounded-lg bg-white p-2 text-xs text-gray-500 dark:bg-slate-900">
                    Note: {assignment.completionNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Employee Compliance Summary
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            Company compliance rate: {complianceRate}% across{' '}
            {employeesWithCompliance.length} employee
            {employeesWithCompliance.length === 1 ? '' : 's'} with assigned requirements.
          </p>

          <div className="mt-4 space-y-2">
            {employeeCompliance.map((ec) => (
              <div
                key={ec.employee.id}
                className="flex items-center justify-between rounded-lg border bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {ec.employee.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ec.total === 0
                      ? 'No compliance assigned'
                      : `${ec.completed}/${ec.total} requirements completed`}
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
                  {ec.total === 0 ? 'Not assigned' : `${ec.percent}%`}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Compliance Risk Queue
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            Employees with incomplete compliance requirements only.
          </p>

          <div className="mt-4 space-y-2">
            {complianceRiskEmployees.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                No compliance risks right now. Assigned employees are up to date.
              </div>
            ) : (
              complianceRiskEmployees.map((ec) => (
                <div
                  key={ec.employee.id}
                  className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {ec.employee.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ec.completed}/{ec.total} requirements completed
                    </p>
                  </div>
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    Compliance {ec.percent}%
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}