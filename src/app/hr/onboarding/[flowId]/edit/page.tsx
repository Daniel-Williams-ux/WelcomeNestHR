'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useHRSession } from '@/hooks/useHRSession';

type ChecklistItem = {
  id: string;
  title: string;
  description?: string;
  order: number;
  type?: 'task' | 'milestone';
};

const ITEMS_PER_PAGE = 8;

export default function EditFlowPage() {
  const { flowId } = useParams();
  const router = useRouter();
  const { companyId } = useHRSession();

  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingFlow, setSavingFlow] = useState(false);
  const [itemPage, setItemPage] = useState(1);

  useEffect(() => {
    if (!companyId || !flowId) return;

    async function load() {
      const flowRef = doc(
        db,
        'companies',
        companyId,
        'onboardingFlows',
        flowId as string,
      );

      const flowSnap = await getDoc(flowRef);

      if (flowSnap.exists()) {
        setFlowName(flowSnap.data().name ?? '');
        setFlowDescription(flowSnap.data().description ?? '');
      }

      const checklistRef = collection(
        db,
        'companies',
        companyId,
        'onboardingFlows',
        flowId as string,
        'checklistItems',
      );

      const snap = await getDocs(checklistRef);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChecklistItem, 'id'>),
      }));

      data.sort((a, b) => a.order - b.order);

      setItems(data);
      setLoading(false);
    }

    load();
  }, [companyId, flowId]);

  useEffect(() => {
    setItemPage(1);
  }, [flowId, items.length]);

  const totalItemPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const visibleItems = items.slice(
    (itemPage - 1) * ITEMS_PER_PAGE,
    itemPage * ITEMS_PER_PAGE,
  );

  async function saveFlowDetails() {
    if (!companyId || !flowId || !flowName.trim()) return;

    setSavingFlow(true);

    try {
      await updateDoc(
        doc(db, 'companies', companyId, 'onboardingFlows', flowId as string),
        {
          name: flowName.trim(),
          description: flowDescription.trim() || null,
          updatedAt: serverTimestamp(),
        },
      );
    } finally {
      setSavingFlow(false);
    }
  }

  async function handleUpdateTask(
    taskId: string,
    field: 'title' | 'description',
    value: string,
  ) {
    if (!companyId || !flowId) return;

    const ref = doc(
      db,
      'companies',
      companyId,
      'onboardingFlows',
      flowId as string,
      'checklistItems',
      taskId,
    );

    await updateDoc(ref, { [field]: value });

    setItems((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)),
    );
  }

  async function handleDeleteTask(taskId: string) {
    if (!companyId || !flowId) return;

    const ref = doc(
      db,
      'companies',
      companyId,
      'onboardingFlows',
      flowId as string,
      'checklistItems',
      taskId,
    );

    await deleteDoc(ref);

    setItems((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function moveTask(index: number, direction: 'up' | 'down') {
    const newItems = [...items];

    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[swapIndex];
    newItems[swapIndex] = temp;

    newItems.forEach((item, i) => (item.order = i));

    setItems(newItems);

    for (const item of newItems) {
      const ref = doc(
        db,
        'companies',
        companyId!,
        'onboardingFlows',
        flowId as string,
        'checklistItems',
        item.id,
      );

      await updateDoc(ref, { order: item.order });
    }
  }

  async function addMilestone() {
    if (!companyId || !flowId) return;

    const newItem: Omit<ChecklistItem, 'id'> = {
      title: 'New Milestone',
      description: '',
      order: items.length,
      type: 'milestone',
    };

    const ref = await addDoc(
      collection(
        db,
        'companies',
        companyId,
        'onboardingFlows',
        flowId as string,
        'checklistItems',
      ),
      newItem,
    );

    setItems([...items, { id: ref.id, ...newItem }]);
  }

  async function duplicateFlow() {
    if (!companyId || !flowId) return;

    const newFlowRef = doc(
      collection(db, 'companies', companyId, 'onboardingFlows'),
    );

    await setDoc(newFlowRef, {
      name: `${flowName || 'Untitled onboarding flow'} (Copy)`,
      description: flowDescription || null,
      isActive: false,
      createdAt: serverTimestamp(),
    });

    for (const item of items) {
      await addDoc(
        collection(
          db,
          'companies',
          companyId,
          'onboardingFlows',
          newFlowRef.id,
          'checklistItems',
        ),
        {
          title: item.title,
          description: item.description || '',
          order: item.order,
          type: item.type || 'task',
        },
      );
    }

    router.push(`/hr/onboarding/${newFlowRef.id}/edit`);
  }

  if (loading) {
    return <div className="p-6">Loading flow...</div>;
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#008FA1]">
          Editing onboarding template
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
          {flowName || 'Untitled onboarding flow'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Flow ID: <span className="font-mono">{flowId as string}</span>
        </p>
      </div>

      <section className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-[#006e7f] dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-100">
        <p className="font-semibold">Keep templates separate.</p>
        <p className="mt-1 leading-6">
          You are editing one specific onboarding flow. Use the flow name and ID
          above to confirm you are editing James&apos;s flow, Beauty&apos;s flow,
          or a reusable role template.
        </p>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Flow name
              <input
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="block text-sm font-medium">
              Description
              <textarea
                value={flowDescription}
                onChange={(e) => setFlowDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          </div>
          <div className="flex flex-col gap-2 md:w-44">
            <button
              type="button"
              onClick={saveFlowDetails}
              disabled={savingFlow || !flowName.trim()}
              className="rounded-md bg-[#00ACC1] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingFlow ? 'Saving...' : 'Save details'}
            </button>
            <button
              type="button"
              onClick={duplicateFlow}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            >
              Duplicate Flow
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={addMilestone}
        className="mb-4 bg-blue-500 text-white px-3 py-1 rounded"
      >
        Add Milestone
      </button>

      <div className="space-y-3">
        {visibleItems.map((item, pageIndex) => {
          const index = (itemPage - 1) * ITEMS_PER_PAGE + pageIndex;

          return (
            <div
              key={item.id}
              className={`border rounded p-3 flex gap-3 items-start ${
                item.type === 'milestone' ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            >
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => moveTask(index, 'up')}
                  className="text-xs"
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() => moveTask(index, 'down')}
                  className="text-xs"
                >
                  ↓
                </button>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <input
                  value={item.title}
                  onChange={(e) =>
                    handleUpdateTask(item.id, 'title', e.target.value)
                  }
                  className="border rounded px-2 py-1"
                />

                <input
                  value={item.description || ''}
                  placeholder="Description"
                  onChange={(e) =>
                    handleUpdateTask(item.id, 'description', e.target.value)
                  }
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => handleDeleteTask(item.id)}
                className="text-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>

      {items.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Checklist page {itemPage} of {totalItemPages} · {items.length} items
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setItemPage((value) => Math.max(1, value - 1))}
              disabled={itemPage === 1}
              className="rounded-md border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setItemPage((value) => Math.min(totalItemPages, value + 1))
              }
              disabled={itemPage === totalItemPages}
              className="rounded-md bg-[#00ACC1] px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
