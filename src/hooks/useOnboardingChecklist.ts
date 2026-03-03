'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { createChecklistItem } from '@/lib/onboarding/createChecklistItem';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';

export type ChecklistItem = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

export function useOnboardingChecklist(flowId: string) {
  const { user, loading: userLoading } = useUserAccess();
  const { companyId, loading: companyLoading } = useCurrentCompany(user);

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading || companyLoading || !companyId || !flowId) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);

      const q = query(
        collection(
          db,
          'companies',
          companyId,
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
  }, [companyId, flowId, userLoading, companyLoading]);

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