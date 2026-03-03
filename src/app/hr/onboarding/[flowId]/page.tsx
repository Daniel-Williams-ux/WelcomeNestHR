'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useEmployees } from '@/hooks/useEmployees';
import { useOnboardingChecklist } from '@/hooks/useOnboardingChecklist';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function OnboardingFlowDetailPage() {
  const { flowId } = useParams<{ flowId: string }>();

  const { items, loading, createItem } = useOnboardingChecklist(flowId);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);


  const { user } = useUserAccess();
  const { companyId } = useCurrentCompany(user);
  const { employees, loading: employeesLoading } = useEmployees(
    companyId ?? undefined,
    100,
  );

  async function handleAdd() {
    if (!title.trim()) return;

    setSubmitting(true);
    await createItem(title.trim(), description.trim() || undefined);
    setTitle('');
    setDescription('');
    setSubmitting(false);
  }

 async function handleAssign() {
   if (!selectedEmployeeId) return;

   const employee = employees.find((e) => e.id === selectedEmployeeId);

   console.log('Selected employee ID:', selectedEmployeeId);
   console.log('Employee object:', employee);

   if (!employee || !employee.uid) {
     console.log('UID missing. Aborting.');
     return;
   }

   try {
     setAssigning(true);

     await setDoc(doc(db, 'users', employee.uid, 'onboardingFlows', flowId), {
       flowId,
       assignedAt: serverTimestamp(),
       status: 'active',
     });

     console.log('Assignment successful.');

     setSelectedEmployeeId('');
   } catch (err) {
     console.error('Assignment failed:', err);
   } finally {
     setAssigning(false);
   }
 }



  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading flow…</div>;
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* ─────────────────────────────────────────────
    ASSIGN FLOW TO EMPLOYEE
──────────────────────────────────────────── */}
      <div className="border rounded-md p-4 space-y-3 bg-white">
        <h2 className="text-sm font-medium text-gray-700">
          Assign this flow to employee
        </h2>

        {employeesLoading ? (
          <p className="text-sm text-gray-500">Loading employees…</p>
        ) : employees.length === 0 ? (
          <p className="text-sm text-gray-500">No employees found.</p>
        ) : (
          <div className="space-y-2">
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={selectedEmployeeId}
              onChange={(e) => {
                console.log('Changed to:', e.target.value);
                setSelectedEmployeeId(e.target.value);
              }}
            >
              <option value="">Select employee</option>

              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>

            {/* <button
              onClick={handleAssign}
              disabled={!selectedEmployeeId || assigning}
              className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : 'Assign flow'}
            </button> */}
            <button
              onClick={() => {
                console.log('Button clicked');
                handleAssign();
              }}
              disabled={!selectedEmployeeId || assigning}
              className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : 'Assign flow'}
            </button>
          </div>
        )}
      </div>
      <h1 className="text-xl font-semibold">Onboarding checklist</h1>

      {/* ─────────────────────────────────────────────
          CREATE ITEM
      ───────────────────────────────────────────── */}
      <div className="border rounded-md p-4 space-y-3 bg-gray-50">
        <input
          className="w-full border rounded-md px-3 py-2 text-sm"
          placeholder="Checklist item title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border rounded-md px-3 py-2 text-sm"
          placeholder="Description (optional)"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={handleAdd}
          disabled={submitting || !title.trim()}
          className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-50"
        >
          Add checklist item
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          LIST ITEMS
      ───────────────────────────────────────────── */}
      {items.length === 0 ? (
        <p className="text-gray-600">No checklist items yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="border rounded-md p-4 flex flex-col gap-1"
            >
              <span className="text-xs text-gray-400">
                Step {item.order + 1}
              </span>

              <h3 className="font-medium">{item.title}</h3>

              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}