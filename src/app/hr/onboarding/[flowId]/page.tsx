'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useEmployees } from '@/hooks/useEmployees';
import { useOnboardingChecklist } from '@/hooks/useOnboardingChecklist';
import { assignOnboardingFlowToEmployee } from '@/lib/onboarding/assignOnboardingFlow';
import Link from 'next/link';

export default function OnboardingFlowDetailPage() {
  const { flowId } = useParams<{ flowId: string }>();

  const { items, loading, createItem } = useOnboardingChecklist(flowId);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);


  const { companyId } = useUserAccess();
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
  if (!selectedEmployeeId || !companyId) return;

  try {
    setAssigning(true);

    await assignOnboardingFlowToEmployee(companyId, selectedEmployeeId, flowId);

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
      <section className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-[#006e7f] dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-100">
        <p className="font-semibold">This is a reusable onboarding template.</p>
        <p className="mt-1 leading-6">
          Checklist items added here will apply to every employee assigned this
          flow. If James needs a separate checklist from Beauty, create a new
          flow for James or that role before assigning it.
        </p>
      </section>

      {/* ─────────────────────────────────────────────
    ASSIGN FLOW TO EMPLOYEE
──────────────────────────────────────────── */}
      <div className="border rounded-md p-4 space-y-3 bg-white dark:border-slate-800 dark:bg-slate-900">
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
              className="w-full border rounded-md px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
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
              type="button"
              onClick={handleAssign}
              disabled={!selectedEmployeeId || assigning}
              className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : 'Assign flow'}
            </button>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Template checklist</h1>

        <Link
          href={`/hr/onboarding/${flowId}/edit`}
          className="px-3 py-2 text-sm bg-gray-200 rounded"
        >
          Edit Flow
        </Link>
      </div>

      {/* ─────────────────────────────────────────────
          CREATE ITEM
      ───────────────────────────────────────────── */}
      <div className="border rounded-md p-4 space-y-3 bg-gray-50 dark:border-slate-800 dark:bg-slate-900">
        <input
          className="w-full border rounded-md px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          placeholder="Checklist item title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border rounded-md px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
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
              className="border rounded-md p-4 flex flex-col gap-1 dark:border-slate-800 dark:bg-slate-900"
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