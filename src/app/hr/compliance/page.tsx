'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function HRCompliancePage() {
  
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');

  const [modules, setModules] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [assignments, setAssignments] = useState<any[]>([]);


  // =========================
  // FETCH COMPANY ID
  // =========================
  const fetchCompanyId = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        setCompanyId(userDoc.data().companyId);
      }
    } catch (error) {
      console.error('Error fetching companyId:', error);
    } finally {
      setLoading(false);
    }
  };

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

    setEmployees(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    );
  };

  const fetchAssignments = async (companyId: string) => {
    try {
      const snapshot = await getDocs(
        collection(db, 'companies', companyId, 'complianceAssignments'),
      );

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
          setCompanyId(userDoc.data().companyId);
        }
      } catch (error) {
        console.error('Error fetching companyId:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!companyId) return;

    fetchModules(companyId);
    fetchEmployees(companyId);
    fetchAssignments(companyId);

    const interval = setInterval(() => {
      fetchAssignments(companyId);
    }, 3000); // refresh every 3s

    return () => clearInterval(interval);
  }, [companyId]);

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
      console.log('❌ Missing employeeId or companyId', {
        employeeId,
        companyId,
      });
      return;
    }

    console.log('🚀 Assign clicked', { moduleId, employeeId, companyId });

    try {
      console.log('🚀 START ASSIGNMENT');

      const payload = {
        moduleId,
        employeeId,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      console.log('📦 Payload:', payload);
      console.log('🏢 companyId:', companyId);

      const docRef = await addDoc(
        collection(db, 'companies', companyId, 'complianceAssignments'),
        payload,
      );

      console.log('✅ SUCCESS:', docRef.id);

      setEmployeeId('');
      setAssigningId(null);

      fetchAssignments(companyId);
    } catch (error) {
      console.error('❌ Assignment failed:', error);
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

  const uniqueModules = Array.from(
    new Set(validAssignments.map((a) => a.moduleId)),
  );

  const completedModules = uniqueModules.filter((moduleId) => {
    const moduleAssignments = validAssignments.filter(
      (a) => a.moduleId === moduleId,
    );

    return moduleAssignments.some((a) => a.status === 'completed');
  });

  const complianceRate =
    uniqueModules.length === 0
      ? 0
      : Math.round((completedModules.length / uniqueModules.length) * 100);
  
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

  const atRiskEmployees = employeeCompliance
    .filter((ec) => ec.total > 0 && ec.percent < 100)
    .sort((a, b) => a.percent - b.percent);

  return (
    <div className="p-6 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Compliance</h1>
          <p className="text-sm text-gray-600 mt-1">
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
                  onClick={() => {
                    console.log('🔥 BUTTON CLICKED');
                    handleAssign(module.id);
                  }}
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
        <p className="text-sm text-gray-600">
          Compliance Rate: {complianceRate}%
        </p>

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
              All employees are compliant 
            </p>
          ) : (
            atRiskEmployees.map((ec) => (
              <div
                key={ec.employee.id}
                className="p-3 border rounded-lg bg-red-50 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium">{ec.employee.name}</p>
                  <p className="text-xs text-gray-500">
                    {ec.completed}/{ec.total} modules
                  </p>
                </div>

                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                  {ec.percent}%
                </span>
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