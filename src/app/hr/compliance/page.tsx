'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { useUserAccess } from '@/hooks/useUserAccess';

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
  const [type, setType] = useState('');

  const [modules, setModules] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [onboardingProgress, setOnboardingProgress] = useState<
    Record<string, OnboardingProgress>
  >({});

  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');

  const [loading, setLoading] = useState(true);

  const [assignments, setAssignments] = useState<any[]>([]);

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
        ...doc.data(),
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
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
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
      title,
      description,
      type,
      createdAt: serverTimestamp(),
    });

    setTitle('');
    setDescription('');
    setType('');
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

      const payload = {
        moduleId,
        employeeId,
        status: 'pending',
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

      return moduleAssignments.some((a) => a.status === 'completed');
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
            Manage training, assignments, and compliance tracking.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#00ACC1] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90"
        >
          {showForm ? 'Close' : 'Create Training'}
        </button>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="border rounded-2xl p-4 bg-white space-y-4">
          <h2 className="font-medium text-gray-900">New Training Module</h2>

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select type</option>
            <option value="policy">Policy</option>
            <option value="training">Training</option>
          </select>

          <button
            onClick={handleSave}
            className="bg-[#004d59] text-white px-4 py-2 rounded-lg text-sm"
          >
            Save Module
          </button>
        </div>
      )}

      {/* ================= MODULES ================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Training Modules</h2>

        {modules.length === 0 && (
          <div className="text-sm text-gray-500">
            No training modules yet. Create your first training to begin
            compliance tracking.
          </div>
        )}

        {modules.map((module) => (
          <div key={module.id} className="border rounded-xl p-4 bg-white">
            <h3 className="font-medium text-gray-900">{module.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{module.description}</p>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {module.type}
              </span>

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