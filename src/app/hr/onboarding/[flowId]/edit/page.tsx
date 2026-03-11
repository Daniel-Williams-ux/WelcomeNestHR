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

export default function EditFlowPage() {
  const { flowId } = useParams();
  const router = useRouter();
  const { companyId } = useHRSession();

  const [flowName, setFlowName] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

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

    const newItem = {
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
      name: flowName + ' (Copy)',
      createdAt: new Date(),
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

    router.push(`/hr/onboarding/flows/${newFlowRef.id}/edit`);
  }

  if (loading) {
    return <div className="p-6">Loading flow...</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-6">Edit Onboarding Flow</h1>

      <div className="mb-6 flex gap-3">
        <input
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          className="border rounded p-2 flex-1"
        />

        <button
          onClick={duplicateFlow}
          className="bg-gray-200 px-3 py-2 rounded"
        >
          Duplicate Flow
        </button>
      </div>

      <button
        onClick={addMilestone}
        className="mb-4 bg-blue-500 text-white px-3 py-1 rounded"
      >
        Add Milestone
      </button>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`border rounded p-3 flex gap-3 items-start ${
              item.type === 'milestone' ? 'bg-yellow-50 border-yellow-300' : ''
            }`}
          >
            <div className="flex flex-col gap-2">
              <button onClick={() => moveTask(index, 'up')} className="text-xs">
                ↑
              </button>

              <button
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
              onClick={() => handleDeleteTask(item.id)}
              className="text-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
