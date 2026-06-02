'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { createChecklistItem } from '@/lib/onboarding/createChecklistItem';
import { useUserAccess } from '@/hooks/useUserAccess';

export type ChecklistItem = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

export type OnboardingStep = ChecklistItem & {
  completed: boolean;
};

export function useOnboardingChecklist(flowId: string) {
  const { companyId, loading: userLoading } = useUserAccess();

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }

    if (!companyId || !flowId) {
      setItems([]);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      if (!companyId) {
        setLoading(false);
        return;
      }
      const resolvedCompanyId = companyId;

      const q = query(
        collection(
          db,
          'companies',
          resolvedCompanyId,
          'onboardingFlows',
          flowId,
          'checklistItems',
        ),
        orderBy('order', 'asc'),
      );

      const snap = await getDocs(q);

      const data: ChecklistItem[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ChecklistItem, 'id'>),
      }));

      setItems(data);
      setLoading(false);
    }

    load();
  }, [companyId, flowId, userLoading]);

  async function createItem(title: string, description?: string) {
    if (!companyId || !flowId || !title.trim()) return;

    const nextOrder =
      items.length === 0 ? 0 : Math.max(...items.map((i) => i.order)) + 1;

    const ref = await createChecklistItem({
      companyId,
      flowId,
      title: title.trim(),
      description: description?.trim() || null,
      order: nextOrder,
    });

    setItems((prev) => [
      ...prev,
      {
        id: ref.id,
        title: title.trim(),
        description: description?.trim() || undefined,
        order: nextOrder,
      },
    ]);
  }

  return {
    items,
    loading,
    createItem,
  };
}